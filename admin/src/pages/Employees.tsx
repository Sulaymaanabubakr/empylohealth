import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, MoreVertical, Shield, Mail, User as UserIcon } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';


interface UserData {
    id: string;
    email: string;
    displayName: string;
    role: string;
    createdAt: string;
}

export const Employees = () => {
    // const { isAdmin } = useAuth();
    const [employees, setEmployees] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        password: '',
        role: 'editor'
    });
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            // Re-using getAllUsers but technically we should filter for admins/employees
            // For now, we list all users, assuming this list is what admins manage
            const getAllUsers = httpsCallable(functions, 'getAllUsers');
            const result = await getAllUsers({ limit: 50 });
            const data = result.data as any;
            setEmployees(data.users || []);
        } catch (err) {
            console.error("Failed to fetch employees", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        setError('');
        setSuccess('');

        try {
            const createEmployee = httpsCallable(functions, 'createEmployee');
            await createEmployee(formData);
            setSuccess('Employee created successfully!');
            setFormData({ displayName: '', email: '', password: '', role: 'editor' });
            setTimeout(() => {
                setIsModalOpen(false);
                setSuccess('');
                fetchEmployees(); // Refresh list
            }, 1000);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to create employee.');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header / Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Employee Management</h2>
                    <p className="text-gray-500 text-sm mt-1">Manage admin access and roles.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center bg-primary hover:bg-[#008f85] text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/30 transition-all active:scale-95"
                >
                    <Plus size={18} className="mr-2" />
                    Add Employee
                </button>
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="relative w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search employees..."
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                    </div>
                    <div className="text-sm text-gray-400">
                        {employees.length} Users found
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
                            ) : employees.map((emp) => (
                                <motion.tr
                                    key={emp.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="hover:bg-gray-50/50 transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-secondary/10 text-secondary flex items-center justify-center font-bold text-sm">
                                                {emp.displayName.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 text-sm">{emp.displayName}</p>
                                                <p className="text-xs text-gray-500">{emp.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={
                                            `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ` +
                                            (emp.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600')
                                        }>
                                            {emp.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(emp.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-gray-400 hover:text-primary transition-colors">
                                            <MoreVertical size={18} />
                                        </button>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
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
                            className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="font-bold text-lg text-gray-900">Add New Employee</h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">×</button>
                            </div>

                            <form onSubmit={handleCreate} className="p-6 space-y-4">
                                {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}
                                {success && <div className="text-green-500 text-sm bg-green-50 p-3 rounded-lg">{success}</div>}

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
        </div>
    );
};
