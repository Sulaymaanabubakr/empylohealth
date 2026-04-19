import { chatRepository } from '../repositories/ChatRepository';
import { liveStateRepository } from '../repositories/LiveStateRepository';
import { presenceRepository } from '../repositories/PresenceRepository';
import * as Notifications from 'expo-notifications';
import { supabase } from '../supabase/supabaseClient';
import { resolveWellbeingScore } from '../../utils/wellbeing';
import { isPresenceOnline } from '../../utils/presence';
import { formatTimeUK } from '../../utils/dateFormat';
import { findUnsafeUrlsInMessage, sanitizeChatMessageText } from '../../utils/chatMessageSafety';

const randomChannel = (prefix, id) => `${prefix}-${id}-${Math.random().toString(36).slice(2, 8)}`;

const refreshNotificationBadgeCount = async (uid) => {
    if (!uid) return;
    try {
        const { count } = await supabase
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', uid)
            .eq('read', false);
        await Notifications.setBadgeCountAsync(Number(count || 0)).catch(() => {});
    } catch {
        // ignore badge refresh failures
    }
};

const serializeChatTimestamp = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value.toISOString();
    if (typeof value?.toDate === 'function') return value.toDate().toISOString();
    if (typeof value?.toMillis === 'function') return new Date(value.toMillis()).toISOString();
    if (typeof value === 'number') return new Date(value).toISOString();
    return value;
};

const serializeChatForNavigation = (chat) => {
    if (!chat || typeof chat !== 'object') return chat;
    return {
        ...chat,
        updatedAt: serializeChatTimestamp(chat.updatedAt),
        createdAt: serializeChatTimestamp(chat.createdAt),
        lastMessageAt: serializeChatTimestamp(chat.lastMessageAt),
    };
};

const mapMessage = (row) => ({
    _id: row.id,
    clientMessageId: row.client_message_id || null,
    text: row.text,
    type: row.type || 'text',
    systemKind: row.system_kind || null,
    visibleTo: Array.isArray(row.visible_to) ? row.visible_to : [],
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    createdAtMs: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    readBy: Array.isArray(row.read_by) ? row.read_by : [],
    user: {
        _id: row.sender_id,
    },
    image: row.media_url || undefined,
});

const fetchMessages = async (chatId) => {
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        throw error;
    }

    return (data || []).map(mapMessage);
};

const fetchParticipantProfiles = async (chatId) => {
    const { data: participants, error: participantError } = await supabase
        .from('chat_participants')
        .select('user_id')
        .eq('chat_id', chatId)
        .is('left_at', null);
    if (participantError) throw participantError;

    const userIds = (participants || []).map((item) => item.user_id);
    if (userIds.length === 0) return [];

    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, photo_url')
        .in('id', userIds);
    if (profilesError) throw profilesError;

    return userIds.map((uid) => {
        const profile = (profiles || []).find((item) => item.id === uid);
        return {
            uid,
            name: profile?.name || 'Member',
            photoURL: profile?.photo_url || '',
            wellbeingScore: resolveWellbeingScore(profile || {}),
            wellbeingLabel: profile?.wellbeingLabel || profile?.wellbeingStatus || '',
        };
    });
};

const fetchChatList = async (uid) => {
    const { data: memberships, error: membershipError } = await supabase
        .from('chat_participants')
        .select('chat_id, is_muted, last_read_at')
        .eq('user_id', uid)
        .is('left_at', null);
    if (membershipError) throw membershipError;

    const chatIds = (memberships || []).map((item) => item.chat_id);
    if (chatIds.length === 0) return [];

    const { data: chats, error: chatsError } = await supabase
        .from('chats')
        .select('*')
        .in('id', chatIds)
        .eq('is_active', true)
        .order('updated_at', { ascending: false });
    if (chatsError) throw chatsError;

    const { data: participants, error: participantsError } = await supabase
        .from('chat_participants')
        .select('chat_id, user_id')
        .in('chat_id', chatIds)
        .is('left_at', null);
    if (participantsError) throw participantsError;

    const participantIds = [...new Set((participants || []).map((row) => row.user_id))];
    const { data: profiles } = participantIds.length
        ? await supabase.from('profiles').select('id, name, photo_url').in('id', participantIds)
        : { data: [] };

    const membershipMap = new Map((memberships || []).map((item) => [item.chat_id, item]));
    const participantsByChat = new Map();
    (participants || []).forEach((item) => {
        const list = participantsByChat.get(item.chat_id) || [];
        list.push(item.user_id);
        participantsByChat.set(item.chat_id, list);
    });
    const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]));

    return Promise.all((chats || []).map(async (chat) => {
        const participantIdsForChat = participantsByChat.get(chat.id) || [];
        const isGroup = chat.type === 'group' || participantIdsForChat.length > 2 || Boolean(chat.circle_id);
        const membership = membershipMap.get(chat.id);
        let name = chat.name || 'Chat';
        let avatar = chat.avatar || null;
        let isOnline = false;
        let wellbeingScore = null;
        let wellbeingLabel = '';

        if (!isGroup) {
            const otherId = participantIdsForChat.find((id) => id !== uid);
            if (otherId) {
                const profile = profileMap.get(otherId);
                name = profile?.name || 'Anonymous';
                avatar = profile?.photo_url || null;
                try {
                    const presence = await presenceRepository.getPresence(otherId).catch(() => ({ state: 'offline' }));
                    isOnline = isPresenceOnline(presence);
                } catch {
                    isOnline = false;
                }
                wellbeingScore = resolveWellbeingScore(profile || {});
                wellbeingLabel = profile?.wellbeingLabel || profile?.wellbeingStatus || '';
            }
        }

        let unread = 0;
        const lastReadAt = membership?.last_read_at || null;
        let unreadQuery = supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('chat_id', chat.id)
            .neq('sender_id', uid);
        if (lastReadAt) {
            unreadQuery = unreadQuery.gt('created_at', lastReadAt);
        }
        const { count } = await unreadQuery;

        const updatedAt = chat.updated_at || null;

        return {
            id: chat.id,
            ...chat,
            participants: participantIdsForChat,
            circleId: chat.circle_id || null,
            name,
            avatar,
            time: updatedAt ? formatTimeUK(updatedAt) : '',
            members: participantIdsForChat.length,
            unread: count || 0,
            isOnline,
            isGroup,
            isMuted: Boolean(membership?.is_muted),
            me: uid,
            wellbeingScore,
            wellbeingLabel,
            updatedAt: chat.updated_at || null,
            createdAt: chat.created_at || null,
            lastMessage: chat.last_message_text || '',
            lastMessageType: chat.last_message_type || 'text',
            lastMessageSenderId: chat.last_message_sender_id || null,
            lastMessageAt: chat.last_message_at || null,
            lastMessageReadBy: [],
        };
    }));
};

const subscribeWithReload = ({ uid, callback, tables }) => {
    let active = true;
    const load = async () => {
        try {
            const chats = await fetchChatList(uid);
            if (active) callback(chats);
        } catch (error) {
            if (typeof __DEV__ !== 'undefined' && __DEV__) {
                console.warn('[Supabase] chat list reload failed', error?.message || error);
            }
        }
    };

    load();

    const channels = tables.map((table) =>
        supabase
            .channel(randomChannel(`chat-list-${table}`, uid))
            .on('postgres_changes', { event: '*', schema: 'public', table }, load)
            .subscribe()
    );

    return () => {
        active = false;
        channels.forEach((channel) => supabase.removeChannel(channel));
    };
};

export const chatService = {
    createDirectChat: async (recipientId) => {
        return chatRepository.createOrGetDirectChat(recipientId);
    },

    sendMessage: async (chatId, text, type = 'text', mediaUrl = null, clientMessageId = null) => {
        const normalizedText = type === 'text' ? sanitizeChatMessageText(text || '') : (text || '');
        if (type === 'text') {
            const unsafeLinks = findUnsafeUrlsInMessage(normalizedText);
            if (unsafeLinks.length > 0) {
                throw new Error('Suspicious links are not allowed in chat messages.');
            }
        }
        await chatRepository.sendMessage(chatId, normalizedText, type, mediaUrl, clientMessageId);
        return { success: true };
    },

    deleteChat: async (chatId, options = {}) => {
        return chatRepository.deleteChat(chatId, options);
    },

    setChatMuted: async (chatId, muted, uid = null) => {
        if (!uid || !chatId) throw new Error('Unable to update mute settings.');
        const { error } = await supabase
            .from('chat_participants')
            .update({ is_muted: !!muted, updated_at: new Date().toISOString() })
            .eq('chat_id', chatId)
            .eq('user_id', uid);
        if (error) throw error;
        return { success: true };
    },

    subscribeToMessages: (chatId, callback) => {
        let active = true;
        const load = async () => {
            try {
                const messages = await fetchMessages(chatId);
                if (active) callback(messages);
            } catch (error) {
                if (typeof __DEV__ !== 'undefined' && __DEV__) {
                    console.warn('[Supabase] subscribeToMessages failed', error?.message || error);
                }
            }
        };

        load();

        const channel = supabase
            .channel(randomChannel('messages', chatId))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` }, load)
            .subscribe();

        return () => {
            active = false;
            supabase.removeChannel(channel);
        };
    },

    subscribeToChatList: (uid, callback) => subscribeWithReload({
        uid,
        callback,
        tables: ['chats', 'chat_participants', 'messages'],
    }),

    subscribeUnreadCounts: (uid, callback) => {
        if (!uid) {
            callback({ byChat: {}, total: 0 });
            return () => {};
        }

        const pushCounts = async () => {
            try {
                const chats = await fetchChatList(uid);
                const byChat = chats.reduce((acc, chat) => {
                    acc[chat.id] = Number(chat.unread || 0);
                    return acc;
                }, {});
                const total = Object.values(byChat).reduce((sum, value) => sum + Number(value || 0), 0);
                callback({ byChat, total });
            } catch {
                callback({ byChat: {}, total: 0 });
            }
        };

        pushCounts();
        const channel = supabase
            .channel(randomChannel('unread', uid))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, pushCounts)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_participants', filter: `user_id=eq.${uid}` }, pushCounts)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    },

    markChatNotificationsRead: async (chatId, uid = null) => {
        if (!uid || !chatId) return;
        const nowIso = new Date().toISOString();
        await supabase
            .from('chat_participants')
            .update({ last_read_at: nowIso, updated_at: nowIso })
            .eq('chat_id', chatId)
            .eq('user_id', uid);

        await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', uid)
            .eq('type', 'CHAT_MESSAGE')
            .filter('data->>chatId', 'eq', String(chatId))
            .or('read.is.null,read.eq.false');

        await refreshNotificationBadgeCount(uid);
    },

    preloadChatList: async (uid) => {
        if (!uid) return [];
        return fetchChatList(uid);
    },

    subscribeToParticipantProfiles: (chatId, callback) => {
        if (!chatId) return () => {};
        let active = true;
        const load = async () => {
            try {
                const profiles = await fetchParticipantProfiles(chatId);
                if (active) callback(profiles);
            } catch (error) {
                if (typeof __DEV__ !== 'undefined' && __DEV__) {
                    console.warn('[Supabase] subscribeToParticipantProfiles failed', error?.message || error);
                }
                if (active) callback([]);
            }
        };
        load();
        const channel = supabase
            .channel(randomChannel('chat-participants', chatId))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_participants', filter: `chat_id=eq.${chatId}` }, load)
            .subscribe();
        return () => {
            active = false;
            supabase.removeChannel(channel);
        };
    },

    setTyping: (chatId, isTyping) => {
        return supabase.auth.getUser().then(({ data }) => liveStateRepository.setTyping(chatId, data.user?.id, isTyping));
    },

    subscribeTyping: (chatId, callback) => {
        return liveStateRepository.subscribeTyping(chatId, callback);
    },

    serializeChatForNavigation,
};
