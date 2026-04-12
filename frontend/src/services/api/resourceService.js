import { contentRepository } from '../repositories/ContentRepository';
import { callableClient } from './callableClient';

export const resourceService = {
    getExploreContent: async () => {
        try {
            const result = await callableClient.invokeWithAuth('getExploreContent', {});
            const items = Array.isArray(result?.items) ? result.items : [];
            if (items.length > 0) return items.map((item) => contentRepository.normalizeExploreResource(item));
        } catch (error) {
            console.warn('getExploreContent callable failed, using fallback:', error?.message || error);
        }
        return contentRepository.getExploreContent();
    },

    getAffirmations: async () => {
        try {
            const result = await callableClient.invokeWithAuth('getAffirmations', {});
            if (Array.isArray(result)) return result;
            if (Array.isArray(result?.items)) return result.items;
            return [];
        } catch (error) {
            console.warn('getAffirmations callable failed, using fallback:', error?.message || error);
            return contentRepository.getAffirmations();
        }
    },

    // Kept for admin/dev background seeding.
    seedResources: async () => {
        await callableClient.invokeWithAuth('seedResources', {});
        return { success: true };
    }
};
