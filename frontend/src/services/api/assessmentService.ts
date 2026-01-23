// TypeScript conversion in progress
import { functions, db, auth } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

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
     * Subscribe to User Wellbeing Stats (Real-time)
     * @param {string} uid
     * @param {function} callback
     */
    subscribeToWellbeingStats: (uid, callback) => {
        if (!uid) return () => { };

        // Listen to the user document where wellbeingScore is stored
        // Note: The 'label' logic here is client-side approximation or stored in user doc
        // Ideally, 'stats' should be a subcollection or field on user doc.
        const userRef = doc(db, 'users', uid);
        return onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const score = data.wellbeingScore || 0;
                // Simple client-side catch for label if not in DB
                let label = 'Neutral';
                if (score >= 80) label = 'Thriving';
                else if (score >= 60) label = 'Doing Well';
                else if (score >= 40) label = 'Okay';
                else if (score >= 20) label = 'Struggling';
                else label = 'Needs Attention';

                callback({
                    score: score,
                    label: data.wellbeingLabel || label,
                    streak: data.streak || 0
                });
            } else {
                callback(null);
            }
        }, (error) => {
            console.error("Error subscribing to wellbeing stats:", error);
        });
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
    },
    /**
     * Get Assessment History directly from Firestore
     * @param {number} limitCount Number of records to fetch
     */
    getAssessmentHistory: async (limitCount = 7) => {
        try {
            const user = auth.currentUser;
            if (!user) return [];

            const q = query(
                collection(db, 'assessments'),
                where('uid', '==', user.uid),
                orderBy('createdAt', 'desc'),
                limit(limitCount)
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt) // Handle Firestore Timestamp
            }));
        } catch (error) {
            console.error("Error fetching assessment history:", error);
            return [];
        }
    },

    /**
     * Get Dynamic Assessment Questions
     */
    getQuestions: async () => {
        try {
            const q = query(
                collection(db, 'assessment_questions'),
                where('isActive', '==', true),
                orderBy('order', 'asc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error("Error fetching questions:", error);
            return [];
        }
    }
};
