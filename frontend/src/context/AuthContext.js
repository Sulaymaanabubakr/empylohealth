import React, { createContext, useState, useEffect, useContext } from 'react';
import { View, Image, ActivityIndicator } from 'react-native';
import { authService } from '../services/auth/authService';
import { userService } from '../services/api/userService';
import { db } from '../services/firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';
import { notificationService } from '../services/api/notificationService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    const userUnsubscribeRef = React.useRef(null);

    // Listen for auth state changes
    useEffect(() => {
        console.log('[PERF] AuthContext: Initializing...');
        const initStartTime = Date.now();

        // Initialize Google Sign In
        authService.init('433309283212-04ikkhvl2deu6k7qu5kj9cl80q2rcfgu.apps.googleusercontent.com');

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
                        setUserData({ email: currentUser.email, name: currentUser.displayName });
                    }
                }, (error) => {
                    console.error("AuthContext: User listener error", error);
                    // Fallback
                    setUserData({ email: currentUser.email, name: currentUser.displayName });
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
        }, 2000); // 2 seconds max wait (reduced from 5s)

        return () => {
            unsubscribe();
            if (userUnsubscribeRef.current) {
                userUnsubscribeRef.current();
            }
            clearTimeout(safetyTimer);
        };
    }, []);

    const login = async (email, password) => {
        try {
            return await authService.login(email, password);
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const register = async (email, password, name, role = 'personal') => {
        try {
            const result = await authService.register(email, password, name);
            if (result.success) {
                // Backend Trigger onUserCreate will create the firestore document.
                // We just return success.
                return { success: true };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const logout = async () => {
        return await authService.logout();
    };

    const loginWithGoogle = async () => {
        return await authService.loginWithGoogle();
    };

    const loginWithApple = async () => {
        return await authService.loginWithApple();
    };

    return (
        <AuthContext.Provider value={{ user, userData, loading, login, register, logout, loginWithGoogle, loginWithApple }}>
            {loading ? (
                <View style={{ flex: 1, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center' }}>
                    {/* Use ActivityIndicator for better reliability during app boot */}
                    {/* <Image source={require('../../assets/splash-icon.png')} ... /> */}
                    <ActivityIndicator size="large" color="#4DB6AC" />
                </View>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
