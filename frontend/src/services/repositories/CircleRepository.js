import { auth, db } from '../firebaseConfig';
import {
    doc,
    getDoc
} from 'firebase/firestore';
import { callableClient } from '../api/callableClient';

const canModerate = (role) => ['creator', 'admin', 'moderator'].includes(role);

export const circleRepository = {
    async createCircle({ name, description, category, type, image, visibility }) {
        if (!name?.trim()) throw new Error('Circle name is required.');

        return callableClient.invokeWithAuth('createCircle', {
            name: name.trim(),
            description: description || '',
            category: category || 'General',
            type: type || 'public',
            visibility: visibility || 'visible',
            image: image || null
        });
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

        // Use backend callable for consistency with auth/rules and auditability.
        return callableClient.invokeWithAuth('updateCircle', {
            circleId,
            ...allowedUpdates
        });
    },

    async joinCircle(circleId) {
        if (!circleId) throw new Error('Invalid request.');
        return callableClient.invokeWithAuth('joinCircle', { circleId });
    },

    async leaveCircle(circleId) {
        if (!circleId) throw new Error('Invalid request.');
        return callableClient.invokeWithAuth('leaveCircle', { circleId });
    }
};
