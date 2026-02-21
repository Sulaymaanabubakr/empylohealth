import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAdmin: boolean;
    role: string;
    permissions: string[];
    can: (permission: string) => boolean;
    login: (email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

const ROLE_PERMISSIONS: Record<string, string[]> = {
    admin: [
        'dashboard.view',
        'users.view',
        'users.manage',
        'users.delete',
        'employees.manage',
        'content.view',
        'content.edit',
        'content.delete',
        'moderation.view',
        'moderation.resolve',
        'support.view',
        'support.manage',
        'finance.view',
        'audit.view'
    ],
    editor: ['dashboard.view', 'content.view', 'content.edit', 'moderation.view'],
    moderator: ['dashboard.view', 'users.view', 'content.view', 'moderation.view', 'moderation.resolve', 'support.view'],
    support: ['dashboard.view', 'users.view', 'support.view', 'support.manage', 'moderation.view'],
    finance: ['dashboard.view', 'finance.view'],
    viewer: ['dashboard.view', 'users.view', 'content.view', 'moderation.view', 'support.view', 'finance.view', 'audit.view']
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [role, setRole] = useState('viewer');
    const [permissions, setPermissions] = useState<string[]>([]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currUser) => {
            setUser(currUser);
            if (currUser) {
                const token = await currUser.getIdTokenResult(true);
                const tokenRole = String(token.claims.role || 'viewer').toLowerCase();
                const tokenPermissions = Array.isArray(token.claims.permissions)
                    ? token.claims.permissions.map((p) => String(p))
                    : [];
                const isSuperAdmin = token.claims.superAdmin === true;
                setRole(isSuperAdmin ? 'super_admin' : tokenRole);
                setPermissions(
                    isSuperAdmin
                        ? ['*']
                        : Array.from(new Set([...(ROLE_PERMISSIONS[tokenRole] || []), ...tokenPermissions]))
                );
                setIsAdmin(isSuperAdmin || !!token.claims.admin);
            } else {
                setIsAdmin(false);
                setRole('viewer');
                setPermissions([]);
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
    const can = (permission: string) => permissions.includes('*') || permissions.includes(permission);

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-medium">Loading Dashboard...</p>
            </div>
        </div>
    );

    return (
        <AuthContext.Provider value={{ user, loading, isAdmin, role, permissions, can, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
