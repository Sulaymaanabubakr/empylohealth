import { auth, db } from '../firebaseConfig';
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    where
} from 'firebase/firestore';
import { labelFromWellbeingScore, normalizeWellbeingLabel } from '../../utils/wellbeing';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const toValidNumber = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : null);

const LIKERT_SCORE_MAP = {
    'Not at all': 1,
    Rarely: 2,
    Sometimes: 3,
    'Most times': 4,
    Always: 5
};

const buildThemesFromAnswers = async (answers = {}) => {
    const aggregates = {};
    const normalizedAnswers = Object.entries(answers || {});
    if (!normalizedAnswers.length) return {};

    const questionsSnap = await getDocs(query(
        collection(db, 'assessment_questions'),
        where('isActive', '==', true)
    ));
    const questions = questionsSnap.docs.map((docSnap) => docSnap.data() || {});

    normalizedAnswers.forEach(([questionText, answerValue]) => {
        const question = questions.find((q) => String(q?.text || '').trim() === String(questionText || '').trim());
        if (!question) return;
        const tags = Array.isArray(question?.tags) ? question.tags : [];
        if (!tags.length) return;

        let numericValue = 3;
        if (typeof answerValue === 'number' && Number.isFinite(answerValue)) {
            numericValue = answerValue;
        } else {
            numericValue = LIKERT_SCORE_MAP[String(answerValue || '').trim()] || 3;
        }

        tags.forEach((tag) => {
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
        const uid = auth.currentUser?.uid;
        if (!uid) throw new Error('User must be authenticated.');

        await addDoc(collection(db, 'assessments'), {
            uid,
            type,
            score,
            answers: answers || {},
            mood: mood || '',
            createdAt: serverTimestamp()
        });

        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.exists() ? userSnap.data() : {};

        const latestAssessmentsSnap = await getDocs(query(
            collection(db, 'assessments'),
            where('uid', '==', uid),
            orderBy('createdAt', 'desc'),
            limit(30)
        ));

        const recentDailyScores = [];
        latestAssessmentsSnap.forEach((docSnap) => {
            const data = docSnap.data();
            if (data?.type !== 'daily') return;
            const dailyScore = toValidNumber(data?.score);
            if (dailyScore == null) return;
            recentDailyScores.push(dailyScore);
        });

        // Ensure the latest daily submission is reflected immediately.
        if (type === 'daily' && recentDailyScores[0] !== score) {
            recentDailyScores.unshift(score);
        }

        const dailyWindow = recentDailyScores.slice(0, 7);
        const dailyAvg7 = dailyWindow.length
            ? Math.round(dailyWindow.reduce((sum, n) => sum + n, 0) / dailyWindow.length)
            : null;

        const existingWeekly = toValidNumber(userData?.weeklyScore);
        const existingWellbeing = toValidNumber(userData?.wellbeingScore);
        const weeklyAnchor = type === 'questionnaire'
            ? score
            : (existingWeekly ?? existingWellbeing ?? null);

        const dailyDelta = weeklyAnchor != null && dailyAvg7 != null
            ? dailyAvg7 - weeklyAnchor
            : 0;
        const dailyAdjustment = weeklyAnchor != null && dailyAvg7 != null
            ? clamp(Math.round(dailyDelta * 0.25), -10, 10)
            : 0;

        const computedWellbeing = weeklyAnchor != null
            ? clamp(Math.round(weeklyAnchor + dailyAdjustment), 0, 100)
            : clamp(Math.round(dailyAvg7 ?? score), 0, 100);

        const statsPatch = {
            overallScore: computedWellbeing,
            lastAssessmentDate: serverTimestamp()
        };
        if (type === 'questionnaire' && answers && Object.keys(answers).length > 0) {
            const themes = await buildThemesFromAnswers(answers).catch(() => ({}));
            if (themes && Object.keys(themes).length > 0) {
                statsPatch.themes = themes;
            }
        }

        await setDoc(
            userRef,
            {
                wellbeingScore: computedWellbeing,
                wellbeingLabel: labelFromWellbeingScore(computedWellbeing),
                weeklyScore: weeklyAnchor,
                dailyTrendScore: dailyAvg7,
                wellbeingModelVersion: 'v2_weekly_anchor_daily_trend',
                wellbeingComponents: {
                    weeklyAnchor,
                    dailyAvg7,
                    dailyDelta,
                    dailyAdjustment
                },
                lastAssessmentAt: serverTimestamp(),
                stats: statsPatch,
                updatedAt: serverTimestamp()
            },
            { merge: true }
        );

        return { success: true };
    },

    async getUserStats() {
        const uid = auth.currentUser?.uid;
        if (!uid) return { score: null, label: 'No data', streak: 0 };

        const userSnap = await getDoc(doc(db, 'users', uid));
        if (!userSnap.exists()) {
            return { score: null, label: 'No data', streak: 0 };
        }

        const userData = userSnap.data();
        return {
            score: userData.wellbeingScore ?? null,
            label: normalizeWellbeingLabel(userData.wellbeingLabel, userData.wellbeingScore || 0),
            streak: userData.streak || 0
        };
    },

    async getAssessmentHistory(limitCount = 7) {
        const uid = auth.currentUser?.uid;
        if (!uid) return [];

        const q = query(
            collection(db, 'assessments'),
            where('uid', '==', uid),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
            createdAt: docSnap.data().createdAt?.toDate?.() || null
        }));
    }
};
