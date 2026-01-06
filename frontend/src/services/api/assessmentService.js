import { functions } from '../services/firebaseConfig';
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
    }
};
