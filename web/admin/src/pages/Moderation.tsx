import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import { Search, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import { useNotification } from '../contexts/NotificationContext';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface Report {
    id: string;
    reason: string;
    details: string;
    status: 'pending' | 'resolved';
    reportedBy: string;
    reportedUserId?: string;
    contentId?: string;
    contentType?: string; // 'circles', 'messages', 'users'
    createdAt: string;
}

export const Moderation = () => {
    const { showNotification } = useNotification();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'pending' | 'resolved'>('pending');

    // Confirm Dialog
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState<{
        title: string;
        message: string;
        onConfirm: () => void;
        type: 'danger' | 'warning' | 'info';
    }>({ title: '', message: '', onConfirm: () => { }, type: 'danger' });

    const fetchReports = async () => {
        setLoading(true);
        try {
            const getReports = httpsCallable(functions, 'getReports');
            const result = await getReports({ limit: 100, status: activeTab });
            const data = result.data as any;
            setReports(data.items || []);
        } catch (error) {
            console.error("Fetch error", error);
            // showNotification('error', "Failed to fetch reports."); // backend might not be ready
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, [activeTab]);

    const confirmAction = (title: string, message: string, action: () => void, type: 'danger' | 'warning' | 'info' = 'danger') => {
        setConfirmConfig({ title, message, onConfirm: action, type });
        setConfirmOpen(true);
    };

    const handleResolve = async (id: string, action: 'dismiss' | 'suspend_user' | 'delete_content') => {
        confirmAction(
            action === 'dismiss' ? 'Dismiss Report?' : (action === 'suspend_user' ? 'Suspend & Resolve?' : 'Delete & Resolve?'),
            action === 'dismiss'
                ? 'This will mark the report as resolved with no action taken.'
                : 'This will perform the definitive action and mark the report as resolved.',
            async () => {
                setConfirmOpen(false);
                try {
                    const resolveReport = httpsCallable(functions, 'resolveReport');
                    await resolveReport({ reportId: id, action });
                    showNotification('success', 'Report resolved.');
                    fetchReports();
                } catch (err) {
                    console.error("Resolution failed", err);
                    showNotification('error', 'Failed to resolve report.');
                }
            },
            action === 'dismiss' ? 'info' : 'danger'
        );
    };



    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-display text-gray-900">Moderation Center</h2>
                    <p className="text-gray-500 text-sm mt-1">Review flagged content and user reports.</p>
                </div>
                <div className="relative w-full md:w-64">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search reports..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-100 outline-none"
                    />
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button onClick={() => setActiveTab('pending')} className={`text-left border ${activeTab === 'pending' ? 'border-primary ring-1 ring-primary' : 'border-border'} rounded-2xl p-4 shadow-sm bg-white hover:bg-gray-50 transition-all`}>
                    <p className="text-xs uppercase tracking-widest text-gray-500">Pending Review</p>
                    <p className="mt-2 text-3xl font-semibold text-rose-600">{loading ? '...' : reports.length}</p>
                </button>
                <div className="border border-border rounded-2xl p-4 shadow-sm bg-gray-50 opacity-60">
                    <p className="text-xs uppercase tracking-widest text-gray-500">Auto-Flagged (AI)</p>
                    <p className="mt-2 text-3xl font-semibold text-gray-900">N/A</p>
                </div>
                <div className="border border-border rounded-2xl p-4 shadow-sm bg-gray-50 opacity-60">
                    <p className="text-xs uppercase tracking-widest text-gray-500">Avg Resolution Time</p>
                    <p className="mt-2 text-3xl font-semibold text-gray-900">N/A</p>
                </div>
            </div>

            <div className="flex p-1 bg-gray-100 rounded-lg w-fit">
                <button onClick={() => setActiveTab('pending')} className={clsx("px-4 py-1.5 text-sm font-medium rounded-md transition-all", activeTab === 'pending' ? "bg-white shadow-sm" : "text-gray-500")}>Pending</button>
                <button onClick={() => setActiveTab('resolved')} className={clsx("px-4 py-1.5 text-sm font-medium rounded-md transition-all", activeTab === 'resolved' ? "bg-white shadow-sm" : "text-gray-500")}>Resolved History</button>
            </div>

            {/* List */}
            <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-400">Loading reports...</div>
                ) : reports.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">No {activeTab} reports found.</div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {reports.map((report) => (
                            <motion.div
                                key={report.id}
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="p-6 flex flex-col items-start gap-4 hover:bg-gray-50/50 transition-colors"
                            >
                                <div className="flex items-start gap-4 w-full">
                                    <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                                        <AlertTriangle size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-gray-900 text-sm uppercase tracking-wide">{report.reason}</span>
                                            <span className="text-xs text-gray-400">• {new Date(report.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-gray-600 text-sm mb-2">{report.details}</p>
                                        <div className="flex gap-4 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg w-fit">
                                            <span>Type: <b>{report.contentType || 'User'}</b></span>
                                            <span>Reported By: <b>{report.reportedBy}</b></span>
                                        </div>
                                    </div>

                                    {activeTab === 'pending' && (
                                        <div className="flex flex-col gap-2 shrink-0">
                                            <button
                                                onClick={() => handleResolve(report.id, 'dismiss')}
                                                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100"
                                            >
                                                Dismiss (Ignore)
                                            </button>
                                            {report.contentType === 'users' && (
                                                <button
                                                    onClick={() => handleResolve(report.id, 'suspend_user')}
                                                    className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-xs font-medium hover:bg-rose-100"
                                                >
                                                    Suspend User
                                                </button>
                                            )}
                                            {report.contentType !== 'users' && (
                                                <button
                                                    onClick={() => handleResolve(report.id, 'delete_content')}
                                                    className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-xs font-medium hover:bg-rose-100"
                                                >
                                                    Delete Content
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
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
