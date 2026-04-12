import { supabase } from '../supabase/supabaseClient';

const mapProfile = (row) => {
    if (!row) return null;
    return {
        id: row.id,
        uid: row.id,
        email: row.email || '',
        name: row.name || '',
        displayName: row.name || '',
        photoURL: row.photo_url || '',
        role: row.role || 'personal',
        dob: row.dob || '',
        gender: row.gender || '',
        location: row.location || '',
        onboardingCompleted: Boolean(row.onboarding_completed),
        timezone: row.timezone || 'UTC',
        wellbeingScore: typeof row.wellbeing_score === 'number' ? row.wellbeing_score : null,
        wellbeingLabel: row.wellbeing_label || '',
        streak: Number(row.streak || 0),
        stats: row.stats || {},
        blockedUserIds: Array.isArray(row.blocked_user_ids) ? row.blocked_user_ids : [],
        createdAt: row.created_at || null,
        updatedAt: row.updated_at || null,
    };
};

export const profileRepository = {
    async getProfile(uid) {
        if (!uid) return null;
        const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
        if (error) throw error;
        return mapProfile(data);
    },

    subscribeToProfile(uid, callback, onError) {
        if (!uid) return () => {};
        let active = true;

        const load = async () => {
            try {
                const profile = await this.getProfile(uid);
                if (active) callback(profile);
            } catch (error) {
                if (active) onError?.(error);
            }
        };

        load();

        const channel = supabase
            .channel(`profile:${uid}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${uid}` }, load)
            .subscribe();

        return () => {
            active = false;
            supabase.removeChannel(channel).catch(() => {});
        };
    },

    async ensureProfile(uid, seed = {}) {
        if (!uid) throw new Error('uid is required');
        const payload = { ...seed };
        if (Object.prototype.hasOwnProperty.call(payload, 'photoURL')) {
            payload.photo_url = payload.photoURL;
            delete payload.photoURL;
        }
        if (Object.prototype.hasOwnProperty.call(payload, 'onboardingCompleted')) {
            payload.onboarding_completed = payload.onboardingCompleted;
            delete payload.onboardingCompleted;
        }
        if (Object.prototype.hasOwnProperty.call(payload, 'updatedAt')) {
            payload.updated_at = payload.updatedAt;
            delete payload.updatedAt;
        }
        const { error } = await supabase.from('profiles').upsert({
            id: uid,
            email: payload.email || '',
            name: payload.name || '',
            role: payload.role || 'personal',
            onboarding_completed: payload.onboarding_completed ?? false,
            ...payload,
        });
        if (error) throw error;
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
        if (Object.prototype.hasOwnProperty.call(payload, 'updatedAt')) {
            payload.updated_at = payload.updatedAt;
            delete payload.updatedAt;
        }
        const { error } = await supabase.from('profiles').update(payload).eq('id', uid);
        if (error) throw error;
    },
};
