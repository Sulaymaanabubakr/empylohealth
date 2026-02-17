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

const labelFromScore = (score = 0) => {
    if (score >= 80) return 'Thriving';
    if (score >= 60) return 'Doing Well';
    if (score >= 40) return 'Okay';
    if (score >= 20) return 'Struggling';
    return 'Needs Attention';
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const toValidNumber = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : null);

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

        await setDoc(
            userRef,
            {
                wellbeingScore: computedWellbeing,
                wellbeingLabel: labelFromScore(computedWellbeing),
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
                'stats.overallScore': computedWellbeing,
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
            label: userData.wellbeingLabel || labelFromScore(userData.wellbeingScore || 0),
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
