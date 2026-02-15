import { auth, db, functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import {
    doc,
    getDoc,
    serverTimestamp,
    updateDoc
} from 'firebase/firestore';

const canModerate = (role) => ['creator', 'admin', 'moderator'].includes(role);

export const circleRepository = {
    async createCircle({ name, description, category, type, image, visibility }) {
        if (!name?.trim()) throw new Error('Circle name is required.');

        const fn = httpsCallable(functions, 'createCircle');
        const result = await fn({
            name: name.trim(),
            description: description || '',
            category: category || 'General',
            type: type || 'public',
            visibility: visibility || 'visible',
            image: image || null
        });
        return result.data;
    },

    async updateCircle(circleId, data) {
        const uid = auth.currentUser?.uid;
        if (!uid || !circleId) throw new Error('Invalid request.');

        const memberSnap = await getDoc(doc(db, 'circles', circleId, 'members', uid));
        const role = memberSnap.data()?.role;
        if (!canModerate(role)) {
            throw new Error('Only admins/moderators can update this circle.');
        }

        const allowedUpdates = {
            name: data.name,
            description: data.description,
            category: data.category,
            type: data.type,
            image: data.image,
            photoURL: data.photoURL,
            visibility: data.visibility
        };

        Object.keys(allowedUpdates).forEach((key) => {
            if (allowedUpdates[key] === undefined) {
                delete allowedUpdates[key];
            }
        });

        await updateDoc(doc(db, 'circles', circleId), {
            ...allowedUpdates,
            updatedAt: serverTimestamp()
        });

        return { success: true };
    },

    async joinCircle(circleId) {
        if (!circleId) throw new Error('Invalid request.');
        const fn = httpsCallable(functions, 'joinCircle');
        const result = await fn({ circleId });
        return result.data;
    },

    async leaveCircle(circleId) {
        if (!circleId) throw new Error('Invalid request.');
        const fn = httpsCallable(functions, 'leaveCircle');
        const result = await fn({ circleId });
        return result.data;
    }
};
