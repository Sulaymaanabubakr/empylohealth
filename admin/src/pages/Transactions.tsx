import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Search, ArrowDownLeft, CreditCard } from 'lucide-react';

export const Transactions = () => {
    // Mock Data for Visuals (since backend has no payments yet)
    const [transactions] = useState([
        { id: 'TRX-9821', user: 'Sarah Johnson', email: 'sarah.j@example.com', amount: 49.00, status: 'completed', date: 'Oct 24, 2024', type: 'subscription' },
        { id: 'TRX-9822', user: 'Michael Chen', email: 'm.chen@tech.co', amount: 120.00, status: 'completed', date: 'Oct 23, 2024', type: 'subscription' },
        { id: 'TRX-9823', user: 'Emma Wilson', email: 'emma.w@design.io', amount: 49.00, status: 'failed', date: 'Oct 23, 2024', type: 'subscription' },
        { id: 'TRX-9824', user: 'James Rod', email: 'j.rod@mail.com', amount: 240.00, status: 'pending', date: 'Oct 22, 2024', type: 'yearly' },
        { id: 'TRX-9825', user: 'Lisa Wong', email: 'lisa.w@art.net', amount: 49.00, status: 'completed', date: 'Oct 21, 2024', type: 'subscription' },
    ]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Transactions</h2>
                    <p className="text-gray-500 text-sm mt-1">Monitor revenue and subscription payments.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white rounded-xl text-sm font-medium hover:bg-gray-50 text-gray-600 shadow-sm transition-colors">
                        <Download size={16} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Total Revenue', value: '$12,450', change: '+12%', color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Active Subscriptions', value: '843', change: '+5%', color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Failed Payments', value: '12', change: '-2%', color: 'text-red-600', bg: 'bg-red-50' },
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
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

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="relative w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" placeholder="Search transactions..." className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
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
                            {transactions.map((trx) => (
                                <motion.tr
                                    key={trx.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-gray-100 rounded-lg text-gray-500 group-hover:bg-white group-hover:shadow-sm transition-all">
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
        </div>
    );
};
