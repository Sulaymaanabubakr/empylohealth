import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import { Search, Filter, BookOpen, Users, MessageCircle, Calendar, Plus, RotateCcw, Pencil } from 'lucide-react';
import clsx from 'clsx';
import { useSearchParams } from 'react-router-dom';

type ContentTab = 'circles' | 'resources' | 'affirmations';
type ContentStatus = 'all' | 'active' | 'pending' | 'suspended' | 'rejected';

interface TimestampLike {
    toDate: () => Date;
}

interface ContentItem {
    id: string;
    name?: string;
    title?: string;
    content?: string;
    description?: string;
    image?: string;
    type?: string;
    category?: string;
    tag?: string;
    time?: string;
    email?: string;
    status?: string;
    isNew?: boolean;
    scheduledDate?: string;
    createdAt?: string | TimestampLike;
}

interface EditFormState {
    name: string;
    title: string;
    description: string;
    content: string;
    image: string;
    type: string;
    category: string;
    tag: string;
    time: string;
    status: string;
    scheduledDate: string;
}

interface ContentListResponse {
    items?: ContentItem[];
}

const TABS: Array<{ id: ContentTab; label: string }> = [
    { id: 'circles', label: 'Circles' },
    { id: 'resources', label: 'Resources' },
    { id: 'affirmations', label: 'Daily Affirmations' }
];

const STATUS_OPTIONS: ContentStatus[] = ['all', 'active', 'pending', 'suspended', 'rejected'];

const isContentStatus = (value: string): value is ContentStatus => STATUS_OPTIONS.includes(value as ContentStatus);

export const Content = () => {
    const [activeTab, setActiveTab] = useState<ContentTab>('circles');
    const [items, setItems] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<ContentStatus>('all');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
    const [searchParams] = useSearchParams();

    // Affirmation State
    const [affirmationText, setAffirmationText] = useState('');
    const [affirmationDate, setAffirmationDate] = useState(new Date().toISOString().split('T')[0]);
    const [submitting, setSubmitting] = useState(false);
    const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
    const [editForm, setEditForm] = useState<EditFormState>({
        name: '',
        title: '',
        description: '',
        content: '',
        image: '',
        type: '',
        category: '',
        tag: '',
        time: '',
        status: '',
        scheduledDate: ''
    });
    const [savingEdit, setSavingEdit] = useState(false);

    useEffect(() => {
        const queryParam = searchParams.get('query');
        if (queryParam) {
            setSearchTerm(queryParam);
        }
    }, [searchParams]);

    const fetchContent = useCallback(async () => {
        setLoading(true);
        try {
            const getAllContent = httpsCallable(functions, 'getAllContent');
            const result = await getAllContent({ type: activeTab, limit: 20 });
            const data = (result.data ?? {}) as ContentListResponse;
            setItems(data.items || []);
        } catch (error) {
            console.error("Failed to fetch content", error);
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    const fetchAffirmations = useCallback(async () => {
        setLoading(true);
        try {
            const getAdminAffirmations = httpsCallable(functions, 'getAdminAffirmations');
            const result = await getAdminAffirmations({ limit: 50 });
            const data = (result.data ?? {}) as ContentListResponse;
            setItems(data.items || []);
        } catch (error) {
            console.error("Failed to fetch affirmations", error);
            setMessage({ type: 'error', text: 'Failed to fetch affirmations.' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        setMessage(null);
        if (activeTab === 'affirmations') {
            void fetchAffirmations();
        } else {
            void fetchContent();
        }
    }, [activeTab, fetchAffirmations, fetchContent]);

    const handlePostAffirmation = async () => {
        if (!affirmationText) return;
        setSubmitting(true);
        setMessage(null);
        try {
            const createAffirmation = httpsCallable(functions, 'createAffirmation');
            await createAffirmation({
                content: affirmationText,
                scheduledDate: affirmationDate
            });
            setAffirmationText('');
            // Refresh list
            await fetchAffirmations();
            setMessage({ type: 'success', text: 'Affirmation posted.' });
        } catch (error) {
            console.error("Failed to post affirmation", error);
            setMessage({ type: 'error', text: 'Failed to post affirmation.' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        if (!confirm(`Update status to "${status}"?`)) return;
        setActionLoading((prev) => ({ ...prev, [id]: true }));
        setMessage(null);
        try {
            const updateStatus = httpsCallable(functions, 'updateContentStatus');
            await updateStatus({ collection: activeTab, docId: id, status });
            await fetchContent();
            setMessage({ type: 'success', text: `Status updated to ${status}.` });
        } catch (error) {
            console.error("Failed to update status", error);
            setMessage({ type: 'error', text: 'Failed to update status.' });
        } finally {
            setActionLoading((prev) => ({ ...prev, [id]: false }));
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this item? This cannot be undone.")) return;
        setActionLoading((prev) => ({ ...prev, [id]: true }));
        setMessage(null);
        try {
            if (activeTab === 'affirmations') {
                const deleteAffirmation = httpsCallable(functions, 'deleteAffirmation');
                await deleteAffirmation({ id });
                await fetchAffirmations();
            } else {
                const del = httpsCallable(functions, 'deleteItem');
                await del({ collection: activeTab, id });
                await fetchContent();
            }
            setMessage({ type: 'success', text: 'Item deleted.' });
        } catch (error) {
            console.error("Failed to delete item", error);
            setMessage({ type: 'error', text: 'Failed to delete item.' });
        } finally {
            setActionLoading((prev) => ({ ...prev, [id]: false }));
        }
    };

    const openEditModal = (item: ContentItem) => {
        setEditingItem(item);
        setEditForm({
            name: item.name || '',
            title: item.title || '',
            description: item.description || '',
            content: item.content || '',
            image: item.image || '',
            type: item.type || '',
            category: item.category || '',
            tag: item.tag || '',
            time: item.time || '',
            status: item.status || '',
            scheduledDate: item.scheduledDate || ''
        });
    };

    const closeEditModal = () => {
        if (savingEdit) return;
        setEditingItem(null);
    };

    const handleSaveEdit = async () => {
        if (!editingItem) return;
        setSavingEdit(true);
        setMessage(null);
        try {
            const updateContentItem = httpsCallable(functions, 'updateContentItem');
            const updates: Record<string, string> = {};

            if (activeTab === 'circles') {
                updates.name = editForm.name;
                updates.description = editForm.description;
                updates.image = editForm.image;
                updates.type = editForm.type;
                updates.category = editForm.category;
                updates.status = editForm.status;
            } else if (activeTab === 'resources') {
                updates.title = editForm.title;
                updates.description = editForm.description;
                updates.content = editForm.content;
                updates.image = editForm.image;
                updates.category = editForm.category;
                updates.tag = editForm.tag;
                updates.time = editForm.time;
                updates.status = editForm.status;
            } else {
                updates.content = editForm.content;
                updates.scheduledDate = editForm.scheduledDate;
                updates.status = editForm.status;
            }

            await updateContentItem({
                collection: activeTab,
                id: editingItem.id,
                updates
            });

            if (activeTab === 'affirmations') {
                await fetchAffirmations();
            } else {
                await fetchContent();
            }
            setEditingItem(null);
            setMessage({ type: 'success', text: 'Content updated successfully.' });
        } catch (error) {
            console.error('Failed to edit content', error);
            setMessage({ type: 'error', text: 'Failed to update content.' });
        } finally {
            setSavingEdit(false);
        }
    };

    const filteredItems = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        return items.filter((item) => {
            const mainText = (item.name || item.title || item.content || '').toLowerCase();
            const subText = (item.description || item.email || '').toLowerCase();
            const matchesSearch = !term || mainText.includes(term) || subText.includes(term);
            if (activeTab === 'affirmations') return matchesSearch;
            const status = (item.status || 'unknown').toLowerCase();
            const matchesStatus = statusFilter === 'all' || status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [items, searchTerm, statusFilter, activeTab]);

    const stats = useMemo(() => {
        if (activeTab === 'affirmations') {
            return {
                total: items.length,
                scheduled: items.filter((item) => item.scheduledDate).length,
                fresh: items.filter((item) => item.isNew).length,
                pending: 0
            };
        }

        const total = items.length;
        const active = items.filter((item) => item.status === 'active').length;
        const pending = items.filter((item) => item.status === 'pending').length;
        const suspended = items.filter((item) => item.status === 'suspended').length;
        return { total, active, pending, suspended };
    }, [items, activeTab]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-display text-gray-900 dark:text-gray-100">Content Library</h2>
                    <p className="text-gray-500 text-sm mt-1 dark:text-gray-400">Manage circles, resources, and daily affirmations with clear status control.</p>
                </div>
            </div>

            {message && (
                <div
                    className={clsx(
                        "p-3 rounded-lg text-sm font-medium",
                        message.type === 'success' ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                    )}
                >
                    {message.text}
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200 dark:border-gray-800">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
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
                <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden p-6 dark:bg-dark dark:border-gray-800">
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

            {/* Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {(
                    activeTab === 'affirmations'
                        ? [
                            { label: 'Total', value: stats.total, tone: 'bg-[var(--surface)]' },
                            { label: 'Scheduled', value: stats.scheduled, tone: 'bg-blue-50' },
                            { label: 'New', value: stats.fresh, tone: 'bg-emerald-50' },
                            { label: 'In Queue', value: stats.total - (stats.scheduled || 0), tone: 'bg-amber-50' },
                        ]
                        : [
                            { label: 'Total Items', value: stats.total, tone: 'bg-[var(--surface)]' },
                            { label: 'Active', value: stats.active, tone: 'bg-emerald-50' },
                            { label: 'Pending', value: stats.pending, tone: 'bg-amber-50' },
                            { label: 'Suspended', value: stats.suspended, tone: 'bg-rose-50' },
                        ]
                ).map((card) => (
                    <div key={card.label} className={`${card.tone} border border-border rounded-2xl p-4 shadow-sm`}>
                        <p className="text-xs uppercase tracking-widest text-gray-500">{card.label}</p>
                        <p className="mt-2 text-3xl font-semibold text-gray-900">{card.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* List */}
                <div className="xl:col-span-2 bg-surface rounded-2xl border border-border shadow-sm overflow-hidden dark:bg-dark dark:border-gray-800">
                    <div className="p-4 border-b border-border flex items-center justify-between gap-4 dark:border-gray-800">
                        <div className="relative flex-1 max-w-md">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder={`Search ${activeTab}...`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none dark:bg-gray-800 dark:text-white"
                            />
                        </div>
                        {activeTab !== 'affirmations' && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm dark:bg-gray-800 dark:text-gray-300">
                                <Filter size={16} />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => {
                                        if (isContentStatus(e.target.value)) {
                                            setStatusFilter(e.target.value);
                                        }
                                    }}
                                    className="bg-transparent border-none text-sm focus:ring-0 outline-none"
                                >
                                    <option value="all">All</option>
                                    <option value="active">Active</option>
                                    <option value="pending">Pending</option>
                                    <option value="suspended">Suspended</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>
                        )}
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
                                ) : filteredItems.length === 0 ? (
                                    <tr><td colSpan={4} className="p-8 text-center text-gray-400">No {activeTab} found.</td></tr>
                                ) : filteredItems.map((item) => (
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
                                                            item.status === 'suspended' ? 'bg-red-100 text-red-700' :
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
                                                <div className="flex items-center justify-end gap-3">
                                                    <button
                                                        onClick={() => openEditModal(item)}
                                                        className="text-gray-500 hover:text-primary transition-colors flex items-center gap-1 text-xs"
                                                        title="Edit affirmation"
                                                    >
                                                        <Pencil size={14} /> Edit
                                                    </button>
                                                    <button
                                                        onClick={() => setAffirmationText(item.content ?? '')}
                                                        className="text-gray-400 hover:text-primary transition-colors flex items-center gap-1 text-xs"
                                                        title="Reuse this affirmation"
                                                    >
                                                        <RotateCcw size={14} /> Reuse
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        disabled={actionLoading[item.id]}
                                                        className="text-red-500 hover:text-red-600 transition-colors text-xs disabled:opacity-50"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openEditModal(item)}
                                                        disabled={actionLoading[item.id]}
                                                        className="text-xs px-2.5 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateStatus(item.id, 'active')}
                                                        disabled={actionLoading[item.id]}
                                                        className="text-xs px-2.5 py-1 rounded-md bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateStatus(item.id, 'suspended')}
                                                        disabled={actionLoading[item.id]}
                                                        className="text-xs px-2.5 py-1 rounded-md bg-orange-50 text-orange-700 hover:bg-orange-100 disabled:opacity-50"
                                                    >
                                                        Suspend
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateStatus(item.id, 'rejected')}
                                                        disabled={actionLoading[item.id]}
                                                        className="text-xs px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                                                    >
                                                        Reject
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        disabled={actionLoading[item.id]}
                                                        className="text-xs px-2.5 py-1 rounded-md bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-surface rounded-2xl border border-border shadow-sm p-6 space-y-6 dark:bg-dark dark:border-gray-800">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Publishing Guardrails</h3>
                        <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">Quick reminders for consistent moderation.</p>
                    </div>
                    <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">Check for clear titles and concise descriptions.</div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">Approve only if content aligns with wellbeing guidelines.</div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">Suspend content with unresolved reports.</div>
                    </div>
                    <div className="bg-primary/10 text-primary rounded-xl p-4 text-sm">
                        Tip: use the status filter to triage pending items faster.
                    </div>
                </div>
            </div>

            {editingItem && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-200 max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Edit {activeTab === 'affirmations' ? 'Affirmation' : activeTab === 'resources' ? 'Resource' : 'Circle'}
                            </h3>
                            <button
                                onClick={closeEditModal}
                                disabled={savingEdit}
                                className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
                            >
                                Close
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {activeTab === 'circles' && (
                                <>
                                    <input
                                        value={editForm.name}
                                        onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
                                        placeholder="Circle name"
                                    />
                                    <textarea
                                        value={editForm.description}
                                        onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm h-28 resize-none"
                                        placeholder="Description"
                                    />
                                    <input
                                        value={editForm.image}
                                        onChange={(e) => setEditForm((prev) => ({ ...prev, image: e.target.value }))}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
                                        placeholder="Image URL"
                                    />
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <input
                                            value={editForm.type}
                                            onChange={(e) => setEditForm((prev) => ({ ...prev, type: e.target.value }))}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
                                            placeholder="Type (public/private)"
                                        />
                                        <input
                                            value={editForm.category}
                                            onChange={(e) => setEditForm((prev) => ({ ...prev, category: e.target.value }))}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
                                            placeholder="Category"
                                        />
                                        <input
                                            value={editForm.status}
                                            onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
                                            placeholder="Status"
                                        />
                                    </div>
                                </>
                            )}

                            {activeTab === 'resources' && (
                                <>
                                    <input
                                        value={editForm.title}
                                        onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
                                        placeholder="Title"
                                    />
                                    <textarea
                                        value={editForm.description}
                                        onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm h-24 resize-none"
                                        placeholder="Short description"
                                    />
                                    <textarea
                                        value={editForm.content}
                                        onChange={(e) => setEditForm((prev) => ({ ...prev, content: e.target.value }))}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm h-40 resize-y"
                                        placeholder="Full article content"
                                    />
                                    <input
                                        value={editForm.image}
                                        onChange={(e) => setEditForm((prev) => ({ ...prev, image: e.target.value }))}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
                                        placeholder="Image URL"
                                    />
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                        <input
                                            value={editForm.category}
                                            onChange={(e) => setEditForm((prev) => ({ ...prev, category: e.target.value }))}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
                                            placeholder="Category"
                                        />
                                        <input
                                            value={editForm.tag}
                                            onChange={(e) => setEditForm((prev) => ({ ...prev, tag: e.target.value }))}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
                                            placeholder="Tag"
                                        />
                                        <input
                                            value={editForm.time}
                                            onChange={(e) => setEditForm((prev) => ({ ...prev, time: e.target.value }))}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
                                            placeholder="Time (e.g. 10 min)"
                                        />
                                        <input
                                            value={editForm.status}
                                            onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
                                            placeholder="Status"
                                        />
                                    </div>
                                </>
                            )}

                            {activeTab === 'affirmations' && (
                                <>
                                    <textarea
                                        value={editForm.content}
                                        onChange={(e) => setEditForm((prev) => ({ ...prev, content: e.target.value }))}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm h-36 resize-none"
                                        placeholder="Affirmation content"
                                    />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <input
                                            type="date"
                                            value={editForm.scheduledDate || ''}
                                            onChange={(e) => setEditForm((prev) => ({ ...prev, scheduledDate: e.target.value }))}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
                                        />
                                        <input
                                            value={editForm.status}
                                            onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
                                            placeholder="Status"
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
                            <button
                                onClick={closeEditModal}
                                disabled={savingEdit}
                                className="px-4 py-2 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={savingEdit}
                                className="px-4 py-2 rounded-lg text-sm bg-primary text-white hover:bg-[#008f85] disabled:opacity-50"
                            >
                                {savingEdit ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
