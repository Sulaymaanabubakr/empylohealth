import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';

export const subscriptionService = {
    /**
     * Update Subscription Plan
     * @param {string} planId 'pro' | 'enterprise'
     * @param {string} status 'active' | 'cancelled'
     */
    updateSubscription: async (planId, status = 'active') => {
        try {
            const updateFn = httpsCallable(functions, 'updateSubscription');
            await updateFn({ planId, status });
            return { success: true };
        } catch (error) {
            console.error("Error updating subscription:", error);
            throw error;
        }
    }
};
