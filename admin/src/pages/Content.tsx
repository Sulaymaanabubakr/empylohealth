import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { httpsCallable } from 'firebase/functions';
import { functions, db } from '../lib/firebase';
import { Search, Filter, BookOpen, Users, MoreVertical, MessageCircle, Calendar, Plus, RotateCcw } from 'lucide-react';
import { collection, addDoc, query, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import clsx from 'clsx';

export const Content = () => {
    const [activeTab, setActiveTab] = useState<'circles' | 'resources' | 'affirmations'>('circles');
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Affirmation State
    const [affirmationText, setAffirmationText] = useState('');
    const [affirmationDate, setAffirmationDate] = useState(new Date().toISOString().split('T')[0]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (activeTab === 'affirmations') {
            fetchAffirmations();
        } else {
            fetchContent();
        }
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

    const fetchAffirmations = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'affirmations'), orderBy('createdAt', 'desc'), limit(50));
            const querySnapshot = await getDocs(q);
            const affirmations = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setItems(affirmations);
        } catch (error) {
            console.error("Failed to fetch affirmations", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePostAffirmation = async () => {
        if (!affirmationText) return;
        setSubmitting(true);
        try {
            await addDoc(collection(db, 'affirmations'), {
                content: affirmationText,
                scheduledDate: affirmationDate,
                createdAt: Timestamp.now(),
                isNew: true // Flag to show it as new in list
            });
            setAffirmationText('');
            // Refresh list
            fetchAffirmations();
        } catch (error) {
            console.error("Failed to post affirmation", error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Content Library</h2>
                    <p className="text-gray-500 text-sm mt-1 dark:text-gray-400">Manage all circles, resources, and daily affirmations.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200 dark:border-gray-800">
                {[
                    { id: 'circles', label: 'Circles' },
                    { id: 'resources', label: 'Resources' },
                    { id: 'affirmations', label: 'Daily Affirmations' }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={clsx(
                            "pb-3 px-1 text-sm font-medium transition-colors border-b-2",
                            activeTab === tab.id
                                ? "border-primary text-primary"
                                : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Affirmation Input Section */}
            {activeTab === 'affirmations' && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6 dark:bg-dark dark:border-gray-800">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 dark:text-gray-100">New Daily Affirmation</h3>
                    <div className="flex flex-col gap-4">
                        <textarea
                            placeholder="Type a positive daily affirmation here..."
                            value={affirmationText}
                            onChange={(e) => setAffirmationText(e.target.value)}
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none h-32 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        />
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Calendar size={18} className="text-gray-400" />
                                <input
                                    type="date"
                                    value={affirmationDate}
                                    onChange={(e) => setAffirmationDate(e.target.value)}
                                    className="bg-transparent border-none text-sm text-gray-600 focus:ring-0 dark:text-gray-300"
                                />
                            </div>
                            <button
                                onClick={handlePostAffirmation}
                                disabled={submitting || !affirmationText}
                                className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-[#008f85] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus size={18} />
                                Post Affirmation
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden dark:bg-dark dark:border-gray-800">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4 dark:border-gray-800">
                    <div className="relative flex-1 max-w-md">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder={`Search ${activeTab}...`}
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none dark:bg-gray-800 dark:text-white"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                        <Filter size={16} />
                        Filter
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 text-xs text-gray-500 uppercase tracking-wider dark:bg-gray-800/50 dark:text-gray-400">
                                <th className="px-6 py-4 font-semibold">{activeTab === 'affirmations' ? 'Content' : 'Title'}</th>
                                {activeTab !== 'affirmations' && <th className="px-6 py-4 font-semibold">Status</th>}
                                <th className="px-6 py-4 font-semibold">{activeTab === 'affirmations' ? 'Scheduled Date' : 'Created'}</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading ? (
                                <tr><td colSpan={4} className="p-8 text-center text-gray-400">Loading content...</td></tr>
                            ) : items.length === 0 ? (
                                <tr><td colSpan={4} className="p-8 text-center text-gray-400">No {activeTab} found.</td></tr>
                            ) : items.map((item) => (
                                <motion.tr
                                    key={item.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="hover:bg-gray-50/50 transition-colors dark:hover:bg-gray-800/50"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 dark:bg-gray-800">
                                                {activeTab === 'circles' ? <Users size={20} /> : activeTab === 'resources' ? <BookOpen size={20} /> : <MessageCircle size={20} />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold text-gray-900 text-sm dark:text-gray-100">{item.name || item.title || item.content || 'Untitled'}</p>
                                                    {item.isNew && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">NEW</span>}
                                                </div>
                                                <p className="text-xs text-gray-500 line-clamp-1 dark:text-gray-400">{item.description || (activeTab === 'affirmations' ? 'Daily Affirmation' : 'No description')}</p>
                                            </div>
                                        </div>
                                    </td>
                                    {activeTab !== 'affirmations' && (
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
                                    )}
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                        {activeTab === 'affirmations' && item.scheduledDate
                                            ? new Date(item.scheduledDate).toLocaleDateString()
                                            : item.createdAt
                                                ? (typeof item.createdAt === 'object' ? item.createdAt.toDate().toLocaleDateString() : new Date(item.createdAt).toLocaleDateString())
                                                : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {activeTab === 'affirmations' ? (
                                            <button
                                                onClick={() => setAffirmationText(item.content)}
                                                className="text-gray-400 hover:text-primary transition-colors flex items-center justify-end gap-1 text-xs"
                                                title="Reuse this affirmation"
                                            >
                                                <RotateCcw size={14} /> Reuse
                                            </button>
                                        ) : (
                                            <button className="text-gray-400 hover:text-primary transition-colors">
                                                <MoreVertical size={18} />
                                            </button>
                                        )}
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
