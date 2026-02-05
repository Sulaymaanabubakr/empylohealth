import React, { createContext, useState, useEffect, useContext } from 'react';
console.log('[PERF] AuthContext.js: Module evaluating');
import { View, Image, ActivityIndicator, Text } from 'react-native';
import { TYPOGRAPHY } from '../theme/theme';
import { authService } from '../services/auth/authService';
import { userService } from '../services/api/userService';
import { db } from '../services/firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';
import { notificationService } from '../services/api/notificationService';

export const AuthContext = createContext(undefined);

export const AuthProvider = ({ children, onAuthReady }) => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    // Notify parent when auth state is determined (fast - from cache)
    useEffect(() => {
        if (!loading) {
            console.log('[PERF] AuthContext: Auth resolved, calling onAuthReady');
            onAuthReady?.();
        }
    }, [loading, onAuthReady]);

    const userUnsubscribeRef = React.useRef(null);

    // Listen for auth state changes
    useEffect(() => {
        console.log('[PERF] AuthContext: Initializing...');
        const initStartTime = Date.now();

        // Initialize Google Sign In
        try {
            console.log('[PERF] AuthContext: calling authService.init');
            authService.init('433309283212-04ikkhvl2deu6k7qu5kj9cl80q2rcfgu.apps.googleusercontent.com');
            console.log('[PERF] AuthContext: authService.init complete');
        } catch (e) {
            console.error('[PERF] AuthContext: authService.init FAILED', e);
        }

        const unsubscribe = authService.onAuthStateChanged(async (currentUser) => {
            console.log('[PERF] AuthContext: Auth state changed', currentUser ? 'Authenticated' : 'Not authenticated', `${Date.now() - initStartTime}ms`);

            // Cleanup previous user listener if it exists
            if (userUnsubscribeRef.current) {
                userUnsubscribeRef.current();
                userUnsubscribeRef.current = null;
            }

            setUser(currentUser);

            // Set loading=false immediately to unblock UI rendering
            setLoading(false);

            if (currentUser) {
                // Subscribe to user document changes (background load)
                const userRef = doc(db, 'users', currentUser.uid);
                userUnsubscribeRef.current = onSnapshot(userRef, (doc) => {
                    console.log('[PERF] AuthContext: User data loaded', `${Date.now() - initStartTime}ms`);
                    if (doc.exists()) {
                        setUserData(doc.data());
                    } else {
                        // If doc doesn't exist yet (very fresh account), use auth profile
                        setUserData({
                            uid: currentUser.uid,
                            email: currentUser.email || '',
                            name: currentUser.displayName || ''
                        });
                    }
                }, (error) => {
                    console.error("AuthContext: User listener error", error);
                    // Fallback
                    setUserData({
                        uid: currentUser.uid,
                        email: currentUser.email || '',
                        name: currentUser.displayName || ''
                    });
                });

                // Register push tokens once per session
                notificationService.registerForPushNotificationsAsync(currentUser.uid).catch((e) => {
                    console.warn('[AuthContext] Push registration failed', e?.message || e);
                });
            } else {
                setUserData(null);
            }
        });

        // Safety timeout in case auth listener never fires (rare but possible offline/error)
        const safetyTimer = setTimeout(() => {
            setLoading((prev) => {
                if (prev) console.warn("[PERF] AuthContext: Loading timed out, forcing app entry.");
                return false;
            });
        }, 10000); // Increased to 10s for production reliability

        return () => {
            unsubscribe();
            if (userUnsubscribeRef.current) {
                userUnsubscribeRef.current();
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
        } catch (error) {
            return { success: false, error: error.message };
        } finally {
            setIsAuthenticating(false);
        }
    };

    const logout = async () => {
        return await authService.logout();
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
            setUser({ ...authService.getCurrentUser() }); // Spread to trigger state update
        }
    };

    return (
        <AuthContext.Provider value={{ user, userData, loading, isAuthenticating, login, register, logout, loginWithGoogle, loginWithApple, refreshUser }}>
            {(loading || isAuthenticating) ? (
                <View style={{ flex: 1, backgroundColor: '#00A99D', justifyContent: 'center', alignItems: 'center' }}>
                    <Image
                        source={require('../assets/images/logo_white.png')}
                        style={{ width: '50%', height: undefined, aspectRatio: 1, marginBottom: 40 }}
                        resizeMode="contain"
                    />
                    <ActivityIndicator size="large" color="#FFFFFF" />
                    {isAuthenticating && (
                        <Text style={{ color: '#FFFFFF', marginTop: 20, ...TYPOGRAPHY.body, fontWeight: '600' }}>
                            Processing...
                        </Text>
                    )}
                </View>
            ) : (
                children
            )}
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
