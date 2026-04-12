import { supabase } from '../supabase/supabaseClient';

const mapProfile = (row) => {
    if (!row) return null;
    return {
        id: row.id,
        uid: row.id,
        email: row.email || '',
        name: row.name || '',
        photoURL: row.photo_url || '',
        role: row.role || 'personal',
        dob: row.dob || '',
        gender: row.gender || '',
        location: row.location || '',
        onboardingCompleted: Boolean(row.onboarding_completed),
        timezone: row.timezone || 'UTC',
        createdAt: row.created_at || null,
        updatedAt: row.updated_at || null,
    };
};

export const authProfileService = {
    async getProfile(uid) {
        if (!uid) return null;
        const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
        if (error) throw error;
        return mapProfile(data);
    },

    subscribeToProfile(uid, callback, onError) {
        if (!uid) return () => {};

        let active = true;
        const fetchCurrent = async () => {
            try {
                const profile = await authProfileService.getProfile(uid);
                if (active) callback(profile);
            } catch (error) {
                if (active) onError?.(error);
            }
        };

        fetchCurrent();

        const channel = supabase
            .channel(`profile:${uid}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'profiles',
                filter: `id=eq.${uid}`,
            }, fetchCurrent)
            .subscribe();

        return () => {
            active = false;
            supabase.removeChannel(channel).catch(() => {});
        };
    },

    async updateProfile(uid, updates) {
        if (!uid) throw new Error('uid is required');
        const payload = { ...updates };
        if (Object.prototype.hasOwnProperty.call(payload, 'photoURL')) {
            payload.photo_url = payload.photoURL;
            delete payload.photoURL;
        }
        if (Object.prototype.hasOwnProperty.call(payload, 'onboardingCompleted')) {
            payload.onboarding_completed = payload.onboardingCompleted;
            delete payload.onboardingCompleted;
        }
        const { error } = await supabase.from('profiles').update(payload).eq('id', uid);
        if (error) throw error;
    },
};
