import React, { createContext, useState, useEffect, useContext, useRef, useMemo } from 'react';
import { authService } from '../services/auth/authService';
import { notificationService } from '../services/api/notificationService';
import { profileRepository } from '../services/repositories/ProfileRepository';
import { profileCache } from '../services/bootstrap/profileCache';
import { perfLogger } from '../services/diagnostics/perfLogger';
import { logNetworkRegionDebug } from '../services/diagnostics/networkRegionDebug';
import { presenceRepository } from '../services/repositories/PresenceRepository';
import { callableClient } from '../services/api/callableClient';
import { appPreloadService } from '../services/bootstrap/appPreloadService';

export const AuthContext = createContext(undefined);

const BOOT_PHASES = {
    AUTH_RESOLVING: 'AUTH_RESOLVING',
    PROFILE_RESOLVING: 'PROFILE_RESOLVING',
    READY: 'READY'
};

const ROUTE_TARGETS = {
    UNAUTH: 'UNAUTH',
    PROFILE_SETUP: 'PROFILE_SETUP',
    APP: 'APP'
};

const decideInitialRoute = (user, profile) => {
    if (!user) return ROUTE_TARGETS.UNAUTH;
    // UX decision: authenticated users should land in-app directly.
    // Profile setup remains optional and should be user-initiated, not forced on boot.
    return ROUTE_TARGETS.APP;
};

export const AuthProvider = ({ children, onAuthReady }) => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [bootPhase, setBootPhase] = useState(BOOT_PHASES.AUTH_RESOLVING);
    const [routeTarget, setRouteTarget] = useState(ROUTE_TARGETS.UNAUTH);
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    const profileUnsubscribeRef = useRef(null);
    const presenceCleanupRef = useRef(null);
    const authStartRef = useRef(Date.now());
    const hasNotifiedAuthReadyRef = useRef(false);
    const networkProfileBootstrappedRef = useRef(false);
    const preloadedUidRef = useRef(null);

    const loading = bootPhase !== BOOT_PHASES.READY;

    useEffect(() => {
        logNetworkRegionDebug();
        perfLogger.mark('app_boot');
        perfLogger.mark('auth_resolve_start');
    }, []);

    useEffect(() => {
        if (bootPhase === BOOT_PHASES.READY && !hasNotifiedAuthReadyRef.current) {
            hasNotifiedAuthReadyRef.current = true;
            onAuthReady?.();
        }
    }, [bootPhase, onAuthReady]);

    useEffect(() => {
        notificationService.initializeNotificationRouting();
        return () => {
            notificationService.cleanupNotificationRouting();
        };
    }, []);

    useEffect(() => {
        authService.init('433309283212-04ikkhvl2deu6k7qu5kj9cl80q2rcfgu.apps.googleusercontent.com');

        const unsubscribe = authService.onAuthStateChanged(async (currentUser) => {
            perfLogger.log('time_to_auth_resolve', Date.now() - authStartRef.current);
            networkProfileBootstrappedRef.current = false;

            if (profileUnsubscribeRef.current) {
                profileUnsubscribeRef.current();
                profileUnsubscribeRef.current = null;
            }
            if (presenceCleanupRef.current) {
                await presenceCleanupRef.current();
                presenceCleanupRef.current = null;
            }

            setUser(currentUser);

            if (!currentUser) {
                setUserData(null);
                setRouteTarget(ROUTE_TARGETS.UNAUTH);
                setBootPhase(BOOT_PHASES.READY);
                preloadedUidRef.current = null;
                return;
            }

            setBootPhase(BOOT_PHASES.PROFILE_RESOLVING);

            const cachedProfile = await profileCache.load(currentUser.uid);
            if (cachedProfile) {
                setUserData(cachedProfile);
                setRouteTarget(decideInitialRoute(currentUser, cachedProfile));
                setBootPhase(BOOT_PHASES.READY);
                console.log('[BOOT] Route decision from cached profile:', decideInitialRoute(currentUser, cachedProfile));
            }

            profileUnsubscribeRef.current = profileRepository.subscribeToProfile(
                currentUser.uid,
                async (profile) => {
                    let normalizedProfile = profile;

                    if (!profile) {
                        normalizedProfile = {
                            uid: currentUser.uid,
                            email: currentUser.email || '',
                            name: currentUser.displayName || '',
                            photoURL: currentUser.photoURL || '',
                            role: 'personal',
                            onboardingCompleted: false
                        };
                        await profileRepository.ensureProfile(currentUser.uid, normalizedProfile);
                    }

                    setUserData(normalizedProfile);
                    await profileCache.save(currentUser.uid, normalizedProfile);

                    if (networkProfileBootstrappedRef.current) {
                        // After bootstrap is complete, keep profile fresh but avoid re-running boot routing/perf.
                        return;
                    }

                    const decidedRoute = decideInitialRoute(currentUser, normalizedProfile);
                    setRouteTarget(decidedRoute);
                    setBootPhase(BOOT_PHASES.READY);
                    networkProfileBootstrappedRef.current = true;

                    perfLogger.log('time_to_profile_ready', perfLogger.elapsedSince('auth_resolve_start'));
                    console.log('[BOOT] Route decision from network profile:', decidedRoute);
                },
                (error) => {
                    console.error('[BOOT] Profile listener failed:', error);
                    const fallbackProfile = {
                        uid: currentUser.uid,
                        email: currentUser.email || '',
                        name: currentUser.displayName || '',
                        photoURL: currentUser.photoURL || '',
                        role: 'personal',
                        onboardingCompleted: false
                    };
                    setUserData(fallbackProfile);
                    setRouteTarget(decideInitialRoute(currentUser, fallbackProfile));
                    setBootPhase(BOOT_PHASES.READY);
                    networkProfileBootstrappedRef.current = true;
                }
            );

            presenceCleanupRef.current = presenceRepository.startPresence(currentUser.uid);

            notificationService.registerForPushNotificationsAsync(currentUser.uid).catch((e) => {
                console.warn('[AuthContext] Push registration failed', e?.message || e);
            });

            if (preloadedUidRef.current !== currentUser.uid) {
                preloadedUidRef.current = currentUser.uid;
                appPreloadService.preloadForUser(currentUser.uid).catch((e) => {
                    console.warn('[BOOT] App preload failed', e?.message || e);
                });
            }
        });

        const safetyTimer = setTimeout(() => {
            setBootPhase((prev) => {
                if (prev !== BOOT_PHASES.READY) {
                    console.warn('[BOOT] Timeout reached. Forcing app bootstrap readiness.');
                }
                return BOOT_PHASES.READY;
            });
        }, 12000);

        return () => {
            unsubscribe();
            if (profileUnsubscribeRef.current) {
                profileUnsubscribeRef.current();
            }
            if (presenceCleanupRef.current) {
                presenceCleanupRef.current().catch(() => {});
            }
            clearTimeout(safetyTimer);
        };
    }, []);

    const login = async (email, password) => {
        setIsAuthenticating(true);
        try {
            return await authService.login(email, password);
        } catch (error) {
            return { success: false, error: error.message };
        } finally {
            setIsAuthenticating(false);
        }
    };

    const register = async (email, password, name) => {
        setIsAuthenticating(true);
        try {
            const result = await authService.register(email, password, name);
            if (result.success) {
                return { success: true };
            }
            return { success: false, error: 'Registration failed' };
        } catch (error) {
            return { success: false, error: error.message };
        } finally {
            setIsAuthenticating(false);
        }
    };

    const logout = async () => {
        const uid = user?.uid;
        if (uid) {
            await profileCache.clear(uid);
            await presenceRepository.markOffline(uid).catch(() => {});
        }
        return authService.logout();
    };

    const loginWithGoogle = async () => {
        setIsAuthenticating(true);
        try {
            return await authService.loginWithGoogle();
        } finally {
            setIsAuthenticating(false);
        }
    };

    const loginWithApple = async () => {
        setIsAuthenticating(true);
        try {
            return await authService.loginWithApple();
        } finally {
            setIsAuthenticating(false);
        }
    };

    const refreshUser = async () => {
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
            await currentUser.reload();
            setUser({ ...authService.getCurrentUser() });
        }
    };

    const deleteAccount = async () => {
        // Still Functions-backed (privileged + cascade deletes).
        // Implemented in backend as deleteUserAccount callable.
        await callableClient.invokeWithAuth('deleteUserAccount', {});
        await logout();
        return { success: true };
    };

    const contextValue = useMemo(
        () => ({
            user,
            userData,
            loading,
            isAuthenticating,
            routeTarget,
            bootPhase,
            login,
            register,
            logout,
            deleteAccount,
            loginWithGoogle,
            loginWithApple,
            refreshUser
        }),
        [user, userData, loading, isAuthenticating, routeTarget, bootPhase]
    );

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
