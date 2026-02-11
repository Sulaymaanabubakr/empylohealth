// TypeScript conversion in progress
import { functions } from '../firebaseConfig';
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
            return result.data;
        } catch (error) {
            console.error("Error starting huddle:", error);
            throw error;
        }
    },

    joinHuddle: async (huddleId) => {
        try {
            const joinFn = httpsCallable(functions, 'joinHuddle');
            const result = await joinFn({ huddleId });
            return result.data;
        } catch (error) {
            console.error("Error joining huddle:", error);
            throw error;
        }
    },

    endHuddle: async (huddleId) => {
        try {
            const endFn = httpsCallable(functions, 'endHuddle');
            const result = await endFn({ huddleId });
            return result.data;
        } catch (error) {
            console.error("Error ending huddle:", error);
            throw error;
        }
    },

    /**
     * Trigger another ring while call is still unanswered
     * @param {string} huddleId
     */
    ringHuddleParticipants: async (huddleId) => {
        try {
            const ringFn = httpsCallable(functions, 'ringHuddleParticipants');
            const result = await ringFn({ huddleId });
            return result.data || { success: true };
        } catch (error) {
            console.error("Error ringing participants:", error);
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
