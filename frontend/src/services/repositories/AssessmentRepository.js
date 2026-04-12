import { labelFromWellbeingScore, normalizeWellbeingLabel } from '../../utils/wellbeing';
import { supabase } from '../supabase/supabaseClient';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const toValidNumber = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : null);

const LIKERT_SCORE_MAP = {
    'Not at all': 1,
    Rarely: 2,
    Sometimes: 3,
    'Most times': 4,
    Always: 5,
};

const buildThemesFromAnswers = async (answers = {}) => {
    const aggregates = {};
    const entries = Object.entries(answers || {});
    if (!entries.length) return {};

    const { data, error } = await supabase
        .from('assessment_questions')
        .select('text, tags, is_active')
        .eq('is_active', true);
    if (error) throw error;

    const questions = (data || []).map((item) => ({
        text: item.text || '',
        tags: Array.isArray(item.tags) ? item.tags : [],
    }));

    entries.forEach(([questionText, answerValue]) => {
        const question = questions.find((item) => String(item.text).trim() === String(questionText).trim());
        if (!question) return;
        const numericValue = typeof answerValue === 'number' && Number.isFinite(answerValue)
            ? answerValue
            : (LIKERT_SCORE_MAP[String(answerValue || '').trim()] || 3);
        question.tags.forEach((tag) => {
            if (!aggregates[tag]) aggregates[tag] = { total: 0, count: 0 };
            aggregates[tag].total += numericValue;
            aggregates[tag].count += 1;
        });
    });

    return Object.entries(aggregates).reduce((acc, [theme, aggregate]) => {
        if (!aggregate?.count) return acc;
        acc[theme] = Math.round(aggregate.total / aggregate.count);
        return acc;
    }, {});
};

export const assessmentRepository = {
    async submitAssessment({ type, score, answers, mood }) {
        const { data: authData } = await supabase.auth.getUser();
        const uid = authData.user?.id;
        if (!uid) throw new Error('User must be authenticated.');

        const { data: insertedAssessment, error: insertError } = await supabase.from('assessments').insert({
            user_id: uid,
            type,
            score,
            answers: answers || {},
            mood: mood || '',
        }).select('id').single();
        if (insertError) throw insertError;

        const [{ data: profile }, { data: recentAssessments, error: recentError }] = await Promise.all([
            supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
            supabase
                .from('assessments')
                .select('*')
                .eq('user_id', uid)
                .order('created_at', { ascending: false })
                .limit(30),
        ]);
        if (recentError) throw recentError;

        const recentDailyScores = [];
        (recentAssessments || []).forEach((item) => {
            if (item?.type !== 'daily') return;
            const dailyScore = toValidNumber(item?.score);
            if (dailyScore == null) return;
            recentDailyScores.push(dailyScore);
        });

        if (type === 'daily' && recentDailyScores[0] !== score) {
            recentDailyScores.unshift(score);
        }

        const dailyWindow = recentDailyScores.slice(0, 7);
        const dailyAvg7 = dailyWindow.length
            ? Math.round(dailyWindow.reduce((sum, n) => sum + n, 0) / dailyWindow.length)
            : null;

        const existingWeekly = toValidNumber(profile?.stats?.weeklyScore ?? profile?.weekly_score);
        const existingWellbeing = toValidNumber(profile?.wellbeing_score);
        const weeklyAnchor = type === 'questionnaire'
            ? score
            : (existingWeekly ?? existingWellbeing ?? null);

        const dailyDelta = weeklyAnchor != null && dailyAvg7 != null ? dailyAvg7 - weeklyAnchor : 0;
        const dailyAdjustment = weeklyAnchor != null && dailyAvg7 != null
            ? clamp(Math.round(dailyDelta * 0.25), -10, 10)
            : 0;

        const computedWellbeing = weeklyAnchor != null
            ? clamp(Math.round(weeklyAnchor + dailyAdjustment), 0, 100)
            : clamp(Math.round(dailyAvg7 ?? score), 0, 100);

        const statsPatch = {
            ...(profile?.stats || {}),
            overallScore: computedWellbeing,
            lastAssessmentDate: new Date().toISOString(),
            weeklyScore: weeklyAnchor,
            dailyTrendScore: dailyAvg7,
            wellbeingModelVersion: 'v2_weekly_anchor_daily_trend',
            wellbeingComponents: {
                weeklyAnchor,
                dailyAvg7,
                dailyDelta,
                dailyAdjustment,
            },
        };

        if (type === 'questionnaire' && answers && Object.keys(answers).length > 0) {
            const themes = await buildThemesFromAnswers(answers).catch(() => ({}));
            if (themes && Object.keys(themes).length > 0) {
                statsPatch.themes = themes;
            }
        }

        const { error: profileError } = await supabase
            .from('profiles')
            .update({
                wellbeing_score: computedWellbeing,
                wellbeing_label: labelFromWellbeingScore(computedWellbeing),
                stats: statsPatch,
                updated_at: new Date().toISOString(),
            })
            .eq('id', uid);
        if (profileError) throw profileError;

        return { success: true, assessmentId: insertedAssessment?.id || '' };
    },

    async getUserStats() {
        const { data: authData } = await supabase.auth.getUser();
        const uid = authData.user?.id;
        if (!uid) return { score: null, label: 'No data', streak: 0 };

        const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
        if (error || !data) {
            return { score: null, label: 'No data', streak: 0 };
        }

        return {
            score: data.wellbeing_score ?? null,
            label: normalizeWellbeingLabel(data.wellbeing_label, data.wellbeing_score || 0),
            streak: data.streak || 0,
        };
    },

    async getAssessmentHistory(limitCount = 7) {
        const { data: authData } = await supabase.auth.getUser();
        const uid = authData.user?.id;
        if (!uid) return [];

        const { data, error } = await supabase
            .from('assessments')
            .select('*')
            .eq('user_id', uid)
            .order('created_at', { ascending: false })
            .limit(limitCount);
        if (error) throw error;

        return (data || []).map((item) => ({
            id: item.id,
            ...item,
            uid: item.user_id,
            createdAt: item.created_at ? new Date(item.created_at) : null,
        }));
    },
};
