import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Shield, Mail, User as UserIcon, Ban, CheckCircle, Trash2 } from 'lucide-react';
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
}

interface GetAllUsersResponse {
    users?: UserData[];
}

const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    return 'Failed to create employee.';
};

export const Employees = () => {
    // const { isAdmin } = useAuth();
    const { showNotification } = useNotification();
    const [employees, setEmployees] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    // const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null); // Replaced by global notification
    const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

    // Confirm Dialog State
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState<{
        title: string;
        message: string;
        onConfirm: () => void;
        type: 'danger' | 'warning' | 'info';
    }>({ title: '', message: '', onConfirm: () => { }, type: 'danger' });

    // Form State
    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        password: '',
        role: 'editor'
    });
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');

    const fetchEmployees = useCallback(async () => {
        setLoading(true);
        try {
            const getAllUsers = httpsCallable(functions, 'getAllUsers');
            // Filter for employees only
            const result = await getAllUsers({ limit: 100, roles: ['admin', 'editor', 'viewer'] });
            const data = (result.data ?? {}) as GetAllUsersResponse;
            setEmployees(data.users || []);
        } catch (err) {
            console.error("Failed to fetch employees", err);
            showNotification('error', 'Failed to fetch employees.');
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    useEffect(() => {
        void fetchEmployees();
    }, [fetchEmployees]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        setError('');

        try {
            const createEmployee = httpsCallable(functions, 'createEmployee');
            await createEmployee(formData);
            showNotification('success', 'Employee created successfully!');
            setFormData({ displayName: '', email: '', password: '', role: 'editor' });
            setIsModalOpen(false);
            await fetchEmployees();
        } catch (err) {
            console.error(err);
            setError(getErrorMessage(err));
        } finally {
            setCreating(false);
        }
    };

    const confirmAction = (title: string, message: string, action: () => void, type: 'danger' | 'warning' | 'info' = 'danger') => {
        setConfirmConfig({ title, message, onConfirm: action, type });
        setConfirmOpen(true);
    };

    const handleToggleStatus = async (id: string, currentStatus: string) => {
        const nextStatus = currentStatus === 'suspended' ? 'active' : 'suspended';

        confirmAction(
            nextStatus === 'suspended' ? 'Suspend Employee?' : 'Activate Employee?',
            `Are you sure you want to ${nextStatus === 'suspended' ? 'suspend' : 'activate'} this account? They ${nextStatus === 'suspended' ? 'will not' : 'will'} be able to access the admin panel.`,
            async () => {
                setConfirmOpen(false);
                setActionLoading((prev) => ({ ...prev, [id]: true }));
                try {
                    const toggleStatus = httpsCallable(functions, 'toggleUserStatus');
                    await toggleStatus({ uid: id, status: nextStatus });
                    await fetchEmployees();
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
            'Delete Employee?',
            'This action cannot be undone. The account will be permanently removed.',
            async () => {
                setConfirmOpen(false);
                setActionLoading((prev) => ({ ...prev, [id]: true }));
                try {
                    const del = httpsCallable(functions, 'deleteItem');
                    await del({ collection: 'users', id });
                    await fetchEmployees();
                    showNotification('success', 'User deleted successfully.');
                } catch (err) {
                    console.error("Failed to delete user", err);
                    showNotification('error', 'Failed to delete user.');
                } finally {
                    setActionLoading((prev) => ({ ...prev, [id]: false }));
                }
            }
        );
    };

    const filteredEmployees = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return employees;
        return employees.filter((emp) => {
            const mainText = `${emp.displayName} ${emp.email}`.toLowerCase();
            return mainText.includes(term);
        });
    }, [employees, searchTerm]);

    const stats = useMemo(() => {
        const total = employees.length;
        const active = employees.filter((emp) => emp.status !== 'suspended').length;
        const suspended = employees.filter((emp) => emp.status === 'suspended').length;
        const admins = employees.filter((emp) => emp.role === 'admin').length;
        return { total, active, suspended, admins };
    }, [employees]);

    return (
        <div className="space-y-6">
            {/* Header / Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-display text-gray-900">Employee Management</h2>
                    <p className="text-gray-500 text-sm mt-1">Manage admin access, roles, and account status.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center bg-primary hover:bg-[#008f85] text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/30 transition-all active:scale-95"
                >
                    <Plus size={18} className="mr-2" />
                    Add Employee
                </button>
            </div>



            {/* Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Employees', value: stats.total, tone: 'bg-[var(--surface)]' },
                    { label: 'Active', value: stats.active, tone: 'bg-emerald-50' },
                    { label: 'Suspended', value: stats.suspended, tone: 'bg-amber-50' },
                    { label: 'Admins', value: stats.admins, tone: 'bg-blue-50' },
                ].map((card) => (
                    <div key={card.label} className={`${card.tone} border border-border rounded-2xl p-4 shadow-sm`}>
                        <p className="text-xs uppercase tracking-widest text-gray-500">{card.label}</p>
                        <p className="mt-2 text-3xl font-semibold text-gray-900">{card.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* List */}
                <div className="xl:col-span-2 bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-border flex items-center justify-between">
                        <div className="relative w-64">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search employees..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                        </div>
                        <div className="text-sm text-gray-400">
                            {filteredEmployees.length} Users found
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 text-xs text-gray-500 uppercase tracking-wider">
                                    <th className="px-6 py-4 font-semibold">User</th>
                                    <th className="px-6 py-4 font-semibold">Role</th>
                                    <th className="px-6 py-4 font-semibold">Joined</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan={4} className="p-8 text-center text-gray-400">Loading users...</td></tr>
                                ) : filteredEmployees.length === 0 ? (
                                    <tr><td colSpan={4} className="p-8 text-center text-gray-400">No employees match your search.</td></tr>
                                ) : filteredEmployees.map((emp) => (
                                    <motion.tr
                                        key={emp.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="hover:bg-gray-50/50 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-secondary/10 text-secondary flex items-center justify-center font-bold text-sm">
                                                    {(emp.displayName || 'U').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 text-sm">{emp.displayName || 'Unknown'}</p>
                                                    <p className="text-xs text-gray-500">{emp.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className={
                                                    `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ` +
                                                    (emp.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600')
                                                }>
                                                    {emp.role}
                                                </span>
                                                <span className={clsx(
                                                    "text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide",
                                                    emp.status === 'suspended' ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                                                )}>
                                                    {emp.status === 'suspended' ? 'Suspended' : 'Active'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {emp.createdAt ? new Date(emp.createdAt).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleToggleStatus(emp.id, emp.status || 'active')}
                                                    disabled={actionLoading[emp.id]}
                                                    className={clsx(
                                                        "text-xs px-2.5 py-1 rounded-md border transition-colors disabled:opacity-50",
                                                        emp.status === 'suspended'
                                                            ? "border-green-200 text-green-600 hover:bg-green-50"
                                                            : "border-orange-200 text-orange-600 hover:bg-orange-50"
                                                    )}
                                                >
                                                    {emp.status === 'suspended' ? <CheckCircle size={14} className="inline-block mr-1" /> : <Ban size={14} className="inline-block mr-1" />}
                                                    {emp.status === 'suspended' ? 'Activate' : 'Suspend'}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(emp.id)}
                                                    disabled={actionLoading[emp.id]}
                                                    className="text-xs px-2.5 py-1 rounded-md border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                                                >
                                                    <Trash2 size={14} className="inline-block mr-1" />
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-surface rounded-2xl border border-border shadow-sm p-6 space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Access Overview</h3>
                        <p className="text-sm text-gray-500 mt-1">Roles and permissions at a glance.</p>
                    </div>
                    <div className="space-y-3">
                        {[
                            { label: 'Admins', value: stats.admins, note: 'Full access' },
                            { label: 'Editors', value: employees.filter((emp) => emp.role === 'editor').length, note: 'Content & moderation' },
                            { label: 'Viewers', value: employees.filter((emp) => emp.role === 'viewer').length, note: 'Read-only' },
                        ].map((item) => (
                            <div key={item.label} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{item.label}</p>
                                    <p className="text-xs text-gray-500">{item.note}</p>
                                </div>
                                <span className="text-xl font-semibold text-gray-800">{item.value}</span>
                            </div>
                        ))}
                    </div>
                    <div className="bg-primary/10 text-primary rounded-xl p-4 text-sm">
                        Need to onboard a new manager? Use “Add Employee” and assign the right role.
                    </div>
                </div>
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setIsModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-surface rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="bg-gray-50 px-6 py-4 border-b border-border flex justify-between items-center">
                                <h3 className="font-bold text-lg text-gray-900">Add New Employee</h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">×</button>
                            </div>

                            <form onSubmit={handleCreate} className="p-6 space-y-4">
                                {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}


                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">Full Name</label>
                                    <div className="relative">
                                        <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            required
                                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                            value={formData.displayName}
                                            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">Email Address</label>
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="email"
                                            required
                                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">Password</label>
                                    <div className="relative">
                                        <Shield size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="password"
                                            required
                                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">Role</label>
                                    <select
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        <option value="editor">Editor</option>
                                        <option value="admin">Admin</option>
                                        <option value="viewer">Viewer</option>
                                    </select>
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={creating}
                                        className="w-full bg-primary hover:bg-[#008f85] text-white py-2.5 rounded-lg font-medium shadow-lg shadow-primary/30 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {creating ? 'Creating Account...' : 'Create Account'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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
