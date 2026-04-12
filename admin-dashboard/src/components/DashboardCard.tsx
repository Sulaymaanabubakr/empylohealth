import { FileText, Users, CheckCircle, Clock } from 'lucide-react';
import clsx from 'clsx';

interface DashboardCardProps {
    title: string;
    files: number;
    size: string; // Used for secondary metric or label
    type: string; // Used to pick icon
}

export const DashboardCard = ({ title, files, type }: DashboardCardProps) => { // 'type' here maps to icon style

    const getIcon = () => {
        switch (type) {
            case 'users': return <Users size={24} className="text-blue-600" />;
            case 'success': return <CheckCircle size={24} className="text-green-600" />;
            case 'pending': return <Clock size={24} className="text-orange-600" />;
            default: return <FileText size={24} className="text-primary" />;
        }
    };

    const getBgColor = () => {
        switch (type) {
            case 'users': return 'bg-blue-100';
            case 'success': return 'bg-green-100';
            case 'pending': return 'bg-orange-100';
            default: return 'bg-primary/10';
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
                    <h3 className="text-3xl font-bold text-gray-900">{files.toLocaleString()}</h3>
                </div>
                <div className={clsx("p-3 rounded-xl", getBgColor())}>
                    {getIcon()}
                </div>
            </div>

            <div className="flex items-center text-xs font-medium">
                <span className="text-green-500 bg-green-50 px-2 py-0.5 rounded mr-2">
                    +5%
                </span>
                <span className="text-gray-400">from last month</span>
            </div>
        </div>
    );
};
