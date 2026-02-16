import { auth, db } from '../firebaseConfig';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';

const mapDocs = (snapshot) => snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
const isAuthPermissionError = (error) => {
    const code = String(error?.code || '');
    const message = String(error?.message || '').toLowerCase();
    return code.includes('permission-denied') || code.includes('unauthenticated') || message.includes('permission') || message.includes('unauthenticated');
};

const getDocsWithAuthRetry = async (q, label) => {
    try {
        return await getDocs(q);
    } catch (error) {
        if (!isAuthPermissionError(error) || !auth.currentUser) throw error;
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
            console.warn(`[FirestoreAuthRetry] ${label} failed; refreshing token and retrying once`, {
                code: error?.code,
                message: error?.message,
                uid: auth.currentUser?.uid || null
            });
        }
        await auth.currentUser.getIdToken(true).catch(() => null);
        return getDocs(q);
    }
};

export const contentRepository = {
    async getExploreContent(limitCount = 30) {
        const q = query(
            collection(db, 'resources'),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocsWithAuthRetry(q, 'resources');
        return mapDocs(snapshot).filter((item) => item.status !== 'rejected' && item.status !== 'suspended');
    },

    async getAffirmations(limitCount = 30) {
        const q = query(
            collection(db, 'affirmations'),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocsWithAuthRetry(q, 'affirmations');
        return mapDocs(snapshot).filter((item) => item.isActive !== false);
    },

    async getKeyChallenges(limitCount = 5) {
        const q = query(
            collection(db, 'challenges'),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocsWithAuthRetry(q, 'challenges');
        return mapDocs(snapshot).filter((item) => item.isActive !== false);
    }
};
