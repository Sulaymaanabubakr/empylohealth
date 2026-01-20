import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import { Search, AlertTriangle, UserX, Trash2, Ban, CheckCircle } from 'lucide-react';
import clsx from 'clsx';

export const Moderation = () => {
    const [activeTab, setActiveTab] = useState<'users' | 'circles'>('users');
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const fnName = activeTab === 'users' ? 'getAllUsers' : 'getAllContent';
            const fetchFn = httpsCallable(functions, fnName);
            const args = activeTab === 'circles' ? { type: 'circles' } : {};

            const result = await fetchFn(args);
            const data = result.data as any;
            setItems(data[activeTab] || data.items || []); // handle different return keys
        } catch (error) {
            console.error("Fetch error", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSuspend = async (id: string, currentStatus: string) => {
        if (!confirm(`Are you sure you want to ${currentStatus === 'suspended' ? 'activate' : 'suspend'} this item?`)) return;

        try {
            if (activeTab === 'users') {
                const toggle = httpsCallable(functions, 'toggleUserStatus');
                await toggle({ uid: id, status: currentStatus === 'suspended' ? 'active' : 'suspended' });
            } else {
                const updateStatus = httpsCallable(functions, 'updateContentStatus');
                await updateStatus({ collection: 'circles', docId: id, status: currentStatus === 'suspended' ? 'active' : 'suspended' });
            }
            fetchData(); // Refresh to show new status
        } catch (error) {
            console.error("Action failed", error);
            alert("Failed to update status.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to PERMANENTLY delete this? This cannot be undone.")) return;

        try {
            const del = httpsCallable(functions, 'deleteItem');
            await del({ collection: activeTab, id });
            setItems(prev => prev.filter(i => i.id !== id));
        } catch (error) {
            console.error("Delete failed", error);
            alert("Failed to delete item.");
        }
    };

    const filteredItems = items.filter(item => {
        const term = searchTerm.toLowerCase();
        const mainText = (item.displayName || item.name || item.title || '').toLowerCase();
        const subText = (item.email || item.description || '').toLowerCase();
        return mainText.includes(term) || subText.includes(term);
    });

    const stats = {
        total: items.length,
        suspended: items.filter((item) => item.status === 'suspended').length,
        pending: items.filter((item) => item.status === 'pending').length,
        flagged: items.filter((item) => item.isFlagged).length
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-display text-gray-900">Moderation Center</h2>
                    <p className="text-gray-500 text-sm mt-1">Triage reports, review content, and manage suspensions.</p>
                </div>

                {/* Search */}
                <div className="relative w-full md:w-64">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-surface border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none transition-all"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Records', value: stats.total, tone: 'bg-[var(--surface)]' },
                    { label: 'Suspended', value: stats.suspended, tone: 'bg-rose-50' },
                    { label: 'Pending', value: stats.pending, tone: 'bg-amber-50' },
                    { label: 'Flagged', value: stats.flagged, tone: 'bg-blue-50' },
                ].map((card) => (
                    <div key={card.label} className={`${card.tone} border border-border rounded-2xl p-4 shadow-sm`}>
                        <p className="text-xs uppercase tracking-widest text-gray-500">{card.label}</p>
                        <p className="mt-2 text-3xl font-semibold text-gray-900">{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-gray-100 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('users')}
                    className={clsx("px-4 py-1.5 text-sm font-medium rounded-lg transition-all", activeTab === 'users' ? "bg-surface text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}
                >
                    Users
                </button>
                <button
                    onClick={() => setActiveTab('circles')}
                    className={clsx("px-4 py-1.5 text-sm font-medium rounded-lg transition-all", activeTab === 'circles' ? "bg-surface text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}
                >
                    Circles
                </button>
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center text-gray-400">Loading data...</div>
                    ) : filteredItems.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">No items found matching your search.</div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {filteredItems.map((item) => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="p-4 flex flex-col md:flex-row items-start md:items-center gap-4 hover:bg-gray-50/50 transition-colors"
                                >
                                    {/* Icon/Avatar */}
                                    <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                                        item.status === 'suspended' ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-500'
                                    )}>
                                        {activeTab === 'users' ? <UserX size={20} /> : <AlertTriangle size={20} />}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold text-gray-900 text-sm truncate">
                                                {item.displayName || item.name || 'Untitled'}
                                            </h4>
                                            {item.status === 'suspended' && (
                                                <span className="bg-red-100 text-red-600 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded">Suspended</span>
                                            )}
                                            {item.role === 'admin' && (
                                                <span className="bg-purple-100 text-purple-600 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded">Admin</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 truncate">{item.email || item.description || 'No info'}</p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
                                        <button
                                            onClick={() => handleSuspend(item.id, item.status)}
                                            className={clsx("flex-1 md:flex-none px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center justify-center gap-1.5",
                                                item.status === 'suspended'
                                                    ? "border-green-200 text-green-600 hover:bg-green-50"
                                                    : "border-orange-200 text-orange-600 hover:bg-orange-50"
                                            )}
                                        >
                                            {item.status === 'suspended' ? <CheckCircle size={14} /> : <Ban size={14} />}
                                            {item.status === 'suspended' ? 'Activate' : 'Suspend'}
                                        </button>

                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="flex-1 md:flex-none px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-red-600 hover:bg-red-50 hover:border-red-100 transition-colors flex items-center justify-center gap-1.5"
                                        >
                                            <Trash2 size={14} /> Delete
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-surface border border-border rounded-2xl shadow-sm p-6 space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Decision Flow</h3>
                        <p className="text-sm text-gray-500 mt-1">Use a consistent review pattern.</p>
                    </div>
                    <div className="space-y-3 text-sm text-gray-600">
                        <div className="bg-gray-50 rounded-xl p-4">Assess severity and impact before action.</div>
                        <div className="bg-gray-50 rounded-xl p-4">Suspend for repeated violations; activate after review.</div>
                        <div className="bg-gray-50 rounded-xl p-4">Delete only if content violates core safety rules.</div>
                    </div>
                    <div className="bg-primary/10 text-primary rounded-xl p-4 text-sm">
                        Tip: search by email or circle name to speed up review.
                    </div>
                </div>
            </div>
        </div>
    );
};
