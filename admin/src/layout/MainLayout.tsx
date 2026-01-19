import React from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';

interface MainLayoutProps {
    children: React.ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
    return (
        <div className="min-h-screen bg-[#F8F9FB]">
            <Sidebar />
            <div className="md:ml-64 flex flex-col min-h-screen transition-all duration-300">
                <Header />
                <main className="flex-1 p-8">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};
