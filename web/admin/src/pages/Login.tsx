import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Logo } from '../components/Logo';
import { FirebaseError } from 'firebase/app';
import { Eye, EyeOff } from 'lucide-react';

export const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loadingLocal, setLoadingLocal] = useState(false);
    const { login } = useAuth();
    const getErrorMessage = (error: unknown): string => {
        if (error instanceof FirebaseError) {
            switch (error.code) {
                case 'auth/invalid-credential':
                case 'auth/invalid-login-credentials':
                    return 'Invalid email or password. Check both and try again.';
                case 'auth/user-disabled':
                    return 'This account is disabled. Contact a super admin.';
                case 'auth/too-many-requests':
                    return 'Too many failed attempts. Wait a moment and try again.';
                case 'auth/operation-not-allowed':
                    return 'Email/password sign-in is not enabled in Firebase Auth.';
                default:
                    return error.message || 'Unable to sign in right now.';
            }
        }
        return error instanceof Error ? error.message : 'Unable to sign in right now.';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoadingLocal(true);
        try {
            await login(email, password);
        } catch (err) {
            console.error(err);
            setError(getErrorMessage(err));
        } finally {
            setLoadingLocal(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-background font-sans">
            {/* Left Side - Brand & Visuals */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-primary overflow-hidden items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-[#008C82] opacity-90" />

                {/* Decorative Rings */}
                <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-secondary/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

                <div className="relative z-10 text-center p-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mb-8 flex justify-center"
                    >
                        <div className="bg-white/20 p-6 rounded-3xl backdrop-blur-sm border border-white/30">
                            <Logo className="w-24 h-24" white />
                        </div>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-4xl font-bold text-white mb-4"
                    >
                        Empylo Circles
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="text-white/80 text-lg max-w-md mx-auto leading-relaxed"
                    >
                        Manage your community, track wellbeing stats, and oversee circle activities from one powerful dashboard.
                    </motion.p>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-surface">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full max-w-md space-y-8"
                >
                    <div className="text-center lg:text-left">
                        <div className="lg:hidden flex justify-center mb-6">
                            <div className="bg-primary p-3 rounded-xl shadow-lg shadow-primary/20">
                                <Logo className="w-10 h-10" white />
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome Back</h2>
                        <p className="mt-2 text-gray-500">Sign in to access the admin portal.</p>
                    </div>

                    {error && (
                        <div className="p-4 rounded-lg bg-red-50 text-red-600 border border-red-100 flex items-center text-sm">
                            <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <input
                                type="email"
                                required
                                className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-gray-900"
                                placeholder="admin@empylo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    className="w-full px-4 py-3 pr-11 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-gray-900"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loadingLocal}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-[#008f85] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loadingLocal ? (
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : 'Sign In'}
                        </button>
                    </form>

                    <div className="pt-6 border-t border-gray-100 text-center">
                        <p className="text-xs text-gray-400">Protected by Empylo Secure Admin</p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
