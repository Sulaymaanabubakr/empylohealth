import { User, Smartphone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Settings = () => {
    const { user } = useAuth();

    return (
        <div className="max-w-3xl space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
                <p className="text-gray-500 text-sm mt-1">Manage your account and preferences.</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <User size={20} className="text-primary" /> Profile Information
                    </h3>
                </div>
                <div className="p-6 space-y-6">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-full bg-gray-100 border-4 border-white shadow-sm flex items-center justify-center text-2xl font-bold text-gray-400">
                            {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <div>
                            <button className="text-sm font-medium text-primary hover:text-[#008f85]">Change Photo</button>
                            <p className="text-xs text-gray-400 mt-1">JPG, GIF or PNG. Max size of 800K</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input type="text" defaultValue={user?.displayName || ''} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-primary" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <input type="email" defaultValue={user?.email || ''} disabled className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg outline-none text-gray-500 cursor-not-allowed" />
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 px-6 py-4 text-right">
                    <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-[#008f85]">Save Changes</button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Smartphone size={20} className="text-primary" /> Application
                    </h3>
                </div>
                <div className="p-6 divide-y divide-gray-50">
                    <div className="flex items-center justify-between py-2">
                        <div>
                            <p className="font-medium text-gray-900">Dark Mode</p>
                            <p className="text-xs text-gray-500">Enable dark theme for the dashboard.</p>
                        </div>
                        <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 cursor-pointer">
                            <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-1" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
