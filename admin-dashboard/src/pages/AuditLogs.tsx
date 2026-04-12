import { useCallback, useEffect, useMemo, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import { formatDateTimeUK } from '../lib/date';
import { Search, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AuditLogItem {
    id: string;
    action: string;
    actorEmail: string;
    actorRole: string;
    targetCollection?: string | null;
    targetId?: string | null;
    metadata?: Record<string, unknown>;
    createdAt?: string;
}

interface AuditLogResponse {
    items?: AuditLogItem[];
}

export const AuditLogs = () => {
    const { can } = useAuth();
    const [logs, setLogs] = useState<AuditLogItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchAuditLogs = useCallback(async () => {
        if (!can('audit.view')) return;
        setLoading(true);
        try {
            const getAdminAuditLogs = httpsCallable(functions, 'getAdminAuditLogs');
            const result = await getAdminAuditLogs({ limit: 150 });
            const data = (result.data ?? {}) as AuditLogResponse;
            setLogs(data.items || []);
        } catch (error) {
            console.error('Failed to fetch audit logs', error);
        } finally {
            setLoading(false);
        }
    }, [can]);

    useEffect(() => {
        void fetchAuditLogs();
    }, [fetchAuditLogs]);

    const filteredLogs = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return logs;
        return logs.filter((log) => {
            const target = `${log.targetCollection || ''} ${log.targetId || ''}`.toLowerCase();
            const actor = `${log.actorEmail || ''} ${log.actorRole || ''}`.toLowerCase();
            const action = String(log.action || '').toLowerCase();
            return target.includes(term) || actor.includes(term) || action.includes(term);
        });
    }, [logs, searchTerm]);

    if (!can('audit.view')) {
        return (
            <div className="rounded-2xl border border-border bg-surface p-8 text-center text-gray-500">
                You do not have permission to view audit logs.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-display text-gray-900">Audit Trail</h2>
                    <p className="text-gray-500 text-sm mt-1">Immutable admin actions for accountability and incident response.</p>
                </div>
                <button
                    onClick={fetchAuditLogs}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <div className="relative w-72">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search action, actor, target..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                    </div>
                    <div className="text-sm text-gray-400">{filteredLogs.length} events</div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 text-xs text-gray-500 uppercase tracking-wider">
                                <th className="px-6 py-4 font-semibold">When</th>
                                <th className="px-6 py-4 font-semibold">Actor</th>
                                <th className="px-6 py-4 font-semibold">Action</th>
                                <th className="px-6 py-4 font-semibold">Target</th>
                                <th className="px-6 py-4 font-semibold">Metadata</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-400">Loading audit logs...</td></tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-400">No audit records found.</td></tr>
                            ) : filteredLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-gray-600">{log.createdAt ? formatDateTimeUK(log.createdAt) : 'N/A'}</td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-medium text-gray-900">{log.actorEmail || 'Unknown'}</p>
                                        <p className="text-xs text-gray-500">{log.actorRole || 'N/A'}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium uppercase tracking-wide">{log.action}</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {(log.targetCollection || 'N/A')}{log.targetId ? `/${log.targetId}` : ''}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-500">
                                        <pre className="whitespace-pre-wrap break-all">{JSON.stringify(log.metadata || {}, null, 2)}</pre>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
