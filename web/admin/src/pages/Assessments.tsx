import { useEffect, useState } from 'react';
import { db, functions } from '../lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { Plus, Trash2, Edit2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

interface SeedAssessmentQuestionsResponse {
    message?: string;
}

const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    return 'Unknown error';
};

export const Assessments = () => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
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
        // Real-time listener
        const q = query(collection(db, 'assessment_questions'), orderBy('order', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Question[];
            setQuestions(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleOpenModal = (q?: Question) => {
        if (q) {
            setEditingId(q.id);
            setFormData({
                text: q.text,
                type: q.type,
                category: q.category,
                tags: q.tags.join(', '),
                weight: q.weight,
                order: q.order
            });
        } else {
            setEditingId(null);
            setFormData({
                text: '',
                type: 'scale',
                category: 'General',
                tags: 'Stress',
                weight: 1,
                order: questions.length + 1
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const payload = {
                text: formData.text,
                type: formData.type,
                category: formData.category,
                tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
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
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error saving question:", error);
            alert("Failed to save question. Check console.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this question?')) return;
        try {
            await deleteDoc(doc(db, 'assessment_questions', id));
        } catch (error) {
            console.error("Error deleting question:", error);
            alert("Failed to delete. Check permissions.");
        }
    };

    const handleSeed = async () => {
        if (!confirm('This will seed default questions if none exist. Continue?')) return;
        try {
            const seedFn = httpsCallable(functions, 'seedAssessmentQuestions');
            const result = await seedFn();
            const data = (result.data ?? {}) as SeedAssessmentQuestionsResponse;
            alert(data.message || 'Seed complete!');
        } catch (error) {
            console.error("Seed error", error);
            alert(`Seed failed: ${getErrorMessage(error)}`);
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
                        onClick={handleSeed}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                    >
                        Seed Defaults
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

            <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden dark:bg-dark dark:border-gray-800">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 text-xs text-gray-500 uppercase tracking-wider dark:bg-gray-800/50 dark:text-gray-400">
                                <th className="px-6 py-4 font-semibold w-12">#</th>
                                <th className="px-6 py-4 font-semibold">Question Text</th>
                                <th className="px-6 py-4 font-semibold">Themes (Tags)</th>
                                <th className="px-6 py-4 font-semibold">Weight</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-400">Loading questions...</td></tr>
                            ) : questions.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-400">No questions found. Seed defaults or add one.</td></tr>
                            ) : questions.map((q) => (
                                <motion.tr
                                    key={q.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="hover:bg-gray-50/50 transition-colors dark:hover:bg-gray-800/50"
                                >
                                    <td className="px-6 py-4 text-gray-400 font-mono text-xs">{q.order}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{q.text}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-1 flex-wrap">
                                            {q.tags?.map(tag => (
                                                <span key={tag} className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{q.weight}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => handleOpenModal(q)} className="p-1.5 text-gray-400 hover:text-primary rounded-md hover:bg-primary/5 transition-colors">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(q.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors">
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

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden dark:bg-gray-900"
                        >
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between dark:border-gray-800">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    {editingId ? 'Edit Question' : 'Add Question'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Question Text</label>
                                    <input
                                        type="text"
                                        value={formData.text}
                                        onChange={e => setFormData({ ...formData, text: e.target.value })}
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
                                            onChange={e => setFormData({ ...formData, tags: e.target.value })}
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                            placeholder="Stress, Sleep"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Weight</label>
                                        <input
                                            type="number"
                                            value={formData.weight}
                                            onChange={e => setFormData({ ...formData, weight: Number(e.target.value) })}
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
                                            onChange={e => setFormData({ ...formData, order: Number(e.target.value) })}
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Type</label>
                                        <select
                                            value={formData.type}
                                            onChange={e => setFormData({ ...formData, type: e.target.value as Question['type'] })}
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                        >
                                            <option value="scale">Scale (1-5)</option>
                                            <option value="boolean">Yes/No</option>
                                            <option value="text">Text</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 dark:bg-gray-800/50 dark:border-gray-800">
                                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">Cancel</button>
                                <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-[#008f85] shadow-sm">Save Question</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
