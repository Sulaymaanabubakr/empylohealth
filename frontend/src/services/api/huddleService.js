// TypeScript conversion in progress
import { liveStateRepository } from '../repositories/LiveStateRepository';
import { callableClient } from './callableClient';

let activeLocalSession = null;
const sessionListeners = new Set();
let activeCallControlState = {
    isMuted: false,
    isSpeakerOn: true
};
let activeCallActions = {
    toggleMute: null,
    toggleSpeaker: null,
    hangup: null
};

const buildSessionPayload = () => {
    if (!activeLocalSession) return null;
    return {
        ...activeLocalSession,
        controlState: { ...activeCallControlState },
        controlsEnabled: {
            mute: typeof activeCallActions.toggleMute === 'function',
            speaker: typeof activeCallActions.toggleSpeaker === 'function',
            hangup: typeof activeCallActions.hangup === 'function'
        }
    };
};

const emitSessionChange = () => {
    const payload = buildSessionPayload();
    sessionListeners.forEach((listener) => {
        try {
            listener(payload);
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
            const result = await callableClient.invokeWithAuth('startHuddle', { chatId, isGroup });
            if (result?.huddleId) {
                await liveStateRepository.upsertHuddleLiveState(result.huddleId, {
                    state: 'ringing',
                    chatId,
                    hostUid: result.startedBy || null
                }).catch(() => {});
            }
            return result;
        } catch (error) {
            console.error("Error starting huddle:", error);
            throw error;
        }
    },

    joinHuddle: async (huddleId) => {
        try {
            const result = await callableClient.invokeWithAuth('joinHuddle', { huddleId });
            await liveStateRepository.upsertHuddleLiveState(huddleId, {
                state: 'in-call'
            }).catch(() => {});
            return result;
        } catch (error) {
            console.error("Error joining huddle:", error);
            throw error;
        }
    },

    declineHuddle: async (huddleId) => {
        try {
            const result = await callableClient.invokeWithAuth('declineHuddle', { huddleId });
            await liveStateRepository.upsertHuddleLiveState(huddleId, { state: 'idle' }).catch(() => {});
            return result || { success: true };
        } catch (error) {
            console.error("Error declining huddle:", error);
            throw error;
        }
    },

    endHuddle: async (huddleId) => {
        try {
            const result = await callableClient.invokeWithAuth('endHuddle', { huddleId });
            await liveStateRepository.upsertHuddleLiveState(huddleId, {
                state: 'ended'
            }).catch(() => {});
            return result;
        } catch (error) {
            console.error("Error ending huddle:", error);
            throw error;
        }
    },

    endHuddleWithReason: async (huddleId, reason) => {
        try {
            const result = await callableClient.invokeWithAuth('endHuddle', { huddleId, reason });
            await liveStateRepository.upsertHuddleLiveState(huddleId, { state: 'ended' }).catch(() => {});
            return result;
        } catch (error) {
            console.error("Error ending huddle:", error);
            throw error;
        }
    },

    updateHuddleConnection: async (huddleId, action) => {
        try {
            const result = await callableClient.invokeWithAuth('updateHuddleConnection', { huddleId, action }); // action: 'daily_joined' | 'daily_left'
            return result || { success: true };
        } catch (error) {
            console.error("Error updating huddle connection:", error);
            throw error;
        }
    },

    /**
     * Trigger another ring while call is still unanswered
     * @param {string} huddleId
     */
    ringHuddleParticipants: async (huddleId) => {
        try {
            const result = await callableClient.invokeWithAuth('ringHuddleParticipants', { huddleId });
            return result || { success: true };
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
            await callableClient.invokeWithAuth('updateHuddleState', { huddleId, action });
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
        if (!session) {
            activeCallControlState = { isMuted: false, isSpeakerOn: true };
            activeCallActions = { toggleMute: null, toggleSpeaker: null, hangup: null };
        }
        emitSessionChange();
    },

    getActiveLocalSession: () => activeLocalSession,

    updateActiveLocalSession: (patch = {}) => {
        if (!activeLocalSession) return;
        activeLocalSession = {
            ...activeLocalSession,
            ...patch
        };
        emitSessionChange();
    },

    setActiveCallControlState: (patch = {}) => {
        activeCallControlState = {
            ...activeCallControlState,
            ...patch
        };
        emitSessionChange();
    },

    setActiveCallActions: (actions = {}) => {
        activeCallActions = {
            ...activeCallActions,
            ...actions
        };
        emitSessionChange();
    },

    clearActiveCallActions: () => {
        activeCallActions = {
            toggleMute: null,
            toggleSpeaker: null,
            hangup: null
        };
        emitSessionChange();
    },

    invokeActiveCallAction: async (actionName) => {
        const handler = activeCallActions?.[actionName];
        if (typeof handler !== 'function') return false;
        try {
            await handler();
            return true;
        } catch {
            return false;
        }
    },

    clearActiveLocalSession: () => {
        if (activeLocalSession?.huddleId) {
            liveStateRepository.upsertHuddleLiveState(activeLocalSession.huddleId, {
                state: 'idle'
            }).catch(() => {});
        }
        activeLocalSession = null;
        activeCallControlState = { isMuted: false, isSpeakerOn: true };
        activeCallActions = { toggleMute: null, toggleSpeaker: null, hangup: null };
        emitSessionChange();
    },

    subscribeToActiveLocalSession: (listener) => {
        if (typeof listener !== 'function') return () => {};
        sessionListeners.add(listener);
        listener(buildSessionPayload());
        return () => {
            sessionListeners.delete(listener);
        };
    }
};
