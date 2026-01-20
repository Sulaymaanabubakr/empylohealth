import React from 'react';
import {
    LayoutDashboard,
    Files,
    Users,
    Settings,
    CreditCard,
    ShieldCheck,
    LogOut
} from 'lucide-react';
import clsx from 'clsx';
import { Logo } from './Logo';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarItemProps {
    icon: React.ReactNode;
    label: string;
    path: string;
    onNavigate?: () => void;
}

const SidebarItem = ({ icon, label, path, onNavigate }: SidebarItemProps) => {
    const location = useLocation();
    const navigate = useNavigate();
    const isActive = location.pathname === path;

    return (
        <div
            onClick={() => {
                navigate(path);
                onNavigate?.();
            }}
            className={clsx(
                "group flex items-center px-4 py-3 cursor-pointer transition-all duration-200 mx-4 mb-1 rounded-lg",
                isActive
                    ? "bg-primary text-white shadow-md shadow-primary/20 bg-gradient-to-r from-primary to-[#008f85]"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
            )}
        >
            <div className={clsx("mr-3", isActive ? "text-white" : "text-gray-400 group-hover:text-primary")}>
                {icon}
            </div>
            <span className="font-medium text-sm">{label}</span>
        </div>
    );
};

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
        onClose();
    };

    return (
        <>
            <aside className={clsx(
                "w-64 h-screen bg-surface border-r border-border flex flex-col fixed left-0 top-0 z-50 transition-transform duration-200",
                isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                {/* Brand */}
                <div className="h-20 flex items-center px-6 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg">
                            <Logo className="w-6 h-6" />
                        </div>
                        <h1 className="text-xl font-bold text-text tracking-tight">Empylo</h1>
                    </div>
                </div>

                <div className="flex-1 py-6 overflow-y-auto custom-scrollbar">
                    <div className="px-6 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Main</div>
                    <SidebarItem icon={<LayoutDashboard size={18} />} label="Dashboard" path="/" onNavigate={onClose} />

                    <div className="px-6 mb-2 mt-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Management</div>
                    <SidebarItem icon={<Users size={18} />} label="Employees" path="/employees" onNavigate={onClose} />
                    <SidebarItem icon={<Files size={18} />} label="Content" path="/content" onNavigate={onClose} />
                    <SidebarItem icon={<CreditCard size={18} />} label="Transactions" path="/transactions" onNavigate={onClose} />
                    <SidebarItem icon={<ShieldCheck size={18} />} label="Moderation" path="/moderation" onNavigate={onClose} />

                    <div className="px-6 mb-2 mt-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">System</div>
                    <SidebarItem icon={<Settings size={18} />} label="Settings" path="/settings" onNavigate={onClose} />
                </div>

                {/* Logout */}
                <div className="p-4 border-t border-border">
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                    >
                        <LogOut size={18} className="mr-3" />
                        Sign Out
                    </button>
                </div>
            </aside>
            {isOpen && (
                <button
                    aria-label="Close sidebar"
                    onClick={onClose}
                    className="fixed inset-0 bg-black/30 z-40 md:hidden"
                />
            )}
        </>
    );
};
