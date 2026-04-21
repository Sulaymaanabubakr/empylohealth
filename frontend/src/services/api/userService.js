import { profileRepository } from '../repositories/ProfileRepository';
import { callableClient } from './callableClient';
import { supabase } from '../supabase/supabaseClient';

export const userService = {
    getUserDocument: async (uid) => {
        if (!uid) return null;
        const { data: authData } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
        const currentUid = authData?.user?.id || null;

        if (currentUid && currentUid === uid) {
            return profileRepository.getProfile(uid);
        }

        return callableClient.invokeWithAuth('getPublicProfile', { uid });
    },

    updateUserDocument: async (uid, data) => {
        await profileRepository.updateProfile(uid, data);
        return { success: true };
    },

    blockUser: async (targetUid) => {
        return callableClient.invokeWithAuth('blockUser', { targetUid });
    },

    unblockUser: async (targetUid) => {
        return callableClient.invokeWithAuth('unblockUser', { targetUid });
    }
};
