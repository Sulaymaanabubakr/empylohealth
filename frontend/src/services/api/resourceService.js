import { contentRepository } from '../repositories/ContentRepository';
import { callableClient } from './callableClient';

export const resourceService = {
    getExploreContent: async () => {
        return contentRepository.getExploreContent();
    },

    getAffirmations: async () => {
        return contentRepository.getAffirmations();
    },

    // Kept for admin/dev background seeding.
    seedResources: async () => {
        await callableClient.invokeWithAuth('seedResources', {});
        return { success: true };
    }
};
