// TypeScript conversion in progress
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import { liveStateRepository } from '../repositories/LiveStateRepository';

let activeLocalSession = null;
const sessionListeners = new Set();

const emitSessionChange = () => {
    sessionListeners.forEach((listener) => {
        try {
            listener(activeLocalSession);
        } catch {
            // ignore listener errors
        }
    });
};

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
            if (result?.data?.huddleId) {
                await liveStateRepository.upsertHuddleLiveState(result.data.huddleId, {
                    state: 'ringing',
                    chatId,
                    hostUid: result.data.startedBy || null
                }).catch(() => {});
            }
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
            await liveStateRepository.upsertHuddleLiveState(huddleId, {
                state: 'in-call'
            }).catch(() => {});
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
            await liveStateRepository.upsertHuddleLiveState(huddleId, {
                state: 'ended'
            }).catch(() => {});
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
            await liveStateRepository.upsertHuddleLiveState(huddleId, {
                state: action === 'join' ? 'in-call' : (action === 'leave' ? 'idle' : action),
                lastAction: action
            }).catch(() => {});
            return { success: true };
        } catch (error) {
            console.error("Error updating huddle:", error);
            throw error;
        }
    },

    setActiveLocalSession: (session) => {
        activeLocalSession = session || null;
        emitSessionChange();
    },

    getActiveLocalSession: () => activeLocalSession,

    clearActiveLocalSession: () => {
        if (activeLocalSession?.huddleId) {
            liveStateRepository.upsertHuddleLiveState(activeLocalSession.huddleId, {
                state: 'idle'
            }).catch(() => {});
        }
        activeLocalSession = null;
        emitSessionChange();
    },

    subscribeToActiveLocalSession: (listener) => {
        if (typeof listener !== 'function') return () => {};
        sessionListeners.add(listener);
        listener(activeLocalSession);
        return () => {
            sessionListeners.delete(listener);
        };
    }
};
