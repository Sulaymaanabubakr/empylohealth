import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import { DashboardCard } from '../components/DashboardCard';

export const Dashboard = () => {
    const [stats, setStats] = useState({ users: 0, circles: 0, resources: 0, pending: 0, storage: null as string | null });
    const didFetchRef = useRef(false);
    const CACHE_KEY = 'dashboard_stats_v1';
    const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

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

    useEffect(() => {
        // Serve cached stats immediately if fresh to avoid reloading on tab switches
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
            try {
                const { data, ts } = JSON.parse(cached);
                if (Date.now() - ts < CACHE_TTL_MS) {
                    setStats(data);
                    didFetchRef.current = true;
                }
            } catch {
                // ignore cache parse errors
            }
        }

        // Fetch once per mount if not already fetched or cache stale
        if (didFetchRef.current) return;
        didFetchRef.current = true;

        const fetchStats = async () => {
            try {
                const getDashboardStats = httpsCallable(functions, 'getDashboardStats');
                const result = await getDashboardStats();
                const data = result.data as any;
                const parsed = {
                    users: data.users || 0,
                    circles: data.circles || 0,
                    resources: data.resources || 0,
                    pending: data.pendingCircles || 0,
                    storage: data.storageUsed || null
                };
                setStats(parsed);
                sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: parsed, ts: Date.now() }));
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            }
        };
        void fetchStats();
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
