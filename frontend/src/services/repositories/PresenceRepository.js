import { AppState } from 'react-native';
import { getDeviceIdentity } from '../auth/deviceIdentity';
import { supabase } from '../supabase/supabaseClient';

const OFFLINE_STATE = { state: 'offline', lastChanged: null };
const HEARTBEAT_MS = 25000;
const channelName = (prefix, uid) => `${prefix}:${uid}:${Math.random().toString(36).slice(2, 8)}`;

const toMillis = (value) => {
    if (!value) return 0;
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
};

const mapRowsToPresence = (rows = []) => {
    if (!Array.isArray(rows) || rows.length === 0) return OFFLINE_STATE;

    const onlineRows = rows
        .filter((row) => row?.state === 'online')
        .map((row) => toMillis(row?.last_seen_at || row?.updated_at))
        .filter(Boolean);

    if (onlineRows.length > 0) {
        return {
            state: 'online',
            lastChanged: Math.max(...onlineRows),
        };
    }

    const latestAny = rows
        .map((row) => toMillis(row?.updated_at || row?.last_seen_at))
        .filter(Boolean);

    return {
        state: 'offline',
        lastChanged: latestAny.length > 0 ? Math.max(...latestAny) : null,
    };
};

const writePresence = async (uid, deviceId, state = 'online') => {
    if (!uid || !deviceId) return;
    const now = new Date().toISOString();
    const payload = {
        user_id: uid,
        device_id: deviceId,
        state,
        updated_at: now,
        last_seen_at: now,
    };
    const { error } = await supabase.from('user_presence_states').upsert(payload);
    if (error && typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Supabase] user presence write failed', error.message || error);
    }
};

const loadPresenceRows = async (uid) => {
    if (!uid) return [];
    const { data, error } = await supabase
        .from('user_presence_states')
        .select('user_id, device_id, state, last_seen_at, updated_at')
        .eq('user_id', uid);

    if (error) {
        throw error;
    }

    return data || [];
};

export const presenceRepository = {
    startPresence(uid) {
        let active = true;
        let heartbeat = null;
        let appStateSubscription = null;
        let resolvedDeviceId = null;

        const stopHeartbeat = () => {
            if (heartbeat) {
                clearInterval(heartbeat);
                heartbeat = null;
            }
        };

        const pushPresence = async (state = 'online') => {
            if (!active || !uid) return;
            if (!resolvedDeviceId) {
                const deviceIdentity = await getDeviceIdentity();
                resolvedDeviceId = deviceIdentity?.deviceId || null;
            }
            await writePresence(uid, resolvedDeviceId, state);
        };

        const startHeartbeat = () => {
            stopHeartbeat();
            heartbeat = setInterval(() => {
                pushPresence('online').catch(() => {});
            }, HEARTBEAT_MS);
        };

        pushPresence('online').catch(() => {});
        startHeartbeat();

        appStateSubscription = AppState.addEventListener('change', (nextState) => {
            if (nextState === 'active') {
                pushPresence('online').catch(() => {});
                startHeartbeat();
                return;
            }
            stopHeartbeat();
            pushPresence('offline').catch(() => {});
        });

        return async ({ writeOffline = true } = {}) => {
            active = false;
            stopHeartbeat();
            appStateSubscription?.remove?.();
            if (!writeOffline) {
                return;
            }
            if (!resolvedDeviceId) {
                const deviceIdentity = await getDeviceIdentity().catch(() => null);
                resolvedDeviceId = deviceIdentity?.deviceId || null;
            }
            await writePresence(uid, resolvedDeviceId, 'offline').catch(() => {});
        };
    },

    subscribeToPresence(uid, callback) {
        if (!uid) {
            callback?.(OFFLINE_STATE);
            return () => {};
        }

        let disposed = false;
        const emit = async () => {
            try {
                const rows = await loadPresenceRows(uid);
                if (!disposed) callback?.(mapRowsToPresence(rows));
            } catch {
                if (!disposed) callback?.(OFFLINE_STATE);
            }
        };

        emit();

        const channel = supabase
            .channel(channelName('user-presence', uid))
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'user_presence_states', filter: `user_id=eq.${uid}` },
                () => {
                    emit().catch(() => {});
                }
            )
            .subscribe();

        return () => {
            disposed = true;
            supabase.removeChannel(channel);
        };
    },

    async getPresence(uid) {
        if (!uid) return OFFLINE_STATE;
        try {
            const rows = await loadPresenceRows(uid);
            return mapRowsToPresence(rows);
        } catch {
            return OFFLINE_STATE;
        }
    },

    async markOffline(uid) {
        if (!uid) return;
        const deviceIdentity = await getDeviceIdentity().catch(() => null);
        const deviceId = deviceIdentity?.deviceId || null;
        await writePresence(uid, deviceId, 'offline').catch(() => {});
    },
};
