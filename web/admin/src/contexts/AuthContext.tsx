import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAdmin: boolean;
    login: (email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

// Hardcoded super admins to bypass claim check if script fails
const SUPER_ADMINS = [
    'sulaymaanabubakr@gmail.com',
    'gcmusariri@gmail.com'
];

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currUser) => {
            setUser(currUser);
            if (currUser) {
                if (SUPER_ADMINS.includes((currUser.email || '').toLowerCase())) {
                    setIsAdmin(true);
                } else {
                    const token = await currUser.getIdTokenResult();
                    setIsAdmin(!!token.claims.admin);
                }
            } else {
                setIsAdmin(false);
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const login = async (email: string, pass: string) => {
        const normalizedEmail = (email || '').trim().toLowerCase();
        const normalizedPass = (pass || '').trim();
        await signInWithEmailAndPassword(auth, normalizedEmail, normalizedPass);
    };

    const logout = () => signOut(auth);

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-medium">Loading Dashboard...</p>
            </div>
        </div>
    );

    return (
        <AuthContext.Provider value={{ user, loading, isAdmin, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
