import { functions, db } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import { collection, query, where, orderBy, onSnapshot, limit, doc, getDoc, Unsubscribe } from 'firebase/firestore';
import { Chat, Message } from '../../types';

interface CreateChatResponse {
    success: boolean;
    chatId: string;
    isNew: boolean;
}

interface GiftedChatMessage {
    _id: string;
    text: string;
    createdAt: Date;
    user: {
        _id: string;
    };
    image?: string;
}

export const chatService = {
    /**
     * Create or Get existing Direct Chat
     * @param {string} recipientId 
     */
    createDirectChat: async (recipientId: string): Promise<CreateChatResponse> => {
        try {
            const createFn = httpsCallable<{ recipientId: string }, CreateChatResponse>(functions, 'createDirectChat');
            const result = await createFn({ recipientId });
            return result.data; // { success: true, chatId: '...', isNew: boolean }
        } catch (error) {
            console.error("Error creating chat:", error);
            throw error;
        }
    },

    /**
     * Send Message via Backend
     * @param {string} chatId 
     * @param {string} text 
     * @param {string} type 
     * @param {string} mediaUrl 
     */
    sendMessage: async (chatId: string, text: string, type: string = 'text', mediaUrl: string | null = null): Promise<{ success: boolean }> => {
        try {
            const sendFn = httpsCallable(functions, 'sendMessage');
            await sendFn({ chatId, text, type, mediaUrl });
            return { success: true };
        } catch (error) {
            console.error("Error sending message:", error);
            throw error;
        }
    },

    /**
     * Subscribe to specific Chat Messages
     * @param {string} chatId 
     * @param {function} callback 
     */
    subscribeToMessages: (chatId: string, callback: (messages: GiftedChatMessage[]) => void): Unsubscribe => {
        const q = query(
            collection(db, 'chats', chatId, 'messages'),
            orderBy('createdAt', 'desc'),
            limit(50)
        );
        return onSnapshot(q, (snapshot) => {
            const messages = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    _id: doc.id,
                    text: data.text,
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
                    user: {
                        _id: data.senderId,
                        // name/avatar would need to be fetched or stored in msg if simple
                    },
                    image: data.mediaUrl || undefined
                };
            });
            callback(messages);
        });
    },

    /**
     * Subscribe to User's Chat List
     * @param {string} uid 
     * @param {function} callback 
     */
    subscribeToChatList: (uid: string, callback: (chats: any[]) => void): Unsubscribe => {
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

                if (!isGroup) {
                    const otherId = participants.find((id: string) => id !== uid);
                    if (otherId) {
                        const userDoc = await getDoc(doc(db, 'users', otherId));
                        const userData = userDoc.exists() ? userDoc.data() : {};
                        name = userData?.name || userData?.displayName || 'Anonymous';
                        avatar = userData?.photoURL || null;
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
                    isOnline: false,
                    isGroup
                };
            }));
            callback(chats);
        });
    }
};
