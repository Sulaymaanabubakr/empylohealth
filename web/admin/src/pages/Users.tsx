import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Ban, CheckCircle, Trash2, RefreshCw } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import clsx from 'clsx';
import { useNotification } from '../contexts/NotificationContext';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface UserData {
    id: string;
    email: string;
    displayName: string;
    role: string;
    createdAt: string;
    status?: string;
    photoURL?: string;
}

interface GetUsersResponse {
    users?: UserData[];
}

export const Users = () => {
    const { showNotification } = useNotification();
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

    // Confirm Dialog State
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState<{
        title: string;
        message: string;
        onConfirm: () => void;
        type: 'danger' | 'warning' | 'info';
    }>({ title: '', message: '', onConfirm: () => { }, type: 'danger' });

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const getAllUsers = httpsCallable(functions, 'getAllUsers');
            // Fetch only regular 'user' role
            const result = await getAllUsers({ limit: 100, roles: ['user'] });
            const data = (result.data ?? {}) as GetUsersResponse;
            setUsers(data.users || []);
        } catch (err) {
            console.error("Failed to fetch users", err);
            showNotification('error', 'Failed to fetch users.');
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    useEffect(() => {
        void fetchUsers();
    }, [fetchUsers]);

    const confirmAction = (title: string, message: string, action: () => void, type: 'danger' | 'warning' | 'info' = 'danger') => {
        setConfirmConfig({ title, message, onConfirm: action, type });
        setConfirmOpen(true);
    };

    const handleToggleStatus = async (id: string, currentStatus: string) => {
        const nextStatus = currentStatus === 'suspended' ? 'active' : 'suspended';

        confirmAction(
            nextStatus === 'suspended' ? 'Suspend User?' : 'Activate User?',
            `Are you sure you want to ${nextStatus === 'suspended' ? 'suspend' : 'activate'} this user? They ${nextStatus === 'suspended' ? 'will not' : 'will'} be able to log in to the app.`,
            async () => {
                setConfirmOpen(false);
                setActionLoading((prev) => ({ ...prev, [id]: true }));
                try {
                    const toggleStatus = httpsCallable(functions, 'toggleUserStatus');
                    await toggleStatus({ uid: id, status: nextStatus });
                    await fetchUsers();
                    showNotification('success', `User ${nextStatus}.`);
                } catch (err) {
                    console.error("Failed to update user", err);
                    showNotification('error', 'Failed to update user status.');
                } finally {
                    setActionLoading((prev) => ({ ...prev, [id]: false }));
                }
            },
            nextStatus === 'suspended' ? 'warning' : 'info'
        );
    };

    const handleDelete = async (id: string) => {
        confirmAction(
            'Delete User Account?',
            'This action cannot be undone. All user data, including circles and messages, will be permanently removed.',
            async () => {
                setConfirmOpen(false);
                setActionLoading((prev) => ({ ...prev, [id]: true }));
                try {
                    const del = httpsCallable(functions, 'deleteItem');
                    await del({ collection: 'users', id });
                    await fetchUsers();
                    showNotification('success', 'User account deleted.');
                } catch (err) {
                    console.error("Failed to delete user", err);
                    showNotification('error', 'Failed to delete user.');
                } finally {
                    setActionLoading((prev) => ({ ...prev, [id]: false }));
                }
            }
        );
    };

    const filteredUsers = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return users;
        return users.filter((u) => {
            const mainText = `${u.displayName} ${u.email}`.toLowerCase();
            return mainText.includes(term);
        });
    }, [users, searchTerm]);

    const stats = useMemo(() => {
        return {
            total: users.length,
            active: users.filter((u) => u.status !== 'suspended').length,
            suspended: users.filter((u) => u.status === 'suspended').length,
        };
    }, [users]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-display text-gray-900">App Users</h2>
                    <p className="text-gray-500 text-sm mt-1">Manage registered application users.</p>
                </div>
                <button
                    onClick={fetchUsers}
                    className="flex items-center justify-center p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                    title="Refresh List"
                >
                    <RefreshCw size={20} />
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: 'Total Users', value: stats.total, tone: 'bg-[var(--surface)]' },
                    { label: 'Active Users', value: stats.active, tone: 'bg-emerald-50' },
                    { label: 'Suspended', value: stats.suspended, tone: 'bg-amber-50' },
                ].map((card) => (
                    <div key={card.label} className={`${card.tone} border border-border rounded-2xl p-4 shadow-sm`}>
                        <p className="text-xs uppercase tracking-widest text-gray-500">{card.label}</p>
                        <p className="mt-2 text-3xl font-semibold text-gray-900">{card.value}</p>
                    </div>
                ))}
            </div>

            {/* List */}
            <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <div className="relative w-72">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                    </div>
                    <div className="text-sm text-gray-400">
                        {filteredUsers.length} Users
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 text-xs text-gray-500 uppercase tracking-wider">
                                <th className="px-6 py-4 font-semibold">User</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold">Joined</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={4} className="p-8 text-center text-gray-400">Loading users...</td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan={4} className="p-8 text-center text-gray-400">No users found.</td></tr>
                            ) : filteredUsers.map((user) => (
                                <motion.tr
                                    key={user.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="hover:bg-gray-50/50 transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {user.photoURL ? (
                                                <img src={user.photoURL} alt="" className="w-9 h-9 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-9 h-9 rounded-full bg-secondary/10 text-secondary flex items-center justify-center font-bold text-sm">
                                                    {(user.displayName || 'U').charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-semibold text-gray-900 text-sm">{user.displayName || 'Unknown'}</p>
                                                <p className="text-xs text-gray-500">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={clsx(
                                            "text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide",
                                            user.status === 'suspended' ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                                        )}>
                                            {user.status === 'suspended' ? 'Suspended' : 'Active'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleToggleStatus(user.id, user.status || 'active')}
                                                disabled={actionLoading[user.id]}
                                                className={clsx(
                                                    "p-1.5 rounded-md transition-colors disabled:opacity-50",
                                                    user.status === 'suspended'
                                                        ? "text-green-600 hover:bg-green-50"
                                                        : "text-orange-600 hover:bg-orange-50"
                                                )}
                                                title={user.status === 'suspended' ? "Activate" : "Suspend"}
                                            >
                                                {user.status === 'suspended' ? <CheckCircle size={16} /> : <Ban size={16} />}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                disabled={actionLoading[user.id]}
                                                className="p-1.5 rounded-md text-red-600 hover:bg-red-50 disabled:opacity-50"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmDialog
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={confirmConfig.onConfirm}
                title={confirmConfig.title}
                message={confirmConfig.message}
                type={confirmConfig.type}
            />
        </div>
    );
};
