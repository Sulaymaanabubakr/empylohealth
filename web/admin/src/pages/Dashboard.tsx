import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import { DashboardCard } from '../components/DashboardCard';
// import { RecentFiles } from '../components/RecentFiles'; // Keep for later refactor

export const Dashboard = () => {
    const [stats, setStats] = useState({ users: 0, circles: 0, resources: 0, pending: 0, storage: null as string | null });
    const [seedToken, setSeedToken] = useState(import.meta.env.VITE_SEED_TOKEN || '');
    const [seedStatus, setSeedStatus] = useState<string | null>(null);
    const [seedLoading, setSeedLoading] = useState(false);

    const getFunctionsBaseUrl = () => {
        const envUrl = import.meta.env.VITE_FUNCTIONS_BASE_URL;
        if (envUrl) return envUrl.replace(/\/+$/, '');
        const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
        return projectId ? `https://us-central1-${projectId}.cloudfunctions.net` : '';
    };

    const handleDownloadReport = () => {
        const rows = [
            ['Total Users', stats.users],
            ['Active Circles', stats.circles],
            ['Resources', stats.resources],
            ['Pending Review', stats.pending],
            ['Storage Used', stats.storage || 'Not tracked']
        ];
        const csv = [['Metric', 'Value'], ...rows]
            .map((row) => row.map(String).map((value) => `"${value.replace(/"/g, '""')}"`).join(','))
            .join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'dashboard-report.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const runSeed = async () => {
        if (!seedToken) {
            setSeedStatus('Seed token required.');
            return;
        }
        const baseUrl = getFunctionsBaseUrl();
        if (!baseUrl) {
            setSeedStatus('Functions base URL not configured.');
            return;
        }
        setSeedLoading(true);
        setSeedStatus(null);
        try {
            const response = await fetch(`${baseUrl}/seedAll?token=${encodeURIComponent(seedToken)}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.error || 'Seed failed');
            }
            setSeedStatus(`Seed complete. ${JSON.stringify(data.results)}`);
        } catch (error: any) {
            setSeedStatus(error?.message || 'Seed failed');
        } finally {
            setSeedLoading(false);
        }
    };

    const runBackfillImages = async () => {
        if (!seedToken) {
            setSeedStatus('Seed token required.');
            return;
        }
        const baseUrl = getFunctionsBaseUrl();
        if (!baseUrl) {
            setSeedStatus('Functions base URL not configured.');
            return;
        }
        setSeedLoading(true);
        setSeedStatus(null);
        try {
            const response = await fetch(`${baseUrl}/backfillAffirmationImages?token=${encodeURIComponent(seedToken)}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.error || 'Backfill failed');
            }
            setSeedStatus(`Backfill complete. ${JSON.stringify(data.result)}`);
        } catch (error: any) {
            setSeedStatus(error?.message || 'Backfill failed');
        } finally {
            setSeedLoading(false);
        }
    };

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const getDashboardStats = httpsCallable(functions, 'getDashboardStats');
                const result = await getDashboardStats();
                const data = result.data as any;
                setStats({
                    users: data.users || 0,
                    circles: data.circles || 0,
                    resources: data.resources || 0,
                    pending: data.pendingCircles || 0,
                    storage: data.storageUsed || null
                });
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            } finally {
                // Done
            }
        };
        fetchStats();
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-8"
        >
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Overview</h2>
                    <p className="text-gray-500 text-sm mt-1">Here's what's happening with your community today.</p>
                </div>
                <button
                    onClick={handleDownloadReport}
                    className="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-gray-200"
                >
                    Download Report
                </button>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <DashboardCard title="Total Users" files={stats.users} size="Active" type="users" />
                <DashboardCard title="Active Circles" files={stats.circles} size="Community" type="success" />
                <DashboardCard title="Resources" files={stats.resources} size="Library" type="default" />
                <DashboardCard title="Pending Review" files={stats.pending} size="Action Req" type="pending" />
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h3 className="font-bold text-gray-900">Seed Content</h3>
                        <p className="text-sm text-gray-500">Run seed and affirmation image backfill directly from admin.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                        <input
                            type="password"
                            value={seedToken}
                            onChange={(event) => setSeedToken(event.target.value)}
                            placeholder="Seed token"
                            className="w-full sm:w-64 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                        />
                        <button
                            onClick={runSeed}
                            disabled={seedLoading}
                            className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-gray-200 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {seedLoading ? 'Working…' : 'Seed All'}
                        </button>
                        <button
                            onClick={runBackfillImages}
                            disabled={seedLoading}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {seedLoading ? 'Working…' : 'Backfill Images'}
                        </button>
                    </div>
                </div>
                {seedStatus && (
                    <div className="text-xs text-gray-500 break-words">
                        {seedStatus}
                    </div>
                )}
            </div>

            {/* Main Content Sections - Placeholder for now until Charts/Tables are refactored */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm min-h-[400px]">
                    <h3 className="font-bold text-gray-900 mb-6">User Growth Analytics</h3>
                    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400">
                        No analytics data yet.
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-6">Recent Activity</h3>
                    <div className="h-48 flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400">
                        No recent activity yet.
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
