import { functions, db } from '../services/firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';

export const chatService = {
    /**
     * Create or Get existing Direct Chat
     * @param {string} recipientId 
     */
    createDirectChat: async (recipientId) => {
        try {
            const createFn = httpsCallable(functions, 'createDirectChat');
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
    sendMessage: async (chatId, text, type = 'text', mediaUrl = null) => {
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
    subscribeToMessages: (chatId, callback) => {
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
    subscribeToChatList: (uid, callback) => {
        const q = query(
            collection(db, 'chats'),
            where('participants', 'array-contains', uid),
            orderBy('updatedAt', 'desc')
        );
        return onSnapshot(q, (snapshot) => {
            const chats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(chats);
        });
    }
};
