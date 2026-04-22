import { callableClient } from './callableClient';
import { subscriptionGuardService } from '../subscription/subscriptionGuardService';

export const aiService = {
    askAboutChallenge: async ({ challenge, messages, idempotencyKey }) => {
        const result = await callableClient.invokeWithAuth('askAiAboutChallenge', {
            challenge,
            messages,
            idempotencyKey,
        });
        subscriptionGuardService.invalidateCache();
        return result;
    },
};
