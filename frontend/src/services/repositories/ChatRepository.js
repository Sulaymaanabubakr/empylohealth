import { supabase } from '../supabase/supabaseClient';
import { authApiClient } from '../auth/authApiClient';

export const chatRepository = {
    async createOrGetDirectChat(recipientId) {
        const { data } = await supabase.auth.getUser();
        const currentUid = data.user?.id;
        if (!currentUid) throw new Error('User must be authenticated.');
        if (!recipientId || recipientId === currentUid) {
            throw new Error('Recipient ID is invalid.');
        }

        const result = await authApiClient.invokeWithAuth('create-direct-chat', { recipientId });
        if (!result?.chatId) {
            throw new Error('Unable to create or fetch direct chat.');
        }
        return result;
    },

    async sendMessage(chatId, text, type = 'text', mediaUrl = null, clientMessageId = null) {
        if (!chatId) throw new Error('chatId is required');

        const result = await authApiClient.invokeWithAuth('send-message', {
            chatId,
            text: text || '',
            type,
            mediaUrl: mediaUrl || null,
            clientMessageId: clientMessageId || null,
        });

        return result || { success: true };
    },

    async deleteChat(chatId) {
        const { data } = await supabase.auth.getUser();
        const uid = data.user?.id;
        if (!uid) throw new Error('User must be authenticated.');
        if (!chatId) throw new Error('chatId is required');
        return authApiClient.invokeWithAuth('delete-chat', { chatId });
    },
};
