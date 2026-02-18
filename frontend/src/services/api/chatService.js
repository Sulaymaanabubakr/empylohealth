import { db, auth } from '../firebaseConfig';
import { collection, query, where, orderBy, onSnapshot, limit, doc, getDoc, getDocs, writeBatch, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { chatRepository } from '../repositories/ChatRepository';
import { liveStateRepository } from '../repositories/LiveStateRepository';
import { presenceRepository } from '../repositories/PresenceRepository';
import { resolveWellbeingScore } from '../../utils/wellbeing';

export const chatService = {
    createDirectChat: async (recipientId) => {
        return chatRepository.createOrGetDirectChat(recipientId);
    },

    sendMessage: async (chatId, text, type = 'text', mediaUrl = null, clientMessageId = null) => {
        await chatRepository.sendMessage(chatId, text, type, mediaUrl, clientMessageId);
        return { success: true };
    },

    deleteChat: async (chatId, options = {}) => {
        return chatRepository.deleteChat(chatId, options);
    },

    setChatMuted: async (chatId, muted, uid = auth.currentUser?.uid) => {
        if (!uid || !chatId) throw new Error('Unable to update mute settings.');
        await updateDoc(doc(db, 'users', uid), {
            mutedChatIds: muted ? arrayUnion(chatId) : arrayRemove(chatId),
            updatedAt: new Date()
        });
        return { success: true };
    },

    subscribeToMessages: (chatId, callback) => {
        const q = query(
            collection(db, 'chats', chatId, 'messages'),
            orderBy('createdAt', 'desc'),
            limit(50)
        );
        return onSnapshot(q, (snapshot) => {
            const currentUid = auth.currentUser?.uid || null;
            const messages = snapshot.docs.map((docSnap) => {
                const data = docSnap.data();
                return {
                    _id: docSnap.id,
                    clientMessageId: data.clientMessageId || null,
                    text: data.text,
                    type: data.type || 'text',
                    systemKind: data.systemKind || null,
                    visibleTo: Array.isArray(data.visibleTo) ? data.visibleTo : [],
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
                    createdAtMs: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
                    readBy: Array.isArray(data.readBy) ? data.readBy : [],
                    user: {
                        _id: data.senderId
                    },
                    image: data.mediaUrl || undefined
                };
            }).filter((message) => {
                if (!Array.isArray(message.visibleTo) || message.visibleTo.length === 0) return true;
                if (!currentUid) return false;
                return message.visibleTo.includes(currentUid);
            });
            callback(messages);
        });
    },

    subscribeToChatList: (uid, callback) => {
        const q = query(
            collection(db, 'chats'),
            where('participants', 'array-contains', uid),
            orderBy('updatedAt', 'desc')
        );
        return onSnapshot(q, async (snapshot) => {
            let blockedUserIds = [];
            let mutedChatIds = [];
            try {
                const selfDoc = await getDoc(doc(db, 'users', uid));
                blockedUserIds = Array.isArray(selfDoc.data()?.blockedUserIds) ? selfDoc.data().blockedUserIds : [];
                mutedChatIds = Array.isArray(selfDoc.data()?.mutedChatIds) ? selfDoc.data().mutedChatIds : [];
            } catch {
                blockedUserIds = [];
                mutedChatIds = [];
            }
            const circleCache = new Map();
            const chats = await Promise.all(snapshot.docs.map(async (docSnap) => {
                const data = docSnap.data();
                const participants = data.participants || [];
                const isGroup = data.type === 'group' || participants.length > 2;
                let name = data.name || 'Chat';
                let avatar = data.avatar || null;
                let isOnline = false;

                if (!isGroup) {
                    const otherId = participants.find((id) => id !== uid);
                    if (otherId) {
                        try {
                            const [userDoc, presence] = await Promise.all([
                                getDoc(doc(db, 'users', otherId)),
                                presenceRepository.getPresence(otherId).catch(() => ({ state: 'offline' }))
                            ]);
                            const userData = userDoc.exists() ? userDoc.data() : {};
                            name = userData?.name || userData?.displayName || 'Anonymous';
                            avatar = userData?.photoURL || null;
                            isOnline = presence?.state === 'online';
                            data.wellbeingScore = resolveWellbeingScore(userData);
                            data.wellbeingLabel = userData?.wellbeingLabel || userData?.wellbeingStatus || '';
                        } catch {
                            // Ignore enrichment errors.
                        }
                    }
                } else if (data?.circleId) {
                    try {
                        const circleId = data.circleId;
                        if (!circleCache.has(circleId)) {
                            const circleDoc = await getDoc(doc(db, 'circles', circleId));
                            circleCache.set(circleId, circleDoc.exists() ? (circleDoc.data() || {}) : null);
                        }
                        const circleData = circleCache.get(circleId);
                        if (circleData) {
                            name = circleData?.name || name;
                            avatar = circleData?.image || circleData?.avatar || circleData?.photoURL || avatar || null;
                        }
                    } catch {
                        // Ignore group enrichment errors.
                    }
                }

                const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : null;
                const time = updatedAt ? updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

                return {
                    id: docSnap.id,
                    ...data,
                    name,
                    avatar,
                    time,
                    members: participants.length,
                    unread: 0,
                    isOnline,
                    isGroup,
                    isMuted: mutedChatIds.includes(docSnap.id),
                    me: auth.currentUser?.uid || uid
                };
            }));
            const visibleChats = chats.filter((chat) => {
                if (chat?.isGroup) return true;
                const otherId = Array.isArray(chat?.participants)
                    ? chat.participants.find((id) => id !== uid)
                    : null;
                return !otherId || !blockedUserIds.includes(otherId);
            });
            callback(visibleChats);
        });
    },

    subscribeUnreadCounts: (uid, callback) => {
        if (!uid) {
            callback({ byChat: {}, total: 0 });
            return () => {};
        }
        const q = query(
            collection(db, 'notifications'),
            where('uid', '==', uid),
            where('type', '==', 'CHAT_MESSAGE'),
            where('read', '==', false)
        );
        return onSnapshot(q, (snapshot) => {
            const byChat = {};
            snapshot.docs.forEach((docSnap) => {
                const chatId = docSnap.data()?.chatId;
                if (!chatId) return;
                byChat[chatId] = (byChat[chatId] || 0) + 1;
            });
            callback({
                byChat,
                total: snapshot.size
            });
        }, () => {
            callback({ byChat: {}, total: 0 });
        });
    },

    markChatNotificationsRead: async (chatId, uid = auth.currentUser?.uid) => {
        if (!uid || !chatId) return;
        const q = query(
            collection(db, 'notifications'),
            where('uid', '==', uid),
            where('type', '==', 'CHAT_MESSAGE'),
            where('chatId', '==', chatId),
            where('read', '==', false)
        );
        const snap = await getDocs(q);
        if (snap.empty) return;
        const batch = writeBatch(db);
        snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
        await batch.commit();
        await updateDoc(doc(db, 'chats', chatId), {
            lastMessageReadBy: arrayUnion(uid)
        }).catch(() => {});
    },

    preloadChatList: async (uid) => {
        if (!uid) return [];
        const q = query(
            collection(db, 'chats'),
            where('participants', 'array-contains', uid),
            orderBy('updatedAt', 'desc')
        );
        const [snapshot, selfDoc] = await Promise.all([
            getDocs(q),
            getDoc(doc(db, 'users', uid)).catch(() => null)
        ]);
        const blockedUserIds = Array.isArray(selfDoc?.data?.()?.blockedUserIds) ? selfDoc.data().blockedUserIds : [];
        const mutedChatIds = Array.isArray(selfDoc?.data?.()?.mutedChatIds) ? selfDoc.data().mutedChatIds : [];
        const circleCache = new Map();
        const chats = await Promise.all(snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            const participants = data.participants || [];
            const isGroup = data.type === 'group' || participants.length > 2;
            let name = data.name || 'Chat';
            let avatar = data.avatar || null;
            let isOnline = false;

            if (!isGroup) {
                const otherId = participants.find((id) => id !== uid);
                if (otherId) {
                    try {
                        const [userDoc, presence] = await Promise.all([
                            getDoc(doc(db, 'users', otherId)),
                            presenceRepository.getPresence(otherId).catch(() => ({ state: 'offline' }))
                        ]);
                        const userData = userDoc.exists() ? userDoc.data() : {};
                        name = userData?.name || userData?.displayName || 'Anonymous';
                        avatar = userData?.photoURL || null;
                        isOnline = presence?.state === 'online';
                        data.wellbeingScore = resolveWellbeingScore(userData);
                        data.wellbeingLabel = userData?.wellbeingLabel || userData?.wellbeingStatus || '';
                    } catch {
                        // Ignore enrichment errors.
                    }
                }
            } else if (data?.circleId) {
                try {
                    const circleId = data.circleId;
                    if (!circleCache.has(circleId)) {
                        const circleDoc = await getDoc(doc(db, 'circles', circleId));
                        circleCache.set(circleId, circleDoc.exists() ? (circleDoc.data() || {}) : null);
                    }
                    const circleData = circleCache.get(circleId);
                    if (circleData) {
                        name = circleData?.name || name;
                        avatar = circleData?.image || circleData?.avatar || circleData?.photoURL || avatar || null;
                    }
                } catch {
                    // Ignore group enrichment errors.
                }
            }

            const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : null;
            const time = updatedAt ? updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
            return {
                id: docSnap.id,
                ...data,
                name,
                avatar,
                time,
                members: participants.length,
                unread: 0,
                isOnline,
                isGroup,
                isMuted: mutedChatIds.includes(docSnap.id),
                me: auth.currentUser?.uid || uid
            };
        }));
        return chats.filter((chat) => {
            if (chat?.isGroup) return true;
            const otherId = Array.isArray(chat?.participants)
                ? chat.participants.find((id) => id !== uid)
                : null;
            return !otherId || !blockedUserIds.includes(otherId);
        });
    },

    setTyping: (chatId, isTyping) => {
        const uid = auth.currentUser?.uid;
        return liveStateRepository.setTyping(chatId, uid, isTyping);
    },

    subscribeTyping: (chatId, callback) => {
        return liveStateRepository.subscribeTyping(chatId, callback);
    }
};
