import { functions } from '../services/firebaseConfig';
import { httpsCallable } from 'firebase/functions';

export const huddleService = {
    /**
     * Start a new Call/Huddle
     * @param {string} chatId 
     * @param {boolean} isGroup 
     */
    startHuddle: async (chatId, isGroup = false) => {
        try {
            const startFn = httpsCallable(functions, 'startHuddle');
            const result = await startFn({ chatId, isGroup });
            return result.data; // { success: true, huddleId: '...' }
        } catch (error) {
            console.error("Error starting huddle:", error);
            throw error;
        }
    },

    /**
     * Join or Leave a Huddle
     * @param {string} huddleId 
     * @param {string} action 'join' | 'leave'
     */
    updateHuddleState: async (huddleId, action) => {
        try {
            const updateFn = httpsCallable(functions, 'updateHuddleState');
            await updateFn({ huddleId, action });
            return { success: true };
        } catch (error) {
            console.error("Error updating huddle:", error);
            throw error;
        }
    }
};
