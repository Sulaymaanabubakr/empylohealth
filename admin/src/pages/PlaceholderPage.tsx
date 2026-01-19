
import { Construction } from 'lucide-react';

interface PlaceholderProps {
    title: string;
}

export const PlaceholderPage = ({ title }: PlaceholderProps) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="bg-primary/10 p-6 rounded-full mb-4">
                <Construction size={48} className="text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{title} under construction</h2>
            <p className="text-gray-500 max-w-md">
                This feature is currently being built. Check back soon for updates.
            </p>
        </div>
    );
};
