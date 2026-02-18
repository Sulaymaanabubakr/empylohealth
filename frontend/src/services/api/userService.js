import { profileRepository } from '../repositories/ProfileRepository';
import { callableClient } from './callableClient';

export const userService = {
    getUserDocument: async (uid) => {
        return profileRepository.getProfile(uid);
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
