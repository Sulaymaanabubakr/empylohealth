import { assessmentRepository } from '../repositories/AssessmentRepository';
import { contentRepository } from '../repositories/ContentRepository';
import { callableClient } from './callableClient';
import { supabase } from '../supabase/supabaseClient';
import { subscriptionGuardService } from '../subscription/subscriptionGuardService';

let lastChallengeGenerationAttemptAt = 0;
let lastChallengeGenerationFailureAt = 0;
const CHALLENGE_GENERATION_THROTTLE_MS = 60 * 1000;
const randomChannel = (prefix, value) => `${prefix}:${value}:${Math.random().toString(36).slice(2, 8)}`;

export const assessmentService = {
    submitAssessment: async (type, score, answers = {}, mood = '') => {
        const result = await assessmentRepository.submitAssessment({ type, score, answers, mood });
        try {
            await callableClient.invokeWithAuth('generateKeyChallengesForLatestAssessment', {
                assessmentId: result?.assessmentId || '',
                idempotencyKey: `assessment:${result?.assessmentId || 'latest'}`
            });
        } catch (error) {
            console.warn('generateKeyChallengesForLatestAssessment failed:', error?.message || error);
        }
        return { success: true, assessmentId: result?.assessmentId || '' };
    },

    getWellbeingStats: async () => {
        return assessmentRepository.getUserStats();
    },

    subscribeToWellbeingStats: (uid, callback) => {
        if (!uid) return () => { };
        let active = true;
        const load = async () => {
            try {
                const stats = await assessmentRepository.getUserStats();
                if (active) callback(stats);
            } catch (error) {
                console.error('Error subscribing to wellbeing stats:', error);
                if (active) callback(null);
            }
        };

        load();

        const channel = supabase
            .channel(randomChannel('wellbeing', uid))
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'profiles',
                filter: `id=eq.${uid}`,
            }, load)
            .subscribe();

        return () => {
            active = false;
            supabase.removeChannel(channel).catch(() => {});
        };
    },

    getKeyChallenges: async () => {
        try {
            const status = await subscriptionGuardService.getSubscriptionStatus();
            const plan = String(status?.entitlement?.plan || 'free').toLowerCase();
            if (plan === 'free') {
                return [];
            }
        } catch {
            // If status resolution fails, keep the previous behavior below.
        }

        try {
            const response = await callableClient.invokeWithAuth('getKeyChallenges', {});
            const items = Array.isArray(response)
                ? response
                : (Array.isArray(response?.items) ? response.items : []);

            if (items.length > 0) return items;

            const now = Date.now();
            const tooSoonAfterAttempt = (now - lastChallengeGenerationAttemptAt) < CHALLENGE_GENERATION_THROTTLE_MS;
            const tooSoonAfterFailure = (now - lastChallengeGenerationFailureAt) < CHALLENGE_GENERATION_THROTTLE_MS;
            if (tooSoonAfterAttempt || tooSoonAfterFailure) {
                return [];
            }

            lastChallengeGenerationAttemptAt = now;
            await callableClient.invokeWithAuth('generateKeyChallengesForLatestAssessment', {
                idempotencyKey: 'assessment:latest'
            });

            const retryResponse = await callableClient.invokeWithAuth('getKeyChallenges', {});
            const retryItems = Array.isArray(retryResponse)
                ? retryResponse
                : (Array.isArray(retryResponse?.items) ? retryResponse.items : []);

            return retryItems;
        } catch (error) {
            lastChallengeGenerationFailureAt = Date.now();
            const msg = error?.message || String(error);
            console.warn('getKeyChallenges callable failed:', msg);
            if (msg.includes('AI credits')) {
                import('react-native').then(({ Alert }) => {
                    Alert.alert(
                        'AI Credit Limit Reached',
                        'You have run out of AI generation credits for your current plan. Displaying your most recent insights instead.',
                        [{ text: 'OK' }]
                    );
                });
            }
        }
        return [];
    },

    getRecommendedContent: async () => {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData.user;
        if (!user) return [];

        try {
            const response = await callableClient.invokeWithAuth('getRecommendedContent', {});
            const items = Array.isArray(response?.items) ? response.items : [];
            if (items.length > 0) return items.map((item) => contentRepository.normalizeRecommendationResource(item));
        } catch (error) {
            console.warn('getRecommendedContent callable failed, using fallback:', error?.message || error);
        }

        // Fallback path uses user theme scores (not question text keys) for better personalization.
        const { data: profileData } = await supabase
            .from('profiles')
            .select('stats')
            .eq('id', user.id)
            .maybeSingle();
        const themeEntries = Object.entries(profileData?.stats?.themes || {});
        const weakThemes = themeEntries
            .filter(([_, score]) => Number(score) > 0 && Number(score) <= 3)
            .sort((a, b) => Number(a[1]) - Number(b[1]))
            .map(([theme]) => String(theme || '').trim().toLowerCase());

        const allContent = await contentRepository.getExploreContent(40);
        if (!weakThemes.length) return allContent.slice(0, 10).map((item) => contentRepository.normalizeRecommendationResource(item));

        const matched = allContent
            .filter((item) => {
                const tags = (item.tags || item.themes || []).map((tag) => String(tag || '').trim().toLowerCase());
                const category = String(item?.category || '').trim().toLowerCase();
                return tags.some((tag) => weakThemes.includes(tag)) || weakThemes.includes(category);
            })
            .slice(0, 10);

        return (matched.length > 0 ? matched : allContent.slice(0, 10)).map((item) => contentRepository.normalizeRecommendationResource(item));
    },

    getAssessmentHistory: async (limitCount = 7) => {
        return assessmentRepository.getAssessmentHistory(limitCount);
    },

    getQuestions: async () => {
        try {
            const { data, error } = await supabase
                .from('assessment_questions')
                .select('*')
                .eq('is_active', true)
                .order('sort_order', { ascending: true });
            if (error) throw error;
            return (data || []).map((item) => ({
                id: item.id,
                text: item.text || '',
                type: item.type || 'scale',
                category: item.category || 'General',
                tags: Array.isArray(item.tags) ? item.tags : [],
                weight: item.weight || 1,
                order: item.sort_order || 0,
                isActive: item.is_active !== false,
            }));
        } catch (error) {
            console.error('Error fetching questions:', error);
            return [];
        }
    },

    getDashboardData: async () => {
        try {
            return await callableClient.invokeWithAuth('getDashboardData', {});
        } catch (error) {
            console.warn('getDashboardData callable failed:', error);
            throw error;
        }
    }
};
