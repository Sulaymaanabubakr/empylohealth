// TypeScript conversion in progress
import { auth, functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import { onAuthStateChanged } from 'firebase/auth';
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

const waitForAuthUser = async (timeoutMs = 8000) => {
    if (auth.currentUser) return auth.currentUser;
    await new Promise((resolve) => {
        let done = false;
        const timer = setTimeout(() => {
            if (done) return;
            done = true;
            unsub();
            resolve();
        }, timeoutMs);

        const unsub = onAuthStateChanged(auth, () => {
            if (done) return;
            done = true;
            clearTimeout(timer);
            unsub();
            resolve();
        });
    });
    return auth.currentUser || null;
};

const ensureAuthReady = async () => {
    const user = await waitForAuthUser();
    if (!user) {
        throw new Error('Authentication is not ready. Please wait a moment and try again.');
    }
    // Ensure token is available before callable invocation.
    await user.getIdToken().catch(() => {});
    return user;
};

const isUnauthenticatedError = (error) => {
    const code = String(error?.code || '');
    const message = String(error?.message || '');
    return code.includes('unauthenticated') || message.toLowerCase().includes('unauthenticated');
};

const callWithAuthRetry = async (callable, payload) => {
    await ensureAuthReady();
    try {
        return await callable(payload);
    } catch (error) {
        if (!isUnauthenticatedError(error)) throw error;
        // Token might be stale/not attached yet: refresh once and retry.
        await auth.currentUser?.getIdToken(true).catch(() => {});
        await ensureAuthReady();
        return callable(payload);
    }
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
            const result = await callWithAuthRetry(startFn, { chatId, isGroup });
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
            const result = await callWithAuthRetry(joinFn, { huddleId });
            await liveStateRepository.upsertHuddleLiveState(huddleId, {
                state: 'in-call'
            }).catch(() => {});
            return result.data;
        } catch (error) {
            console.error("Error joining huddle:", error);
            throw error;
        }
    },

    declineHuddle: async (huddleId) => {
        try {
            const fn = httpsCallable(functions, 'declineHuddle');
            const result = await callWithAuthRetry(fn, { huddleId });
            await liveStateRepository.upsertHuddleLiveState(huddleId, { state: 'idle' }).catch(() => {});
            return result.data || { success: true };
        } catch (error) {
            console.error("Error declining huddle:", error);
            throw error;
        }
    },

    endHuddle: async (huddleId) => {
        try {
            const endFn = httpsCallable(functions, 'endHuddle');
            const result = await callWithAuthRetry(endFn, { huddleId });
            await liveStateRepository.upsertHuddleLiveState(huddleId, {
                state: 'ended'
            }).catch(() => {});
            return result.data;
        } catch (error) {
            console.error("Error ending huddle:", error);
            throw error;
        }
    },

    endHuddleWithReason: async (huddleId, reason) => {
        try {
            const endFn = httpsCallable(functions, 'endHuddle');
            const result = await callWithAuthRetry(endFn, { huddleId, reason });
            await liveStateRepository.upsertHuddleLiveState(huddleId, { state: 'ended' }).catch(() => {});
            return result.data;
        } catch (error) {
            console.error("Error ending huddle:", error);
            throw error;
        }
    },

    updateHuddleConnection: async (huddleId, action) => {
        try {
            const fn = httpsCallable(functions, 'updateHuddleConnection');
            const result = await callWithAuthRetry(fn, { huddleId, action }); // action: 'daily_joined' | 'daily_left'
            return result.data || { success: true };
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
            const ringFn = httpsCallable(functions, 'ringHuddleParticipants');
            const result = await callWithAuthRetry(ringFn, { huddleId });
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
            await callWithAuthRetry(updateFn, { huddleId, action });
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
