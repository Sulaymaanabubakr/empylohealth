import React, { createContext, useState, useEffect, useContext } from 'react';
import { View, Image } from 'react-native';
import { authService } from '../services/auth/authService';
import { userService } from '../services/api/userService';
import { notificationService } from '../services/api/notificationService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Listen for auth state changes
    useEffect(() => {
        // Initialize Google Sign In
        authService.init('433309283212-04ikkhvl2deu6k7qu5kj9cl80q2rcfgu.apps.googleusercontent.com');

        const unsubscribe = authService.onAuthStateChanged(async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                try {
                    // Fetch user data from Service
                    const data = await userService.getUserDocument(currentUser.uid);
                    if (data) {
                        setUserData(data);
                    } else {
                        setUserData({ email: currentUser.email, name: currentUser.displayName });
                    }
                    notificationService.registerForPushNotificationsAsync(currentUser.uid).catch(() => { });
                } catch (error) {
                    console.error("AuthContext: Failed to fetch user data", error);
                    // Fallback to basic user info
                    setUserData({ email: currentUser.email, name: currentUser.displayName });
                }
            } else {
                setUserData(null);
            }
            setLoading(false);
        });
        return unsubscribe;
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
                    <Image
                        source={require('../../assets/splash-icon.png')}
                        style={{ width: '60%', height: undefined, aspectRatio: 1, resizeMode: 'contain' }}
                    />
                </View>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
