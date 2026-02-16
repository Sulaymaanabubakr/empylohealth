import { auth, db } from '../firebaseConfig';
import { callableClient } from '../api/callableClient';
import {
    doc,
    getDoc
} from 'firebase/firestore';

export const chatRepository = {
    async createOrGetDirectChat(recipientId) {
        const currentUid = auth.currentUser?.uid;
        if (!currentUid) throw new Error('User must be authenticated.');
        if (!recipientId || recipientId === currentUid) {
            throw new Error('Recipient ID is invalid.');
        }

        const result = await callableClient.invokeWithAuth('createDirectChat', { recipientId });
        if (!result?.chatId) {
            throw new Error('Unable to create or fetch direct chat.');
        }
        return result;
    },

    async sendMessage(chatId, text, type = 'text', mediaUrl = null, clientMessageId = null) {
        const uid = auth.currentUser?.uid;
        if (!uid) throw new Error('User must be authenticated.');
        if (!chatId) throw new Error('chatId is required');

        const chatDocRef = doc(db, 'chats', chatId);
        const chatSnapshot = await getDoc(chatDocRef);
        if (!chatSnapshot.exists()) {
            throw new Error('Chat not found.');
        }

        const chatData = chatSnapshot.data();
        if (!Array.isArray(chatData.participants) || !chatData.participants.includes(uid)) {
            throw new Error('Not allowed to send messages to this chat.');
        }

        const result = await callableClient.invokeWithAuth('sendMessage', {
            chatId,
            text: text || '',
            type,
            mediaUrl: mediaUrl || null,
            clientMessageId: clientMessageId || null
        });

        return result || { success: true };
    }
};
