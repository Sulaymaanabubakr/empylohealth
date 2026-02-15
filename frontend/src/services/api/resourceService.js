import { contentRepository } from '../repositories/ContentRepository';
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';

export const resourceService = {
    getExploreContent: async () => {
        return contentRepository.getExploreContent();
    },

    getAffirmations: async () => {
        return contentRepository.getAffirmations();
    },

    // Kept for admin/dev background seeding.
    seedResources: async () => {
        const seedFn = httpsCallable(functions, 'seedResources');
        await seedFn();
        return { success: true };
    }
};
