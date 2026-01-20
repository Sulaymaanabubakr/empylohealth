import { Search, Bell, Menu, Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export const Header = () => {
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-40">
            {/* Mobile Toggle & Search */}
            <div className="flex items-center flex-1">
                <button className="md:hidden mr-4 text-gray-500">
                    <Menu size={24} />
                </button>

                <div className="relative w-full max-w-md hidden md:block">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={16} className="text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search resources, users, or circles..."
                        className="pl-10 pr-4 py-2.5 w-full bg-gray-50 border-none rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none"
                    />
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleTheme}
                    className="p-2 text-gray-400 hover:text-primary hover:bg-gray-50 rounded-full transition-colors"
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                <button className="relative p-2 text-gray-400 hover:text-primary hover:bg-gray-50 rounded-full transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>

                <div className="h-8 w-px bg-gray-100 mx-2"></div>

                <div className="flex items-center gap-3 pl-2">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-bold text-gray-900 leading-none">{user?.displayName || 'Admin User'}</p>
                        <p className="text-xs text-gray-500 mt-1">{user?.email}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary p-0.5">
                        <div className="w-full h-full rounded-full bg-white border-2 border-transparent overflow-hidden flex items-center justify-center">
                            {user?.photoURL ? (
                                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-primary font-bold text-sm">
                                    {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'A'}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};
