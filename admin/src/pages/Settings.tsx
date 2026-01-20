import { useState } from "react";
import { User, Save, Loader2, Edit2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { updateProfile } from "firebase/auth";
import clsx from "clsx";

export const Settings = () => {
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fullName, setFullName] = useState(user?.displayName || "");
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleSave = async () => {
        if (!user) return;
        setLoading(true);
        setMessage(null);

        try {
            await updateProfile(user, {
                displayName: fullName,
            });
            setMessage({ type: "success", text: "Profile updated successfully!" });
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating profile:", error);
            setMessage({ type: "error", text: "Failed to update profile." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h2>
                <p className="text-gray-500 text-sm mt-1 dark:text-gray-400">Manage your account and preferences.</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden dark:bg-dark dark:border-gray-800">
                <div className="p-6 border-b border-gray-50 dark:border-gray-800 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 dark:text-gray-100">
                        <User size={20} className="text-primary" /> Profile Information
                    </h3>
                    {!isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-2 text-sm font-medium text-primary hover:text-[#008f85] transition-colors"
                        >
                            <Edit2 size={16} />
                            Edit Profile
                        </button>
                    )}
                </div>

                <div className="p-6 space-y-6">
                    {message && (
                        <div
                            className={clsx(
                                "p-3 rounded-lg text-sm font-medium",
                                message.type === "success" ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                            )}
                        >
                            {message.text}
                        </div>
                    )}

                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-full bg-gray-100 border-4 border-white shadow-sm flex items-center justify-center text-2xl font-bold text-gray-400 dark:bg-gray-800 dark:border-gray-700">
                            {user?.photoURL ? (
                                <img src={user.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" />
                            ) : (
                                user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'A'
                            )}
                        </div>
                        <div>
                            {/* Image upload is complex, keeping a placeholder for now as per original request to focus on profile data */}
                            <button disabled className="text-sm font-medium text-gray-400 cursor-not-allowed">
                                Change Photo (Coming Soon)
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Full Name</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                disabled={!isEditing}
                                className={clsx(
                                    "w-full px-4 py-2 bg-gray-50 border rounded-lg outline-none focus:border-primary transition-all dark:bg-gray-800 dark:text-white",
                                    isEditing ? "border-gray-200 dark:border-gray-700" : "border-transparent bg-transparent pl-0 dark:bg-transparent"
                                )}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Email Address</label>
                            <input
                                type="email"
                                defaultValue={user?.email || ""}
                                disabled
                                className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg outline-none text-gray-500 cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
                            />
                        </div>
                    </div>
                </div>

                {isEditing && (
                    <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
                        <button
                            onClick={() => {
                                setIsEditing(false);
                                setFullName(user?.displayName || "");
                                setMessage(null);
                            }}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-[#008f85] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            Save Changes
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
