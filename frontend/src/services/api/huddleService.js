// TypeScript conversion in progress
import { liveStateRepository } from '../repositories/LiveStateRepository';
import { authApiClient } from '../auth/authApiClient';
import { supabase } from '../supabase/supabaseClient';
import { subscriptionGuardService } from '../subscription/subscriptionGuardService';

const mapHuddle = (row) => {
    if (!row) return null;
    return {
        ...row,
        chatId: row.chat_id,
        circleId: row.circle_id,
        roomUrl: row.room_url,
        roomName: row.room_name,
        startedBy: row.started_by,
        acceptedBy: row.accepted_by,
        isGroup: row.is_group,
        isActive: row.is_active,
        invitedUserIds: row.invited_user_ids || [],
        acceptedUserIds: row.accepted_user_ids || [],
        declinedUserIds: row.declined_user_ids || [],
        activeUserIds: row.active_user_ids || [],
        ringStartedAt: row.ring_started_at,
        acceptedAt: row.accepted_at,
        ongoingAt: row.ongoing_at,
        endedAt: row.ended_at,
        endedBy: row.ended_by,
        endedReason: row.ended_reason,
        lastRingSentAt: row.last_ring_sent_at,
        ringCount: row.ring_count || 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        participants: row.accepted_user_ids || [],
    };
};

const mapMissedHuddle = (row, context = {}) => {
    if (!row) return null;
    const callerProfile = context?.callerById?.[row.caller_id] || null;
    const chat = context?.chatById?.[row.chat_id] || null;
    return {
        id: row.id,
        huddleId: row.huddle_id,
        chatId: row.chat_id,
        callerId: row.caller_id,
        receiverId: row.receiver_id,
        status: row.status,
        createdAt: row.created_at,
        handledAt: row.handled_at || null,
        callerName: callerProfile?.name || 'Someone',
        callerAvatar: callerProfile?.photo_url || '',
        chatName: chat?.name || 'Huddle',
        chatAvatar: chat?.avatar || '',
    };
};

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
let activeSessionHuddleChannel = null;

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

const clearActiveSessionHuddleChannel = () => {
    if (activeSessionHuddleChannel) {
        supabase.removeChannel(activeSessionHuddleChannel);
        activeSessionHuddleChannel = null;
    }
};

const syncActiveSessionHuddle = (huddleId) => {
    clearActiveSessionHuddleChannel();
    if (!huddleId) return;

    const load = async () => {
        if (!activeLocalSession || activeLocalSession.huddleId !== huddleId) return;
        const { data } = await supabase
            .from('huddles')
            .select('*')
            .eq('id', huddleId)
            .maybeSingle();
        if (!data || !activeLocalSession || activeLocalSession.huddleId !== huddleId) return;

        const nextStatus = String(data.status || '');
        const previousStatus = String(activeLocalSession.firebaseStatus || '');
        const didBecomeOngoing = nextStatus === 'ongoing' && previousStatus !== 'ongoing';

        activeLocalSession = {
            ...activeLocalSession,
            firebaseStatus: nextStatus || null,
            isActive: data.is_active !== false,
            activeUserCount: Array.isArray(data.active_user_ids) ? data.active_user_ids.length : 0,
            acceptedUserCount: Array.isArray(data.accepted_user_ids) ? data.accepted_user_ids.length : 0,
            ...(didBecomeOngoing
                ? {
                    phase: 'ongoing',
                    startedAtMs: Date.now(),
                    elapsedSeconds: 0,
                }
                : {})
        };
        emitSessionChange();
    };

    load().catch(() => {});

    activeSessionHuddleChannel = supabase
        .channel(`active-huddle-session-${huddleId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'huddles', filter: `id=eq.${huddleId}` }, load)
        .subscribe();
};

export const huddleService = {
    /**
     * Start a new Call/Huddle
     * @param {string} chatId 
     * @param {boolean} isGroup 
     */
    startHuddle: async (chatId, isGroup = false) => {
        try {
            const result = await authApiClient.invokeWithAuth('start-huddle', { chatId, isGroup });
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
            const result = await authApiClient.invokeWithAuth('join-huddle', { huddleId });
            await liveStateRepository.upsertHuddleLiveState(huddleId, {
                state: 'in-call'
            }).catch(() => {});
            return result;
        } catch (error) {
            console.error("Error joining huddle:", error);
            throw error;
        }
    },

    markHuddleAccepted: async (huddleId) => {
        try {
            const result = await authApiClient.invokeWithAuth('mark-huddle-accepted', { huddleId });
            return result || { success: true };
        } catch (error) {
            console.error("Error accepting huddle:", error);
            throw error;
        }
    },

    declineHuddle: async (huddleId) => {
        try {
            const result = await authApiClient.invokeWithAuth('decline-huddle', { huddleId });
            await liveStateRepository.upsertHuddleLiveState(huddleId, { state: 'idle' }).catch(() => {});
            return result || { success: true };
        } catch (error) {
            console.error("Error declining huddle:", error);
            throw error;
        }
    },

    endHuddle: async (huddleId) => {
        try {
            const result = await authApiClient.invokeWithAuth('end-huddle', { huddleId });
            subscriptionGuardService.invalidateCache();
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
            const result = await authApiClient.invokeWithAuth('end-huddle', { huddleId, reason });
            subscriptionGuardService.invalidateCache();
            await liveStateRepository.upsertHuddleLiveState(huddleId, { state: 'ended' }).catch(() => {});
            return result;
        } catch (error) {
            console.error("Error ending huddle:", error);
            throw error;
        }
    },

    updateHuddleConnection: async (huddleId, action) => {
        try {
            const result = await authApiClient.invokeWithAuth('update-huddle-connection', { huddleId, action });
            if (action === 'daily_joined' || action === 'daily_left') {
                subscriptionGuardService.invalidateCache();
            }
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
            const result = await authApiClient.invokeWithAuth('ring-huddle-participants', { huddleId });
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
            if (action === 'join') {
                await authApiClient.invokeWithAuth('join-huddle', { huddleId });
            } else if (action === 'leave') {
                await authApiClient.invokeWithAuth('end-huddle', { huddleId, reason: 'leave' });
            } else if (action === 'daily_joined' || action === 'daily_left') {
                await authApiClient.invokeWithAuth('update-huddle-connection', { huddleId, action });
            } else {
                await authApiClient.invokeWithAuth('update-huddle-state', { huddleId, action });
            }
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

    subscribeToHuddle: (huddleId, callback) => {
        if (!huddleId) return () => {};

        const load = async () => {
            const { data } = await supabase
                .from('huddles')
                .select('*')
                .eq('id', huddleId)
                .maybeSingle();
            callback(mapHuddle(data));
        };

        load();

        const channel = supabase
            .channel(`huddle-${huddleId}-${Math.random().toString(36).slice(2, 8)}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'huddles', filter: `id=eq.${huddleId}` }, load)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    },

    getHuddle: async (huddleId) => {
        if (!huddleId) return null;
        const { data, error } = await supabase
            .from('huddles')
            .select('*')
            .eq('id', huddleId)
            .maybeSingle();
        if (error) throw error;
        return mapHuddle(data);
    },

    getMissedHuddles: async (uid) => {
        if (!uid) return [];
        const { data, error } = await supabase
            .from('missed_huddles')
            .select('*')
            .eq('receiver_id', uid)
            .eq('status', 'missed')
            .order('created_at', { ascending: false });
        if (error) throw error;

        const rows = data || [];
        const callerIds = Array.from(new Set(rows.map((row) => row.caller_id).filter(Boolean)));
        const chatIds = Array.from(new Set(rows.map((row) => row.chat_id).filter(Boolean)));
        const [{ data: callerProfiles }, { data: chats }] = await Promise.all([
            callerIds.length
                ? supabase.from('profiles').select('id, name, photo_url').in('id', callerIds)
                : Promise.resolve({ data: [] }),
            chatIds.length
                ? supabase.from('chats').select('id, name, avatar').in('id', chatIds)
                : Promise.resolve({ data: [] }),
        ]);

        const callerById = Object.fromEntries((callerProfiles || []).map((row) => [row.id, row]));
        const chatById = Object.fromEntries((chats || []).map((row) => [row.id, row]));
        return rows.map((row) => mapMissedHuddle(row, { callerById, chatById })).filter(Boolean);
    },

    subscribeToMissedHuddles: (uid, callback) => {
        if (!uid) return () => {};

        const load = async () => {
            const items = await huddleService.getMissedHuddles(uid).catch(() => []);
            callback(items);
        };

        load();

        const channel = supabase
            .channel(`missed-huddles-${uid}-${Math.random().toString(36).slice(2, 8)}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'missed_huddles', filter: `receiver_id=eq.${uid}` }, load)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    },

    subscribeToMissedHuddleStatus: (huddleId, uid, callback) => {
        if (!huddleId || !uid) return () => {};

        const load = async () => {
            const { data } = await supabase
                .from('missed_huddles')
                .select('*')
                .eq('huddle_id', huddleId)
                .eq('receiver_id', uid)
                .maybeSingle();
            callback(data ? mapMissedHuddle(data) : null);
        };

        load();

        const channel = supabase
            .channel(`missed-huddle-${huddleId}-${uid}-${Math.random().toString(36).slice(2, 8)}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'missed_huddles', filter: `huddle_id=eq.${huddleId}` }, load)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    },

    setActiveLocalSession: (session) => {
        activeLocalSession = session || null;
        if (!session) {
            clearActiveSessionHuddleChannel();
            activeCallControlState = { isMuted: false, isSpeakerOn: true };
            activeCallActions = { toggleMute: null, toggleSpeaker: null, hangup: null };
        } else {
            syncActiveSessionHuddle(session.huddleId);
        }
        emitSessionChange();
    },

    getActiveLocalSession: () => activeLocalSession,

    updateActiveLocalSession: (patch = {}) => {
        if (!activeLocalSession) return;
        const previousHuddleId = activeLocalSession?.huddleId;
        activeLocalSession = {
            ...activeLocalSession,
            ...patch
        };
        if (patch?.huddleId && patch.huddleId !== previousHuddleId) {
            syncActiveSessionHuddle(patch.huddleId);
        }
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

    toggleActiveSessionMute: async () => {
        if (!activeLocalSession?.callObject) return false;
        try {
            const nextMuted = !activeCallControlState.isMuted;
            activeLocalSession.callObject.setLocalAudio(!nextMuted);
            activeCallControlState = {
                ...activeCallControlState,
                isMuted: nextMuted
            };
            emitSessionChange();
            if (activeLocalSession?.huddleId) {
                huddleService.updateHuddleState(activeLocalSession.huddleId, nextMuted ? 'mute' : 'unmute').catch(() => {});
            }
            return true;
        } catch {
            return false;
        }
    },

    toggleActiveSessionSpeaker: async () => {
        if (!activeLocalSession?.callObject) return false;
        try {
            const nextSpeakerOn = !activeCallControlState.isSpeakerOn;
            activeLocalSession.callObject.setNativeInCallAudioMode(nextSpeakerOn ? 'video' : 'voice');
            activeCallControlState = {
                ...activeCallControlState,
                isSpeakerOn: nextSpeakerOn
            };
            emitSessionChange();
            return true;
        } catch {
            return false;
        }
    },

    hangupActiveSession: async () => {
        if (!activeLocalSession?.callObject) return false;
        const session = activeLocalSession;
        try {
            const callObject = session.callObject;
            try {
                callObject.stopRemoteParticipantsAudioLevelObserver?.();
            } catch {
                // ignore
            }
            await callObject.leave().catch(() => {});
            await callObject.destroy().catch(() => {});

            const huddleId = session?.huddleId;
            if (huddleId) {
                huddleService.updateHuddleConnection(huddleId, 'daily_left').catch(() => {});
                huddleService.endHuddleWithReason(huddleId, 'hangup').catch(() => {});
            }

            huddleService.clearActiveLocalSession();
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
        clearActiveSessionHuddleChannel();
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
