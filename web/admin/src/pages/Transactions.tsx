import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Search, ArrowDownLeft, CreditCard } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import { formatDateUK } from '../lib/date';

interface TransactionRaw {
    id: string;
    user?: string;
    customerName?: string;
    displayName?: string;
    email?: string;
    amount?: number | string;
    status?: string;
    createdAt?: string;
    date?: string;
    type?: string;
}

interface TransactionsResponse {
    items?: TransactionRaw[];
}

export const Transactions = () => {
    const [transactions, setTransactions] = useState<TransactionRaw[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchTransactions = async () => {
            setLoading(true);
            setError('');
            try {
                const getTransactions = httpsCallable(functions, 'getTransactions');
                const result = await getTransactions({ limit: 50 });
                const data = (result.data ?? {}) as TransactionsResponse;
                setTransactions(data.items || []);
            } catch (err) {
                console.error("Failed to fetch transactions", err);
                setError('Failed to fetch transactions.');
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, []);

    const normalizedTransactions = useMemo(() => {
        return transactions.map((trx) => ({
            id: trx.id,
            user: trx.user || trx.customerName || trx.displayName || 'Unknown',
            email: trx.email || '',
            amount: Number(trx.amount || 0),
            status: trx.status || 'pending',
            date: trx.createdAt ? formatDateUK(trx.createdAt) : (trx.date || 'N/A'),
            type: trx.type || 'subscription'
        }));
    }, [transactions]);

    const filteredTransactions = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return normalizedTransactions;
        return normalizedTransactions.filter((trx) => {
            const haystack = `${trx.id} ${trx.user} ${trx.email}`.toLowerCase();
            return haystack.includes(term);
        });
    }, [normalizedTransactions, searchTerm]);

    const stats = useMemo(() => {
        const totalRevenue = filteredTransactions.reduce((sum, t) => sum + (t.status === 'completed' ? t.amount : 0), 0);
        const activeSubs = filteredTransactions.filter((t) => t.status === 'completed').length;
        const failed = filteredTransactions.filter((t) => t.status === 'failed').length;
        return { totalRevenue, activeSubs, failed };
    }, [filteredTransactions]);

    const handleExportCsv = () => {
        const rows = filteredTransactions.map((trx) => [
            trx.id,
            trx.user,
            trx.email,
            trx.amount,
            trx.status,
            trx.date,
            trx.type
        ]);
        const header = ['Transaction ID', 'Customer', 'Email', 'Amount', 'Status', 'Date', 'Type'];
        const csv = [header, ...rows].map((row) => row.map(String).map((value) => `"${value.replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'transactions.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-display text-gray-900">Transactions</h2>
                    <p className="text-gray-500 text-sm mt-1">Track payments, revenue momentum, and subscription health.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleExportCsv}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-surface rounded-xl text-sm font-medium hover:bg-gray-50 text-gray-600 shadow-sm transition-colors"
                    >
                        <Download size={16} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Total Revenue', value: `$${stats.totalRevenue.toFixed(2)}`, change: 'Calculated', color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Completed Payments', value: String(stats.activeSubs), change: 'Calculated', color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Failed Payments', value: String(stats.failed), change: 'Calculated', color: 'text-red-600', bg: 'bg-red-50' },
                ].map((stat, idx) => (
                    <div key={idx} className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                            <h4 className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</h4>
                        </div>
                        <div className={`px-2.5 py-1 rounded-lg text-xs font-bold ${stat.bg} ${stat.color}`}>
                            {stat.change}
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Table */}
                <div className="xl:col-span-2 bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-border flex items-center justify-between">
                        <div className="relative w-64">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search transactions..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 text-xs text-gray-500 uppercase tracking-wider">
                                    <th className="px-6 py-4 font-semibold">Transaction ID</th>
                                    <th className="px-6 py-4 font-semibold">Customer</th>
                                    <th className="px-6 py-4 font-semibold">Amount</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                    <th className="px-6 py-4 font-semibold text-right">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-gray-400">Loading transactions...</td></tr>
                                ) : error ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-red-500">{error}</td></tr>
                                ) : filteredTransactions.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-gray-400">No transactions found.</td></tr>
                                ) : filteredTransactions.map((trx) => (
                                    <motion.tr
                                        key={trx.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-gray-100 rounded-lg text-gray-500 group-hover:bg-surface group-hover:shadow-sm transition-all">
                                                    <CreditCard size={18} />
                                                </div>
                                                <span className="font-mono text-xs font-medium text-gray-600">{trx.id}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-gray-900 text-sm">{trx.user}</p>
                                                <p className="text-xs text-gray-500">{trx.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-gray-900">${trx.amount.toFixed(2)}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border ${trx.status === 'completed' ? 'bg-green-50 text-green-700 border-green-100' :
                                                trx.status === 'pending' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                                    'bg-red-50 text-red-700 border-red-100'
                                                }`}>
                                                {trx.status === 'completed' && <ArrowDownLeft size={12} className="mr-1" />}
                                                {trx.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm text-gray-500 font-mono">
                                            {trx.date}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-surface rounded-2xl border border-border shadow-sm p-6 space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Revenue Insights</h3>
                        <p className="text-sm text-gray-500 mt-1">Snapshot from the current dataset.</p>
                    </div>
                    <div className="space-y-3">
                        <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-gray-500">Avg Payment</p>
                                <p className="text-lg font-semibold text-gray-900">
                                    ${filteredTransactions.length ? (stats.totalRevenue / Math.max(stats.activeSubs, 1)).toFixed(2) : '0.00'}
                                </p>
                            </div>
                            <span className="text-xs text-gray-500">Completed only</span>
                        </div>
                        <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-gray-500">Most Recent</p>
                                <p className="text-sm font-medium text-gray-900">
                                    {filteredTransactions[0]?.user || 'No data'}
                                </p>
                            </div>
                            <span className="text-xs text-gray-500">{filteredTransactions[0]?.date || '—'}</span>
                        </div>
                        <div className="bg-primary/10 text-primary rounded-xl p-4 text-sm">
                            Export CSV to reconcile payments with your billing provider.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
