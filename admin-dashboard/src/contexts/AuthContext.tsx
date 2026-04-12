import React, { createContext, useContext, useEffect, useState } from 'react';
import { adminApi } from '../lib/adminApi';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

type AdminUser = {
    id: string;
    email: string;
    displayName: string;
    photoURL: string;
};

interface AuthContextType {
    user: AdminUser | null;
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

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<AdminUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [role, setRole] = useState('viewer');
    const [permissions, setPermissions] = useState<string[]>([]);

    const mapUser = (user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> } | null): AdminUser | null => {
        if (!user) return null;
        return {
            id: user.id,
            email: String(user.email || ''),
            displayName: String(user.user_metadata?.name || user.user_metadata?.full_name || ''),
            photoURL: String(user.user_metadata?.avatar_url || user.user_metadata?.picture || ''),
        };
    };

    useEffect(() => {
        if (!isSupabaseConfigured || !supabase) {
            setLoading(false);
            setUser(null);
            setIsAdmin(false);
            setRole('viewer');
            setPermissions([]);
            return;
        }

        const client = supabase;
        const syncAuth = async (currUser: { id: string; email?: string | null; user_metadata?: Record<string, unknown> } | null) => {
            setUser(mapUser(currUser));
            if (!currUser) {
                setIsAdmin(false);
                setRole('viewer');
                setPermissions([]);
                setLoading(false);
                return;
            }

            try {
                const payload = await adminApi.bootstrapSession();
                setRole(String(payload.role || 'viewer'));
                setPermissions(Array.isArray(payload.permissions) ? payload.permissions.map((item: unknown) => String(item)) : []);
                setIsAdmin(Boolean(payload.isAdmin));
            } catch {
                setIsAdmin(false);
                setRole('viewer');
                setPermissions([]);
                await client.auth.signOut().catch(() => {});
            } finally {
                setLoading(false);
            }
        };

        client.auth.getUser().then(({ data }) => {
            syncAuth(data.user ?? null);
        });

        const { data: subscription } = client.auth.onAuthStateChange((_event, session) => {
            syncAuth(session?.user ?? null);
        });

        return () => subscription.subscription.unsubscribe();
    }, []);

    const login = async (email: string, pass: string) => {
        if (!supabase) {
            throw new Error('Admin dashboard is missing Supabase environment variables.');
        }
        const normalizedEmail = (email || '').trim().toLowerCase();
        const normalizedPass = (pass || '').trim();
        const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password: normalizedPass });
        if (error) throw error;
    };

    const logout = async () => {
        if (!supabase) return;
        await supabase.auth.signOut();
    };
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
