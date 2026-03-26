import { useEffect, useMemo, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { Plus, Trash2, Edit2, Search, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Modal } from '../components/Modal';
import { useNotification } from '../contexts/NotificationContext';

interface Question {
    id: string;
    text: string;
    type: 'scale' | 'boolean' | 'text';
    category: string;
    tags: string[];
    weight: number;
    order: number;
    isActive: boolean;
}

export const Assessments = () => {
    const { showNotification } = useNotification();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState<{
        title: string;
        message: string;
        confirmText?: string;
        type?: 'danger' | 'warning' | 'info';
        onConfirm: () => Promise<void> | void;
    }>({
        title: '',
        message: '',
        confirmText: 'Confirm',
        type: 'danger',
        onConfirm: () => { }
    });

    const [formData, setFormData] = useState<{
        text: string;
        type: Question['type'];
        category: string;
        tags: string;
        weight: number;
        order: number;
    }>({
        text: '',
        type: 'scale',
        category: 'General',
        tags: '',
        weight: 1,
        order: 1
    });

    useEffect(() => {
        const q = query(collection(db, 'assessment_questions'), orderBy('order', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((docSnap) => ({
                id: docSnap.id,
                ...docSnap.data()
            })) as Question[];
            setQuestions(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const categories = useMemo(() => Array.from(new Set(questions.map((question) => question.category).filter(Boolean))), [questions]);

    const filteredQuestions = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        return questions.filter((question) => {
            const matchesCategory = categoryFilter === 'all' || question.category === categoryFilter;
            const matchesTerm = !term || `${question.text} ${question.category} ${(question.tags || []).join(' ')}`.toLowerCase().includes(term);
            return matchesCategory && matchesTerm;
        });
    }, [questions, searchTerm, categoryFilter]);

    const stats = useMemo(() => ({
        total: questions.length,
        active: questions.filter((question) => question.isActive !== false).length,
        archived: questions.filter((question) => question.isActive === false).length,
        categories: categories.length
    }), [categories.length, questions]);

    const openConfirm = (
        title: string,
        message: string,
        onConfirm: () => Promise<void> | void,
        options?: {
            confirmText?: string;
            type?: 'danger' | 'warning' | 'info';
        }
    ) => {
        setConfirmConfig({
            title,
            message,
            onConfirm,
            confirmText: options?.confirmText ?? 'Confirm',
            type: options?.type ?? 'danger'
        });
        setConfirmOpen(true);
    };

    const handleConfirm = async () => {
        try {
            setConfirmLoading(true);
            await confirmConfig.onConfirm();
            setConfirmOpen(false);
        } finally {
            setConfirmLoading(false);
        }
    };

    const handleOpenModal = (question?: Question) => {
        if (question) {
            setEditingId(question.id);
            setFormData({
                text: question.text,
                type: question.type,
                category: question.category,
                tags: question.tags.join(', '),
                weight: question.weight,
                order: question.order
            });
        } else {
            setEditingId(null);
            setFormData({
                text: '',
                type: 'scale',
                category: 'General',
                tags: '',
                weight: 1,
                order: questions.length + 1
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                text: formData.text,
                type: formData.type,
                category: formData.category,
                tags: formData.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
                weight: Number(formData.weight),
                order: Number(formData.order),
                updatedAt: serverTimestamp(),
                isActive: true
            };

            if (editingId) {
                await updateDoc(doc(db, 'assessment_questions', editingId), payload);
            } else {
                await addDoc(collection(db, 'assessment_questions'), {
                    ...payload,
                    createdAt: serverTimestamp()
                });
            }

            showNotification('success', editingId ? 'Question updated.' : 'Question created.');
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error saving question:', error);
            showNotification('error', 'Failed to save question.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        openConfirm(
            'Delete assessment question?',
            'This question will be removed permanently.',
            async () => {
                try {
                    await deleteDoc(doc(db, 'assessment_questions', id));
                    showNotification('success', 'Question deleted.');
                } catch (error) {
                    console.error('Error deleting question:', error);
                    showNotification('error', 'Failed to delete question.');
                    throw error;
                }
            },
            { confirmText: 'Delete', type: 'danger' }
        );
    };

    const handleToggleActive = async (question: Question) => {
        try {
            await updateDoc(doc(db, 'assessment_questions', question.id), {
                isActive: question.isActive === false ? true : false,
                updatedAt: serverTimestamp()
            });
            showNotification('success', question.isActive === false ? 'Question activated.' : 'Question archived.');
        } catch (error) {
            console.error('Error toggling question state:', error);
            showNotification('error', 'Failed to update question state.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-display text-gray-900 dark:text-gray-100">Assessments</h2>
                    <p className="text-gray-500 text-sm mt-1 dark:text-gray-400">Manage assessment questions and scoring logic.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setLoading(true)}
                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                    >
                        <RefreshCw size={16} className="inline mr-2" />
                        Live Sync
                    </button>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-[#008f85] transition-colors"
                    >
                        <Plus size={18} />
                        Add Question
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border border-border rounded-2xl p-4 shadow-sm">
                    <p className="text-xs uppercase tracking-widest text-gray-500">Total Questions</p>
                    <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.total}</p>
                </div>
                <div className="bg-white border border-border rounded-2xl p-4 shadow-sm">
                    <p className="text-xs uppercase tracking-widest text-gray-500">Active</p>
                    <p className="mt-2 text-3xl font-semibold text-emerald-600">{stats.active}</p>
                </div>
                <div className="bg-white border border-border rounded-2xl p-4 shadow-sm">
                    <p className="text-xs uppercase tracking-widest text-gray-500">Archived</p>
                    <p className="mt-2 text-3xl font-semibold text-amber-600">{stats.archived}</p>
                </div>
                <div className="bg-white border border-border rounded-2xl p-4 shadow-sm">
                    <p className="text-xs uppercase tracking-widest text-gray-500">Categories</p>
                    <p className="mt-2 text-3xl font-semibold text-blue-600">{stats.categories}</p>
                </div>
            </div>

            <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden dark:bg-dark dark:border-gray-800">
                <div className="p-4 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="relative w-full md:w-72">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search questions, tags, category..."
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                    </div>
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700"
                    >
                        <option value="all">All categories</option>
                        {categories.map((category) => (
                            <option key={category} value={category}>{category}</option>
                        ))}
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 text-xs text-gray-500 uppercase tracking-wider dark:bg-gray-800/50 dark:text-gray-400">
                                <th className="px-6 py-4 font-semibold w-12">#</th>
                                <th className="px-6 py-4 font-semibold">Question Text</th>
                                <th className="px-6 py-4 font-semibold">Category</th>
                                <th className="px-6 py-4 font-semibold">Themes (Tags)</th>
                                <th className="px-6 py-4 font-semibold">Weight</th>
                                <th className="px-6 py-4 font-semibold">State</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading ? (
                                <tr><td colSpan={7} className="p-8 text-center text-gray-400">Loading questions...</td></tr>
                            ) : filteredQuestions.length === 0 ? (
                                <tr><td colSpan={7} className="p-8 text-center text-gray-400">No questions found. Add one to get started.</td></tr>
                            ) : filteredQuestions.map((question) => (
                                <motion.tr
                                    key={question.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="hover:bg-gray-50/50 transition-colors dark:hover:bg-gray-800/50"
                                >
                                    <td className="px-6 py-4 text-gray-400 font-mono text-xs">{question.order}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{question.text}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{question.category}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-1 flex-wrap">
                                            {question.tags?.map((tag) => (
                                                <span key={tag} className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{question.weight}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${question.isActive === false ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                            {question.isActive === false ? 'Archived' : 'Active'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => handleOpenModal(question)} className="p-1.5 text-gray-400 hover:text-primary rounded-md hover:bg-primary/5 transition-colors">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleToggleActive(question)} className="p-1.5 text-gray-400 hover:text-amber-600 rounded-md hover:bg-amber-50 transition-colors">
                                                {question.isActive === false ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                                            </button>
                                            <button onClick={() => handleDelete(question.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors">
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

            <AnimatePresence>
                {isModalOpen && (
                    <Modal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        title={editingId ? 'Edit Question' : 'Add Question'}
                        maxWidth="max-w-lg"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="space-y-4"
                        >
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Question Text</label>
                                <input
                                    type="text"
                                    value={formData.text}
                                    onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                    placeholder="e.g. I feel relaxed..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Theme Tags (comma sep)</label>
                                    <input
                                        type="text"
                                        value={formData.tags}
                                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                        placeholder="Stress, Sleep"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Weight</label>
                                    <input
                                        type="number"
                                        value={formData.weight}
                                        onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Order</label>
                                    <input
                                        type="number"
                                        value={formData.order}
                                        onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as Question['type'] })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                    >
                                        <option value="scale">Scale (1-5)</option>
                                        <option value="boolean">Yes/No</option>
                                        <option value="text">Text</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Category</label>
                                <input
                                    type="text"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                    placeholder="General"
                                />
                            </div>

                            <div className="pt-2 flex justify-end gap-3">
                                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">Cancel</button>
                                <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-[#008f85] shadow-sm disabled:opacity-50">{saving ? 'Saving...' : 'Save Question'}</button>
                            </div>
                        </motion.div>
                    </Modal>
                )}
            </AnimatePresence>

            <ConfirmDialog
                isOpen={confirmOpen}
                onClose={() => {
                    if (!confirmLoading) setConfirmOpen(false);
                }}
                onConfirm={() => {
                    void handleConfirm();
                }}
                title={confirmConfig.title}
                message={confirmConfig.message}
                confirmText={confirmConfig.confirmText}
                loading={confirmLoading}
                type={confirmConfig.type || 'danger'}
            />
        </div>
    );
};
