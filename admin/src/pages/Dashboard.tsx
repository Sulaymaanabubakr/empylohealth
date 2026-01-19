import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import { DashboardCard } from '../components/DashboardCard';
// import { RecentFiles } from '../components/RecentFiles'; // Keep for later refactor

export const Dashboard = () => {
    const [stats, setStats] = useState({ users: 0, circles: 0, resources: 0, pending: 0, storage: '0 GB' });


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
                    storage: data.storageUsed || '0 GB'
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
                <button className="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-gray-200">
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
                        Chart Placeholder
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-6">Recent Activity</h3>
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
                                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                                    US
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">New user registration</p>
                                    <p className="text-xs text-gray-400">2 minutes ago</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
