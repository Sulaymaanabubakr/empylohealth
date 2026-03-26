import { useMemo, useState } from "react";
import { User, Save, Loader2, Edit2, ShieldCheck, Mail, UploadCloud } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { sendPasswordResetEmail, updateProfile } from "firebase/auth";
import { auth } from "../lib/firebase";
import clsx from "clsx";
import { useNotification } from "../contexts/NotificationContext";
import { uploadCloudinaryAsset } from "../lib/media";

export const Settings = () => {
    const { user, role, permissions } = useAuth();
    const { showNotification } = useNotification();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const [photoLoading, setPhotoLoading] = useState(false);
    const [fullName, setFullName] = useState(user?.displayName || "");
    const permissionPreview = useMemo(() => permissions.includes('*') ? ['Full access'] : permissions.slice(0, 6), [permissions]);

    const handleSave = async () => {
        if (!user) return;
        setLoading(true);

        try {
            await updateProfile(user, {
                displayName: fullName,
            });
            showNotification('success', "Profile updated successfully!");
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating profile:", error);
            showNotification('error', "Failed to update profile.");
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordReset = async () => {
        if (!user?.email) return;
        setResetLoading(true);
        try {
            await sendPasswordResetEmail(auth, user.email);
            showNotification('success', "Password reset email sent.");
        } catch (error) {
            console.error("Error sending reset email:", error);
            showNotification('error', "Failed to send reset email.");
        } finally {
            setResetLoading(false);
        }
    };

    const handlePhotoUpload = async (file?: File | null) => {
        if (!user || !file) return;
        setPhotoLoading(true);
        try {
            const result = await uploadCloudinaryAsset(file, 'image', 'admin-profiles');
            await updateProfile(user, { photoURL: result.secureUrl });
            showNotification('success', 'Profile photo updated.');
        } catch (error) {
            console.error('Error uploading profile photo:', error);
            showNotification('error', 'Failed to update profile photo.');
        } finally {
            setPhotoLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-display text-gray-900 dark:text-gray-100">Settings</h2>
                <p className="text-gray-500 text-sm mt-1 dark:text-gray-400">Manage your account, access, and preferences.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-surface rounded-2xl border border-border shadow-sm overflow-hidden dark:bg-dark dark:border-gray-800">
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
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-full bg-gray-100 border-4 border-white shadow-sm flex items-center justify-center text-2xl font-bold text-gray-400 dark:bg-gray-800 dark:border-gray-700">
                                {user?.photoURL ? (
                                    <img src={user.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'A'
                                )}
                            </div>
                            <div>
                                <label className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer">
                                    <UploadCloud size={16} />
                                    {photoLoading ? 'Uploading...' : 'Change Photo'}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            void handlePhotoUpload(file);
                                            e.currentTarget.value = '';
                                        }}
                                    />
                                </label>
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
                        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 dark:bg-gray-800/50 border-t border-border dark:border-gray-800">
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setFullName(user?.displayName || "");
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

                <div className="bg-surface rounded-2xl border border-border shadow-sm p-6 space-y-6 dark:bg-dark dark:border-gray-800">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 dark:text-gray-100">
                            <ShieldCheck size={18} className="text-primary" /> Account Snapshot
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">Quick access and security checks.</p>
                    </div>
                    <div className="space-y-3">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-300">Access</span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{role === 'super_admin' ? 'Super Admin' : role.replace('_', ' ')}</span>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-300">Primary Email</span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{user?.email || '—'}</span>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3">
                            <span className="text-sm text-gray-600 dark:text-gray-300">Permissions</span>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {permissionPreview.map((permission) => (
                                    <span key={permission} className="inline-flex px-2.5 py-1 rounded-full bg-white text-xs font-medium text-gray-700 border border-gray-200">
                                        {permission}
                                    </span>
                                ))}
                                {!permissions.includes('*') && permissions.length > permissionPreview.length && (
                                    <span className="inline-flex px-2.5 py-1 rounded-full bg-white text-xs font-medium text-gray-500 border border-gray-200">
                                        +{permissions.length - permissionPreview.length} more
                                    </span>
                                )}
                            </div>
                        </div>

                    </div>
                    <div className="border-t border-border dark:border-gray-800 pt-4">
                        <button
                            onClick={handlePasswordReset}
                            disabled={resetLoading || !user?.email}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                            <Mail size={16} />
                            {resetLoading ? 'Sending reset email...' : 'Send Password Reset Email'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-surface rounded-2xl border border-border shadow-sm p-6 dark:bg-dark dark:border-gray-800">
                    <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100 font-semibold">
                        <ShieldCheck size={18} className="text-primary" />
                        Security Checklist
                    </div>
                    <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">Keep your admin access secure.</p>
                    <div className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">Use a unique password and rotate regularly.</div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">Avoid sharing admin credentials outside the team.</div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">Review employee access monthly.</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
