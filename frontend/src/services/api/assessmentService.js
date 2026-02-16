import { db, auth } from '../firebaseConfig';
import { collection, query, where, orderBy, limit, getDocs, doc, onSnapshot } from 'firebase/firestore';
import { assessmentRepository } from '../repositories/AssessmentRepository';
import { contentRepository } from '../repositories/ContentRepository';

export const assessmentService = {
    submitAssessment: async (type, score, answers = {}, mood = '') => {
        await assessmentRepository.submitAssessment({ type, score, answers, mood });
        return { success: true };
    },

    getWellbeingStats: async () => {
        return assessmentRepository.getUserStats();
    },

    subscribeToWellbeingStats: (uid, callback) => {
        if (!uid) return () => { };

        const userRef = doc(db, 'users', uid);
        return onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const score = data.wellbeingScore || 0;
                let label = 'Neutral';
                if (score >= 80) label = 'Thriving';
                else if (score >= 60) label = 'Doing Well';
                else if (score >= 40) label = 'Okay';
                else if (score >= 20) label = 'Struggling';
                else label = 'Needs Attention';

                callback({
                    score,
                    label: data.wellbeingLabel || label,
                    streak: data.streak || 0
                });
            } else {
                callback(null);
            }
        }, (error) => {
            console.error('Error subscribing to wellbeing stats:', error);
        });
    },

    getKeyChallenges: async () => {
        return contentRepository.getKeyChallenges(5);
    },

    getRecommendedContent: async () => {
        const user = auth.currentUser;
        if (!user) return [];

        const userSnap = await getDocs(query(collection(db, 'assessments'), where('uid', '==', user.uid), orderBy('createdAt', 'desc'), limit(1)));
        const latest = userSnap.docs[0]?.data();
        const challengeTags = Object.keys(latest?.answers || {}).filter((key) => latest.answers[key]);

        const allContent = await contentRepository.getExploreContent(40);
        if (!challengeTags.length) return allContent.slice(0, 10);

        const matched = allContent
            .filter((item) => {
                const tags = item.tags || item.themes || [];
                return tags.some((tag) => challengeTags.includes(tag));
            })
            .slice(0, 10);

        // Fallback: when tags exist but nothing matches, show general content instead of empty.
        return matched.length > 0 ? matched : allContent.slice(0, 10);
    },

    getAssessmentHistory: async (limitCount = 7) => {
        return assessmentRepository.getAssessmentHistory(limitCount);
    },

    getQuestions: async () => {
        try {
            const q = query(
                collection(db, 'assessment_questions'),
                where('isActive', '==', true),
                orderBy('order', 'asc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
        } catch (error) {
            console.error('Error fetching questions:', error);
            return [];
        }
    }
};
