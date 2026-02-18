import { contentRepository } from '../repositories/ContentRepository';
import { callableClient } from './callableClient';

export const resourceService = {
    getExploreContent: async () => {
        try {
            const result = await callableClient.invokeWithAuth('getExploreContent', {});
            const items = Array.isArray(result?.items) ? result.items : [];
            if (items.length > 0) return items;
        } catch (error) {
            console.warn('getExploreContent callable failed, using fallback:', error?.message || error);
        }
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
