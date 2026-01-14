import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';

export const resourceService = {
    /**
     * Get Explore Content (Articles, Assignments)
     */
    getExploreContent: async () => {
        try {
            const getFn = httpsCallable(functions, 'getExploreContent');
            const result = await getFn();
            return result.data.items || [];
        } catch (error) {
            console.error("Error fetching explore content:", error);
            throw error;
        }
    },

    /**
     * Get Daily Affirmations
     */
    getAffirmations: async () => {
        try {
            const getFn = httpsCallable(functions, 'getAffirmations');
            const result = await getFn();
            return result.data.items || [];
        } catch (error) {
            console.log("Error fetching affirmations", error);
            throw error;
        }
    },

    /**
     * Seed initial content (Dev only)
     */
    seedResources: async () => {
        try {
            const seedFn = httpsCallable(functions, 'seedResources');
            await seedFn();
            return { success: true };
        } catch (error) {
            console.error(error);
        }
    }
};
