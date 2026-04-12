import { supabase } from '../supabase/supabaseClient';

const channelName = (prefix, id) => `${prefix}-${id}-${Math.random().toString(36).slice(2, 8)}`;

const subscribeToRows = async ({ table, filter, mapRows, callback, orderBy = 'updated_at' }) => {
    const load = async () => {
        let query = supabase.from(table).select('*');
        if (filter?.column && filter?.value) {
            query = query.eq(filter.column, filter.value);
        }
        if (orderBy) {
            query = query.order(orderBy, { ascending: true });
        }
        const { data } = await query;
        callback(mapRows(data || []));
    };

    await load();

    const channel = supabase
        .channel(channelName(table, filter?.value || 'all'))
        .on('postgres_changes', { event: '*', schema: 'public', table, filter: filter?.column ? `${filter.column}=eq.${filter.value}` : undefined }, load)
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
};

export const liveStateRepository = {
    async setTyping(chatId, uid, isTyping) {
        if (!chatId || !uid) return;
        const payload = {
            chat_id: chatId,
            user_id: uid,
            state: isTyping ? 'typing' : 'idle',
            updated_at: new Date().toISOString(),
        };
        const { error } = await supabase.from('chat_typing_states').upsert(payload);
        if (error && typeof __DEV__ !== 'undefined' && __DEV__) {
            console.warn('[Supabase] setTyping failed', error.message || error);
        }
    },

    subscribeTyping(chatId, callback) {
        if (!chatId) return () => {};
        let disposed = false;
        let cleanup = () => {};

        subscribeToRows({
            table: 'chat_typing_states',
            filter: { column: 'chat_id', value: chatId },
            mapRows: (rows) =>
                rows.reduce((acc, row) => {
                    if (row.state === 'typing') {
                        acc[row.user_id] = {
                            state: row.state,
                            updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
                        };
                    }
                    return acc;
                }, {}),
            callback: (state) => {
                if (!disposed) callback(state);
            },
        }).then((fn) => {
            cleanup = fn;
        });

        return () => {
            disposed = true;
            cleanup();
        };
    },

    async setChatPresence(chatId, uid, state = 'active') {
        if (!chatId || !uid) return;
        const payload = {
            chat_id: chatId,
            user_id: uid,
            state,
            last_seen_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        const { error } = await supabase.from('chat_presence_states').upsert(payload);
        if (error && typeof __DEV__ !== 'undefined' && __DEV__) {
            console.warn('[Supabase] setChatPresence failed', error.message || error);
        }
    },

    subscribeChatPresence(chatId, callback) {
        if (!chatId) return () => {};
        let disposed = false;
        let cleanup = () => {};

        subscribeToRows({
            table: 'chat_presence_states',
            filter: { column: 'chat_id', value: chatId },
            mapRows: (rows) =>
                rows.reduce((acc, row) => {
                    acc[row.user_id] = {
                        state: row.state,
                        lastSeenAt: row.last_seen_at ? new Date(row.last_seen_at).getTime() : Date.now(),
                        updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
                    };
                    return acc;
                }, {}),
            callback: (state) => {
                if (!disposed) callback(state);
            },
        }).then((fn) => {
            cleanup = fn;
        });

        return () => {
            disposed = true;
            cleanup();
        };
    },

    async upsertHuddleLiveState(roomId, patch) {
        if (!roomId) return;

        let chatId = patch?.chatId || null;
        let hostUid = patch?.hostUid || null;
        if (!chatId) {
            const { data } = await supabase
                .from('huddles')
                .select('chat_id, started_by')
                .eq('id', roomId)
                .maybeSingle();
            chatId = data?.chat_id || null;
            hostUid = hostUid || data?.started_by || null;
        }

        if (!chatId) return;

        const payload = {
            huddle_id: roomId,
            chat_id: chatId,
            host_uid: hostUid,
            state: patch?.state || 'idle',
            last_action: patch?.lastAction || null,
            updated_at: new Date().toISOString(),
        };
        const { error } = await supabase.from('huddle_live_states').upsert(payload);
        if (error && typeof __DEV__ !== 'undefined' && __DEV__) {
            console.warn('[Supabase] upsertHuddleLiveState failed', error.message || error);
        }
    },

    subscribeHuddleLiveState(roomId, callback) {
        if (!roomId) return () => {};
        const load = async () => {
            const { data } = await supabase.from('huddle_live_states').select('*').eq('huddle_id', roomId).maybeSingle();
            callback(data || null);
        };
        load();
        const channel = supabase
            .channel(channelName('huddle-live', roomId))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'huddle_live_states', filter: `huddle_id=eq.${roomId}` }, load)
            .subscribe();
        return () => {
            supabase.removeChannel(channel);
        };
    },
};
