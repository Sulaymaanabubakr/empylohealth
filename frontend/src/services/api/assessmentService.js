import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';

export const assessmentService = {
    /**
     * Submit Check-in or Questionnaire
     * @param {string} type 'daily' | 'questionnaire'
     * @param {number} score 
     * @param {object} answers 
     * @param {string} mood 
     */
    submitAssessment: async (type, score, answers = {}, mood = '') => {
        try {
            const submitFn = httpsCallable(functions, 'submitAssessment');
            await submitFn({ type, score, answers, mood });
            return { success: true };
        } catch (error) {
            console.error("Error submitting assessment:", error);
            throw error;
        }
    },

    /**
     * Get latest User Wellbeing Stats
     */
    getWellbeingStats: async () => {
        try {
            // For now, if backend is not ready, we can simulate or call a generic 'getUserStats'
            // assuming 'getUserStats' function exists or we create it.
            const getFn = httpsCallable(functions, 'getUserStats');
            const result = await getFn();
            return result.data || { score: null, label: 'No data' };
        } catch (error) {
            console.log("Error fetching stats", error);
            throw error;
        }
    },

    /**
     * Get Key Challenges
     */
    getKeyChallenges: async () => {
        try {
            const getFn = httpsCallable(functions, 'getKeyChallenges');
            const result = await getFn();
            return result.data || [];
        } catch (error) {
            console.log("Error fetching challenges", error);
            throw error;
        }
    },

    /**
     * Get Recommended Content matching user themes
     */
    getRecommendedContent: async () => {
        try {
            const getFn = httpsCallable(functions, 'getRecommendedContent');
            const result = await getFn();
            return result.data.items || [];
        } catch (error) {
            console.log("Error fetching recommendations", error);
            throw error; // or return empty array
        }
    }
};
