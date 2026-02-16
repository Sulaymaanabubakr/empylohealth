import { auth, db } from '../firebaseConfig';
import { callableClient } from '../api/callableClient';
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    query,
    serverTimestamp,
    where
} from 'firebase/firestore';

const chatsRef = collection(db, 'chats');

const buildDirectKey = (uidA, uidB) => [uidA, uidB].sort().join('__');

export const chatRepository = {
    async createOrGetDirectChat(recipientId) {
        const currentUid = auth.currentUser?.uid;
        if (!currentUid) throw new Error('User must be authenticated.');
        if (!recipientId || recipientId === currentUid) {
            throw new Error('Recipient ID is invalid.');
        }

        const directKey = buildDirectKey(currentUid, recipientId);
        const existingQuery = query(chatsRef, where('directKey', '==', directKey), limit(1));
        const existing = await getDocs(existingQuery);
        if (!existing.empty) {
            return { success: true, chatId: existing.docs[0].id, isNew: false };
        }

        const fallbackQuery = query(
            chatsRef,
            where('type', '==', 'direct'),
            where('participants', 'array-contains', currentUid),
            limit(25)
        );
        const fallback = await getDocs(fallbackQuery);
        const found = fallback.docs.find((chatDoc) => {
            const participants = chatDoc.data()?.participants || [];
            return participants.includes(recipientId);
        });
        if (found) {
            return { success: true, chatId: found.id, isNew: false };
        }

        const created = await addDoc(chatsRef, {
            type: 'direct',
            directKey,
            participants: [currentUid, recipientId],
            createdBy: currentUid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastMessage: null,
            status: 'active'
        });

        return { success: true, chatId: created.id, isNew: true };
    },

    async sendMessage(chatId, text, type = 'text', mediaUrl = null) {
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
            mediaUrl: mediaUrl || null
        });

        return result || { success: true };
    }
};
