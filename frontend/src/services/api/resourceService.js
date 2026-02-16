import { contentRepository } from '../repositories/ContentRepository';
import { callableClient } from './callableClient';

export const resourceService = {
    getExploreContent: async () => {
        return contentRepository.getExploreContent();
    },

    getAffirmations: async () => {
        const result = await callableClient.invokeWithAuth('getAffirmations', {});
        const items = Array.isArray(result?.items) ? result.items : [];
        return items;
    },

    // Kept for admin/dev background seeding.
    seedResources: async () => {
        await callableClient.invokeWithAuth('seedResources', {});
        return { success: true };
    }
};
