
import { Folder, Image, FileText, BarChart2 } from 'lucide-react';

const storageItems = [
    { icon: FileText, label: 'Documents Files', size: '1.3GB', count: 1328, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { icon: BarChart2, label: 'Media Files', size: '15.3GB', count: 1328, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { icon: Folder, label: 'Other Files', size: '1.3GB', count: 1328, color: 'text-orange-400', bg: 'bg-orange-400/10' },
    { icon: Image, label: 'Unknown', size: '1.3GB', count: 140, color: 'text-green-400', bg: 'bg-green-400/10' },
];

export const StorageDetails = () => {
    // PieChart simplified with CSS or SVG for now, or just list
    return (
        <div className="bg-surface p-6 rounded-xl border border-border h-full">
            <h3 className="text-lg font-semibold text-white mb-6">Storage Details</h3>

            {/* Simple Radial Chart Placeholder using CSS */}
            <div className="flex justify-center mb-8 relative">
                <div className="w-48 h-48 rounded-full border-8 border-surface ring-8 ring-primary/20 flex items-center justify-center relative">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="96" cy="96" r="88" strokeWidth="12" stroke="#374151" fill="none" />
                        <circle cx="96" cy="96" r="88" strokeWidth="12" stroke="#7e3af2" fill="none" strokeDasharray="552" strokeDashoffset="150" strokeLinecap="round" />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                        <span className="text-3xl font-bold text-white">29.1</span>
                        <span className="text-xs text-gray-400">GB Used</span>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {storageItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-white/5 transition-colors">
                        <div className="flex items-center">
                            <div className={`p-2 rounded-lg mr-3 ${item.bg} ${item.color}`}>
                                <item.icon size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white">{item.label}</p>
                                <p className="text-xs text-gray-400">{item.count} Files</p>
                            </div>
                        </div>
                        <span className="font-semibold text-sm text-white">{item.size}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
