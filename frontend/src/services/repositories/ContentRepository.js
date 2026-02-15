import { db } from '../firebaseConfig';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';

const mapDocs = (snapshot) => snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));

export const contentRepository = {
    async getExploreContent(limitCount = 30) {
        const q = query(
            collection(db, 'resources'),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        return mapDocs(snapshot).filter((item) => item.status !== 'rejected' && item.status !== 'suspended');
    },

    async getAffirmations(limitCount = 30) {
        const q = query(
            collection(db, 'affirmations'),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        return mapDocs(snapshot).filter((item) => item.isActive !== false);
    },

    async getKeyChallenges(limitCount = 5) {
        const q = query(
            collection(db, 'challenges'),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        return mapDocs(snapshot).filter((item) => item.isActive !== false);
    }
};
