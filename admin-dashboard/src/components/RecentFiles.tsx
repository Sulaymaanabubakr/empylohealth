
import { FileText, MoreVertical } from 'lucide-react';

const recentFiles = [
    { name: "Project Requirements.pdf", size: "2.3 MB", date: "Jan 12, 2024", type: "PDF" },
    { name: "Dashboard Design.fig", size: "15 MB", date: "Jan 10, 2024", type: "FIG" },
    { name: "Client Meeting.docx", size: "1.2 MB", date: "Jan 08, 2024", type: "DOC" },
    { name: "Financial Report.xlsx", size: "5.5 MB", date: "Jan 05, 2024", type: "XLS" },
];

export const RecentFiles = () => {
    return (
        <div className="bg-surface p-6 rounded-xl border border-border">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Files</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-border text-gray-400 text-sm">
                            <th className="pb-3 font-medium">File Name</th>
                            <th className="pb-3 font-medium">Date</th>
                            <th className="pb-3 font-medium">Size</th>
                            <th className="pb-3 font-medium">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentFiles.map((file, i) => (
                            <tr key={i} className="group hover:bg-white/5 transition-colors">
                                <td className="py-3 flex items-center">
                                    <div className="bg-blue-500/10 p-2 rounded mr-3 text-blue-400">
                                        <FileText size={16} />
                                    </div>
                                    <span className="text-sm font-medium text-white group-hover:text-primary transition-colors">{file.name}</span>
                                </td>
                                <td className="py-3 text-sm text-gray-400">{file.date}</td>
                                <td className="py-3 text-sm text-gray-400">{file.size}</td>
                                <td className="py-3 text-sm text-gray-400">
                                    <button className="hover:text-white"><MoreVertical size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
