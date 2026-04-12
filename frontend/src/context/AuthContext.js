import React, { createContext, useState, useEffect, useContext, useRef, useMemo } from 'react';
import { InteractionManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/auth/authService';
import { notificationService } from '../services/api/notificationService';
import { authProfileService } from '../services/auth/authProfileService';
import { profileCache } from '../services/bootstrap/profileCache';
import { perfLogger } from '../services/diagnostics/perfLogger';
import { logNetworkRegionDebug } from '../services/diagnostics/networkRegionDebug';
import { presenceRepository } from '../services/repositories/PresenceRepository';
import { appPreloadService } from '../services/bootstrap/appPreloadService';
import { getDeviceIdentity } from '../services/auth/deviceIdentity';
import { useToast } from './ToastContext';

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
const ACCOUNT_DELETION_FLAG_PREFIX = 'accountDeletionPending:';

const decideInitialRoute = (user, profile) => {
    if (!user) return ROUTE_TARGETS.UNAUTH;
    if (!profile?.onboardingCompleted) return ROUTE_TARGETS.PROFILE_SETUP;
    return ROUTE_TARGETS.APP;
};

const decideCachedRoute = (user, profile) => {
    if (!user) return ROUTE_TARGETS.UNAUTH;
    // Only use cached profile data to fast-path known completed users into the app.
    // Incomplete cached profiles may be stale, so let the network profile confirm
    // before forcing users back through profile setup.
    if (profile?.onboardingCompleted) return ROUTE_TARGETS.APP;
    return null;
};

export const AuthProvider = ({ children, onAuthReady }) => {
    const { showToast } = useToast();
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [bootPhase, setBootPhase] = useState(BOOT_PHASES.AUTH_RESOLVING);
    const [routeTarget, setRouteTarget] = useState(ROUTE_TARGETS.UNAUTH);
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    const profileUnsubscribeRef = useRef(null);
    const presenceCleanupRef = useRef(null);
    const activeAuthUidRef = useRef(null);
    const authStartRef = useRef(Date.now());
    const hasNotifiedAuthReadyRef = useRef(false);
    const networkProfileBootstrappedRef = useRef(false);
    const preloadedUidRef = useRef(null);
    const loginDeviceReportedRef = useRef('');
    const timezoneSyncedRef = useRef('');

    const waitForProfileBootstrap = async (uid, timeoutMs = 4000) => {
        const start = Date.now();
        while ((Date.now() - start) < timeoutMs) {
            await new Promise((resolve) => setTimeout(resolve, 250));
            const profile = await authProfileService.getProfile(uid).catch(() => null);
            if (profile) {
                return profile;
            }
        }
        return null;
    };

    const loading = bootPhase !== BOOT_PHASES.READY;
    const runAfterUiSettles = (task) => {
        InteractionManager.runAfterInteractions(() => {
            Promise.resolve()
                .then(task)
                .catch(() => {});
        });
    };

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
        notificationService.setForegroundWarningHandler((data) => {
            const message = String(data?.message || '').trim() || 'This huddle will end automatically in 2 minutes.';
            showToast(message, 'warning');
        });
        return () => {
            notificationService.setForegroundWarningHandler(null);
            notificationService.cleanupNotificationRouting();
        };
    }, [showToast]);

    useEffect(() => {
        authService.init('433309283212-04ikkhvl2deu6k7qu5kj9cl80q2rcfgu.apps.googleusercontent.com');

        const unsubscribe = authService.onAuthStateChanged(async (currentUser) => {
            perfLogger.log('time_to_auth_resolve', Date.now() - authStartRef.current);
            console.log('[BOOT] Auth state changed', { uid: currentUser?.uid || null });

            const nextUid = currentUser?.uid || null;
            const sameAuthenticatedUser =
                Boolean(nextUid)
                && activeAuthUidRef.current === nextUid
                && profileUnsubscribeRef.current
                && networkProfileBootstrappedRef.current;

            if (sameAuthenticatedUser) {
                setUser((previous) => previous || currentUser);
                return;
            }

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
                activeAuthUidRef.current = null;
                setUserData(null);
                setRouteTarget(ROUTE_TARGETS.UNAUTH);
                setBootPhase(BOOT_PHASES.READY);
                preloadedUidRef.current = null;
                loginDeviceReportedRef.current = '';
                timezoneSyncedRef.current = '';
                return;
            }

            setBootPhase(BOOT_PHASES.PROFILE_RESOLVING);
            activeAuthUidRef.current = currentUser.uid;

            const cachedProfile = await profileCache.load(currentUser.uid);
            if (cachedProfile) {
                setUserData(cachedProfile);
                const cachedRoute = decideCachedRoute(currentUser, cachedProfile);
                if (cachedRoute) {
                    setRouteTarget(cachedRoute);
                    setBootPhase(BOOT_PHASES.READY);
                    console.log('[BOOT] Route decision from cached profile:', cachedRoute);
                } else {
                    console.log('[BOOT] Cached profile requires network confirmation before routing', {
                        uid: currentUser.uid,
                        onboardingCompleted: Boolean(cachedProfile?.onboardingCompleted),
                    });
                }
            }

            profileUnsubscribeRef.current = authProfileService.subscribeToProfile(
                currentUser.uid,
                async (profile) => {
                    let resolvedProfile = profile;
                    if (!resolvedProfile) {
                        console.log('[BOOT] No profile found for authenticated user', { uid: currentUser.uid });
                        const deletionFlag = await AsyncStorage.getItem(`${ACCOUNT_DELETION_FLAG_PREFIX}${currentUser.uid}`);
                        if (deletionFlag === '1') {
                            await profileCache.clear(currentUser.uid).catch(() => {});
                            setUserData(null);
                            setRouteTarget(ROUTE_TARGETS.UNAUTH);
                            setBootPhase(BOOT_PHASES.READY);
                            await authService.logout().catch(() => {});
                            return;
                        }
                        console.log('[BOOT] Waiting for profile bootstrap grace period', { uid: currentUser.uid });
                        resolvedProfile = await waitForProfileBootstrap(currentUser.uid);
                        if (resolvedProfile) {
                            console.log('[BOOT] Profile appeared during grace period', { uid: currentUser.uid });
                        }
                    }

                    if (!resolvedProfile) {
                        await profileCache.clear(currentUser.uid).catch(() => {});
                        setUserData(null);
                        setRouteTarget(ROUTE_TARGETS.UNAUTH);
                        setBootPhase(BOOT_PHASES.READY);
                        await authService.logout().catch(() => {});
                        return;
                    }

                    const normalizedProfile = resolvedProfile;
                    setUserData(normalizedProfile);
                    await profileCache.save(currentUser.uid, normalizedProfile);

                    if (loginDeviceReportedRef.current !== currentUser.uid) {
                        loginDeviceReportedRef.current = currentUser.uid;
                        runAfterUiSettles(async () => {
                            const deviceIdentity = await getDeviceIdentity();
                            await authService.recordLoginDevice(deviceIdentity);
                        });
                    }

                    const currentTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
                    const timezoneSyncKey = `${currentUser.uid}:${currentTz}`;
                    if (timezoneSyncedRef.current !== timezoneSyncKey) {
                        timezoneSyncedRef.current = timezoneSyncKey;
                        runAfterUiSettles(async () => {
                            await authProfileService.updateProfile(currentUser.uid, { timezone: currentTz });
                        });
                    }

                    if (!presenceCleanupRef.current) {
                        presenceCleanupRef.current = presenceRepository.startPresence(currentUser.uid);
                    }

                    runAfterUiSettles(async () => {
                        await notificationService.registerForPushNotificationsAsync(currentUser.uid);
                    });

                    if (preloadedUidRef.current !== currentUser.uid) {
                        preloadedUidRef.current = currentUser.uid;
                        runAfterUiSettles(async () => {
                            await appPreloadService.preloadForUser(currentUser.uid);
                        });
                    }

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
                    setUserData(null);
                    setRouteTarget(ROUTE_TARGETS.UNAUTH);
                    setBootPhase(BOOT_PHASES.READY);
                    networkProfileBootstrappedRef.current = true;
                }
            );
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
            const refreshedUser = await authService.refreshCurrentUser();
            setUser(refreshedUser ? { ...refreshedUser } : null);
        }
    };

    const deleteAccount = async () => {
        const uid = user?.uid;
        if (!uid) {
            throw new Error('No authenticated user.');
        }

        await AsyncStorage.setItem(`${ACCOUNT_DELETION_FLAG_PREFIX}${uid}`, '1');
        try {
            await authService.deleteAccount();
            await logout().catch(() => {});
            await profileCache.clear(uid).catch(() => {});
            await AsyncStorage.removeItem(`${ACCOUNT_DELETION_FLAG_PREFIX}${uid}`).catch(() => {});
        } catch (error) {
            await AsyncStorage.removeItem(`${ACCOUNT_DELETION_FLAG_PREFIX}${uid}`).catch(() => {});
            throw error;
        }
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
