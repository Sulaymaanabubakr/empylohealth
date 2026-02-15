import { profileRepository } from '../repositories/ProfileRepository';

export const userService = {
    getUserDocument: async (uid) => {
        return profileRepository.getProfile(uid);
    },

    updateUserDocument: async (uid, data) => {
        await profileRepository.updateProfile(uid, data);
        return { success: true };
    }
};
