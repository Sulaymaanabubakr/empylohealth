import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import { Search, Filter, BookOpen, Users, MoreVertical } from 'lucide-react';
import clsx from 'clsx';

export const Content = () => {
    const [activeTab, setActiveTab] = useState<'circles' | 'resources'>('circles');
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchContent();
    }, [activeTab]);

    const fetchContent = async () => {
        setLoading(true);
        try {
            const getAllContent = httpsCallable(functions, 'getAllContent');
            const result = await getAllContent({ type: activeTab, limit: 20 });
            const data = result.data as any;
            setItems(data.items || []);
        } catch (error) {
            console.error("Failed to fetch content", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Content Library</h2>
                    <p className="text-gray-500 text-sm mt-1">Manage all circles and resources.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('circles')}
                    className={clsx("pb-3 px-1 text-sm font-medium transition-colors border-b-2", activeTab === 'circles' ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-800")}
                >
                    Circles
                </button>
                <button
                    onClick={() => setActiveTab('resources')}
                    className={clsx("pb-3 px-1 text-sm font-medium transition-colors border-b-2", activeTab === 'resources' ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-800")}
                >
                    Resources
                </button>
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder={`Search ${activeTab}...`}
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm hover:bg-gray-100">
                        <Filter size={16} />
                        Filter
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 text-xs text-gray-500 uppercase tracking-wider">
                                <th className="px-6 py-4 font-semibold">Title</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold">Created</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={4} className="p-8 text-center text-gray-400">Loading content...</td></tr>
                            ) : items.length === 0 ? (
                                <tr><td colSpan={4} className="p-8 text-center text-gray-400">No {activeTab} found.</td></tr>
                            ) : items.map((item) => (
                                <motion.tr
                                    key={item.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="hover:bg-gray-50/50 transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                                                {activeTab === 'circles' ? <Users size={20} /> : <BookOpen size={20} />}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 text-sm">{item.name || item.title || 'Untitled'}</p>
                                                <p className="text-xs text-gray-500 line-clamp-1">{item.description || 'No description'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={clsx(
                                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize",
                                            item.status === 'active' ? 'bg-green-100 text-green-700' :
                                                item.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                                                    'bg-gray-100 text-gray-600'
                                        )}>
                                            {item.status || 'unknown'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
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
        </div>
    );
};
