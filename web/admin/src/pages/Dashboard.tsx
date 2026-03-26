import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import { DashboardCard } from '../components/DashboardCard';
import { formatDateTimeUK } from '../lib/date';

interface DashboardStats {
    users: number;
    circles: number;
    resources: number;
    pending: number;
    storage: string | null;
}

interface DashboardStatsResponse {
    users?: number;
    circles?: number;
    resources?: number;
    pendingCircles?: number;
    storageUsed?: string | null;
}

interface AuditLogItem {
    id: string;
    action: string;
    actorEmail?: string;
    createdAt?: string;
    targetCollection?: string | null;
}

interface AuditLogResponse {
    items?: AuditLogItem[];
}

interface SupportTicket {
    id: string;
    status: 'open' | 'resolved' | 'pending';
    createdAt?: string;
}

interface SupportTicketsResponse {
    items?: SupportTicket[];
}

const CACHE_KEY = 'dashboard_stats_v1';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const EMPTY_STATS: DashboardStats = { users: 0, circles: 0, resources: 0, pending: 0, storage: null };

const parseStats = (data: DashboardStatsResponse): DashboardStats => ({
    users: data.users ?? 0,
    circles: data.circles ?? 0,
    resources: data.resources ?? 0,
    pending: data.pendingCircles ?? 0,
    storage: data.storageUsed ?? null
});

const readCachedStats = (): { stats: DashboardStats; hasFreshCache: boolean } => {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) return { stats: EMPTY_STATS, hasFreshCache: false };

    try {
        const parsed = JSON.parse(cached) as { data?: DashboardStatsResponse; ts?: number };
        if (!parsed.data || typeof parsed.ts !== 'number') {
            return { stats: EMPTY_STATS, hasFreshCache: false };
        }
        if (Date.now() - parsed.ts >= CACHE_TTL_MS) {
            return { stats: EMPTY_STATS, hasFreshCache: false };
        }
        return { stats: parseStats(parsed.data), hasFreshCache: true };
    } catch {
        return { stats: EMPTY_STATS, hasFreshCache: false };
    }
};

export const Dashboard = () => {
    const initialCache = readCachedStats();
    const [stats, setStats] = useState<DashboardStats>(initialCache.stats);
    const [recentLogs, setRecentLogs] = useState<AuditLogItem[]>([]);
    const [supportSummary, setSupportSummary] = useState({ open: 0, pending: 0 });
    const [activitySeries, setActivitySeries] = useState<Array<{ label: string; count: number }>>([]);
    const didFetchRef = useRef(false);

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
        if (initialCache.hasFreshCache) {
            didFetchRef.current = true;
        }

        // Fetch once per mount if not already fetched or cache stale
        if (didFetchRef.current) return;
        didFetchRef.current = true;

        const fetchStats = async () => {
            try {
                const getDashboardStats = httpsCallable(functions, 'getDashboardStats');
                const getAdminAuditLogs = httpsCallable(functions, 'getAdminAuditLogs');
                const getSupportTickets = httpsCallable(functions, 'getSupportTickets');
                const [statsResult, auditResult, supportResult] = await Promise.all([
                    getDashboardStats(),
                    getAdminAuditLogs({ limit: 20 }),
                    getSupportTickets({ limit: 50 })
                ]);
                const parsed = parseStats((statsResult.data ?? {}) as DashboardStatsResponse);
                setStats(parsed);
                sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: parsed, ts: Date.now() }));

                const logs = (((auditResult.data ?? {}) as AuditLogResponse).items || []).filter((item) => item.createdAt);
                setRecentLogs(logs.slice(0, 6));

                const tickets = (((supportResult.data ?? {}) as SupportTicketsResponse).items || []);
                setSupportSummary({
                    open: tickets.filter((item) => item.status === 'open').length,
                    pending: tickets.filter((item) => item.status === 'pending').length
                });

                const now = new Date();
                const days = Array.from({ length: 7 }, (_, index) => {
                    const date = new Date(now);
                    date.setDate(now.getDate() - (6 - index));
                    const key = date.toISOString().slice(0, 10);
                    return {
                        key,
                        label: date.toLocaleDateString('en-GB', { weekday: 'short' }),
                        count: 0
                    };
                });
                logs.forEach((log) => {
                    if (!log.createdAt) return;
                    const key = new Date(log.createdAt).toISOString().slice(0, 10);
                    const entry = days.find((item) => item.key === key);
                    if (entry) entry.count += 1;
                });
                setActivitySeries(days.map(({ label, count }) => ({ label, count })));
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            }
        };
        void fetchStats();
    }, [initialCache.hasFreshCache]);

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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm min-h-[400px]">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="font-bold text-gray-900">Admin Activity</h3>
                            <p className="text-sm text-gray-500 mt-1">Actions recorded over the last 7 days.</p>
                        </div>
                        <div className="text-sm text-gray-500">
                            Open support: <span className="font-semibold text-gray-900">{supportSummary.open}</span> · Pending: <span className="font-semibold text-gray-900">{supportSummary.pending}</span>
                        </div>
                    </div>
                    <div className="h-64 bg-gray-50 rounded-xl border border-gray-100 p-5 flex items-end gap-4">
                        {activitySeries.length === 0 ? (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">No admin activity yet.</div>
                        ) : (
                            activitySeries.map((point) => {
                                const maxCount = Math.max(...activitySeries.map((item) => item.count), 1);
                                const height = `${Math.max((point.count / maxCount) * 100, point.count > 0 ? 16 : 8)}%`;
                                return (
                                    <div key={point.label} className="flex-1 h-full flex flex-col justify-end items-center gap-3">
                                        <div className="text-xs font-medium text-gray-500">{point.count}</div>
                                        <div className="w-full rounded-t-2xl bg-gradient-to-t from-primary to-[#5fe0d0]" style={{ height }} />
                                        <div className="text-xs uppercase tracking-wide text-gray-400">{point.label}</div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-6">Recent Activity</h3>
                    <div className="space-y-4">
                        {recentLogs.length === 0 ? (
                            <div className="h-48 flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400">
                                No recent activity yet.
                            </div>
                        ) : recentLogs.map((log) => (
                            <div key={log.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm font-semibold text-gray-900 uppercase tracking-wide">{log.action.replace(/_/g, ' ')}</p>
                                    <span className="text-xs text-gray-400">{log.createdAt ? formatDateTimeUK(log.createdAt) : '—'}</span>
                                </div>
                                <p className="text-sm text-gray-600 mt-2">{log.actorEmail || 'Unknown admin'}</p>
                                <p className="text-xs text-gray-500 mt-1">{log.targetCollection || 'system'} action</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
