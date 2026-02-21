import { db, auth } from '../firebaseConfig';
import { collection, query, where, orderBy, limit, getDocs, getDoc, doc, onSnapshot } from 'firebase/firestore';
import { assessmentRepository } from '../repositories/AssessmentRepository';
import { contentRepository } from '../repositories/ContentRepository';
import { callableClient } from './callableClient';

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
        try {
            const response = await callableClient.invokeWithAuth('getKeyChallenges', {});
            if (Array.isArray(response) && response.length > 0) return response;
        } catch (error) {
            console.warn('getKeyChallenges callable failed, using fallback:', error?.message || error);
        }
        return contentRepository.getKeyChallenges(5);
    },

    getRecommendedContent: async () => {
        const user = auth.currentUser;
        if (!user) return [];

        try {
            const response = await callableClient.invokeWithAuth('getRecommendedContent', {});
            const items = Array.isArray(response?.items) ? response.items : [];
            if (items.length > 0) return items;
        } catch (error) {
            console.warn('getRecommendedContent callable failed, using fallback:', error?.message || error);
        }

        // Fallback path uses user theme scores (not question text keys) for better personalization.
        const userData = (await getDoc(doc(db, 'users', user.uid))).data() || {};
        const themeEntries = Object.entries(userData?.stats?.themes || {});
        const weakThemes = themeEntries
            .filter(([_, score]) => Number(score) > 0 && Number(score) <= 3)
            .sort((a, b) => Number(a[1]) - Number(b[1]))
            .map(([theme]) => String(theme || '').trim().toLowerCase());

        const allContent = await contentRepository.getExploreContent(40);
        if (!weakThemes.length) return allContent.slice(0, 10).map((item) => ({ ...item, image: null }));

        const matched = allContent
            .filter((item) => {
                const tags = (item.tags || item.themes || []).map((tag) => String(tag || '').trim().toLowerCase());
                const category = String(item?.category || '').trim().toLowerCase();
                return tags.some((tag) => weakThemes.includes(tag)) || weakThemes.includes(category);
            })
            .slice(0, 10);

        return (matched.length > 0 ? matched : allContent.slice(0, 10)).map((item) => ({ ...item, image: null }));
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
