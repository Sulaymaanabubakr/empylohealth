import { callableClient } from './callableClient';

export const aiService = {
    askAboutChallenge: async ({ challenge, messages, idempotencyKey }) => {
        return callableClient.invokeWithAuth('askAiAboutChallenge', {
            challenge,
            messages,
            idempotencyKey,
        });
    },
};
