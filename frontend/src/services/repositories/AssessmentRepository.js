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

        await setDoc(
            doc(db, 'users', uid),
            {
                wellbeingScore: score,
                wellbeingLabel: labelFromScore(score),
                lastAssessmentAt: serverTimestamp(),
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
