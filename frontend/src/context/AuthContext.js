import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/auth/authService';
import { userService } from '../services/api/userService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Listen for auth state changes
    useEffect(() => {
        const unsubscribe = authService.onAuthStateChanged(async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                // Fetch user data from Service
                const data = await userService.getUserDocument(currentUser.uid);
                if (data) {
                    setUserData(data);
                } else {
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
        return await authService.login(email, password);
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

    return (
        <AuthContext.Provider value={{ user, userData, loading, login, register, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
