import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, CheckCircle, Clock, Mail, ExternalLink, RefreshCw, MessageSquare } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import clsx from 'clsx';
import { useNotification } from '../contexts/NotificationContext';
import { Modal } from '../components/Modal';

interface Ticket {
    id: string;
    email: string;
    subject: string;
    message: string;
    status: 'open' | 'resolved' | 'pending';
    createdAt: string;
    updatedAt?: string;
}

export const Support = () => {
    const { showNotification } = useNotification();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');

    // View/Reply Modal
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [replyNote, setReplyNote] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const getSupportTickets = httpsCallable(functions, 'getSupportTickets');
            const result = await getSupportTickets({ limit: 50 });
            const data = result.data as any;
            setTickets(data.items || []);
        } catch (err) {
            console.error("Failed to fetch tickets", err);
            // showNotification('error', 'Failed to fetch tickets. (Backend might be deploying)');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const handleUpdateStatus = async (id: string, newStatus: 'open' | 'resolved' | 'pending') => {
        setActionLoading(true);
        try {
            const updateTicketStatus = httpsCallable(functions, 'updateTicketStatus');
            await updateTicketStatus({ ticketId: id, status: newStatus, reply: replyNote });

            showNotification('success', `Ticket marked as ${newStatus}.`);
            setIsModalOpen(false);
            fetchTickets();
        } catch (err) {
            console.error("Failed to update ticket", err);
            showNotification('error', 'Failed to update ticket.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReply = () => {
        // Prepare mailto link
        if (!selectedTicket) return;
        const subject = encodeURIComponent(`Re: ${selectedTicket.subject}`);
        const body = encodeURIComponent(`\n\n> On ${new Date(selectedTicket.createdAt).toLocaleDateString()}, ${selectedTicket.email} wrote:\n> ${selectedTicket.message}`);
        window.open(`mailto:${selectedTicket.email}?subject=${subject}&body=${body}`, '_blank');
        // Optionally mark as pending/resolved or just log text
        setReplyNote('Replied via email');
    };

    const filteredTickets = useMemo(() => {
        let res = tickets;
        if (filter !== 'all') {
            res = res.filter(t => t.status === filter);
        }
        const term = searchTerm.trim().toLowerCase();
        if (term) {
            res = res.filter(t =>
                t.email.toLowerCase().includes(term) ||
                t.subject.toLowerCase().includes(term) ||
                t.message.toLowerCase().includes(term)
            );
        }
        return res;
    }, [tickets, searchTerm, filter]);

    const stats = useMemo(() => ({
        open: tickets.filter(t => t.status === 'open').length,
        resolved: tickets.filter(t => t.status === 'resolved').length,
    }), [tickets]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-display text-gray-900">Customer Support</h2>
                    <p className="text-gray-500 text-sm mt-1">Manage inquiries and support tickets.</p>
                </div>
                <button
                    onClick={fetchTickets}
                    className="flex items-center justify-center p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                >
                    <RefreshCw size={20} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-border rounded-2xl p-4 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-widest text-gray-500">Open Tickets</p>
                        <p className="mt-1 text-3xl font-semibold text-rose-600">{stats.open}</p>
                    </div>
                    <div className="bg-rose-50 text-rose-600 p-3 rounded-xl"><MessageSquare size={24} /></div>
                </div>
                <div className="bg-white border border-border rounded-2xl p-4 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-widest text-gray-500">Resolved</p>
                        <p className="mt-1 text-3xl font-semibold text-emerald-600">{stats.resolved}</p>
                    </div>
                    <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl"><CheckCircle size={24} /></div>
                </div>
                <div className="bg-white border border-border rounded-2xl p-4 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-widest text-gray-500">Response Time</p>
                        <p className="mt-1 text-3xl font-semibold text-blue-600">N/A</p>
                    </div>
                    <div className="bg-blue-50 text-blue-600 p-3 rounded-xl"><Clock size={24} /></div>
                </div>
            </div>

            {/* List */}
            <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex gap-2">
                        {['all', 'open', 'resolved'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f as any)}
                                className={clsx(
                                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize",
                                    filter === f ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                )}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full md:w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search tickets..."
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
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold">Subject</th>
                                <th className="px-6 py-4 font-semibold">User</th>
                                <th className="px-6 py-4 font-semibold">Date</th>
                                <th className="px-6 py-4 font-semibold text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-400">Loading tickets...</td></tr>
                            ) : filteredTickets.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-400">No tickets found.</td></tr>
                            ) : filteredTickets.map((ticket) => (
                                <motion.tr
                                    key={ticket.id}
                                    layout
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    onClick={() => { setSelectedTicket(ticket); setIsModalOpen(true); }}
                                    className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={clsx(
                                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize",
                                            ticket.status === 'open' ? "bg-rose-100 text-rose-800" :
                                                ticket.status === 'resolved' ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                                        )}>
                                            {ticket.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 max-w-xs truncate font-medium text-gray-900">
                                        {ticket.subject}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {ticket.email}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(ticket.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right text-gray-400">
                                        <ExternalLink size={16} />
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Ticket Modal */}
            <Modal
                isOpen={isModalOpen && !!selectedTicket}
                onClose={() => setIsModalOpen(false)}
                title="Ticket Details"
                maxWidth="max-w-2xl"
            >
                {selectedTicket && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{selectedTicket.subject}</h3>
                                <p className="text-sm text-gray-500 mt-1">From: {selectedTicket.email} • {new Date(selectedTicket.createdAt).toLocaleString()}</p>
                            </div>
                            <span className={clsx(
                                "px-3 py-1 rounded-full text-xs font-bold uppercase",
                                selectedTicket.status === 'open' ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                            )}>
                                {selectedTicket.status}
                            </span>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 text-gray-800 whitespace-pre-wrap border border-gray-100">
                            {selectedTicket.message}
                        </div>

                        <div className="border-t border-gray-100 pt-6 flex flex-col gap-4">
                            <textarea
                                className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                placeholder="Add notes or log reply..."
                                rows={3}
                                value={replyNote}
                                onChange={(e) => setReplyNote(e.target.value)}
                            />

                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={handleReply}
                                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    <Mail size={16} /> Reply via Email
                                </button>
                                {selectedTicket.status !== 'resolved' ? (
                                    <button
                                        onClick={() => handleUpdateStatus(selectedTicket.id, 'resolved')}
                                        disabled={actionLoading}
                                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                                    >
                                        Mark as Resolved
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleUpdateStatus(selectedTicket.id, 'open')}
                                        disabled={actionLoading}
                                        className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50"
                                    >
                                        Re-open Ticket
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};
