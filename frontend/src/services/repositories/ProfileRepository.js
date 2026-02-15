import { db } from '../firebaseConfig';
import { doc, getDoc, onSnapshot, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

const USERS_COLLECTION = 'users';

export const profileRepository = {
    async getProfile(uid) {
        if (!uid) return null;
        const profileRef = doc(db, USERS_COLLECTION, uid);
        const snap = await getDoc(profileRef);
        if (!snap.exists()) return null;
        return { id: snap.id, ...snap.data() };
    },

    subscribeToProfile(uid, callback, onError) {
        if (!uid) return () => {};
        const profileRef = doc(db, USERS_COLLECTION, uid);
        return onSnapshot(
            profileRef,
            { includeMetadataChanges: true },
            (snap) => {
                callback(
                    snap.exists()
                        ? { id: snap.id, ...snap.data(), _fromCache: snap.metadata.fromCache }
                        : null
                );
            },
            onError
        );
    },

    async ensureProfile(uid, seed = {}) {
        if (!uid) throw new Error('uid is required');
        const profileRef = doc(db, USERS_COLLECTION, uid);
        await setDoc(
            profileRef,
            {
                uid,
                onboardingCompleted: false,
                role: seed.role || 'personal',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                ...seed
            },
            { merge: true }
        );
    },

    async updateProfile(uid, updates) {
        if (!uid) throw new Error('uid is required');
        const profileRef = doc(db, USERS_COLLECTION, uid);
        await updateDoc(profileRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
    }
};
