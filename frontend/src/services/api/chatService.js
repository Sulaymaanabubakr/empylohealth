import { db, auth } from '../firebaseConfig';
import { collection, query, where, orderBy, onSnapshot, limit, doc, getDoc } from 'firebase/firestore';
import { chatRepository } from '../repositories/ChatRepository';
import { liveStateRepository } from '../repositories/LiveStateRepository';
import { presenceRepository } from '../repositories/PresenceRepository';

export const chatService = {
    createDirectChat: async (recipientId) => {
        return chatRepository.createOrGetDirectChat(recipientId);
    },

    sendMessage: async (chatId, text, type = 'text', mediaUrl = null, clientMessageId = null) => {
        await chatRepository.sendMessage(chatId, text, type, mediaUrl, clientMessageId);
        return { success: true };
    },

    subscribeToMessages: (chatId, callback) => {
        const q = query(
            collection(db, 'chats', chatId, 'messages'),
            orderBy('createdAt', 'desc'),
            limit(50)
        );
        return onSnapshot(q, (snapshot) => {
            const messages = snapshot.docs.map((docSnap) => {
                const data = docSnap.data();
                return {
                    _id: docSnap.id,
                    clientMessageId: data.clientMessageId || null,
                    text: data.text,
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
                    createdAtMs: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
                    readBy: Array.isArray(data.readBy) ? data.readBy : [],
                    user: {
                        _id: data.senderId
                    },
                    image: data.mediaUrl || undefined
                };
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
                        } catch {
                            // Ignore enrichment errors.
                        }
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
                    me: auth.currentUser?.uid || uid
                };
            }));
            callback(chats);
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
