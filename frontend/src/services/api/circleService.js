import { functions, db } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import { collection, query, where, getDocs, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { circleRepository } from '../repositories/CircleRepository';

export const circleService = {
    createCircle: async (name, description = '', category = 'General', type = 'public', image = null, visibility = 'visible') => {
        return circleRepository.createCircle({ name, description, category, type, image, visibility });
    },

    updateCircle: async (circleId, data) => {
        return circleRepository.updateCircle(circleId, data);
    },

    joinCircle: async (circleId) => {
        return circleRepository.joinCircle(circleId);
    },

    leaveCircle: async (circleId) => {
        return circleRepository.leaveCircle(circleId);
    },

    subscribeToMyCircles: (uid, callback) => {
        const q = query(
            collection(db, 'circles'),
            where('members', 'array-contains', uid),
            orderBy('createdAt', 'desc')
        );
        return onSnapshot(q, (snapshot) => {
            const circles = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
            callback(circles);
        }, (error) => {
            console.error('Error subscribing to circles:', error);
        });
    },

    getAllCircles: async () => {
        const q = query(collection(db, 'circles'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    },

    // Privileged operations are still Functions-backed.
    manageMember: async (circleId, targetUid, action) => {
        const manageFn = httpsCallable(functions, 'manageMember');
        const result = await manageFn({ circleId, targetUid, action });
        return result.data;
    },

    handleJoinRequest: async (circleId, targetUid, action) => {
        const fn = httpsCallable(functions, 'handleJoinRequest');
        await fn({ circleId, targetUid, action });
        return { success: true };
    },

    resolveCircleReport: async (circleId, reportId, action, resolutionNote = '') => {
        const fn = httpsCallable(functions, 'resolveCircleReport');
        const result = await fn({ circleId, reportId, action, resolutionNote });
        return result.data;
    },

    submitReport: async (circleId, targetId, targetType, reason, description = '') => {
        const fn = httpsCallable(functions, 'submitReport');
        const result = await fn({ circleId, targetId, targetType, reason, description });
        return result.data;
    },

    scheduleHuddle: async (circleId, title, scheduledAt) => {
        const fn = httpsCallable(functions, 'scheduleHuddle');
        const result = await fn({ circleId, title, scheduledAt: scheduledAt.toISOString() });
        return result.data;
    },

    deleteScheduledHuddle: async (circleId, eventId) => {
        const fn = httpsCallable(functions, 'deleteScheduledHuddle');
        await fn({ circleId, eventId });
        return { success: true };
    },

    subscribeToScheduledHuddles: (circleId, callback) => {
        const q = query(
            collection(db, 'circles', circleId, 'scheduledHuddles'),
            orderBy('scheduledAt', 'asc')
        );
        return onSnapshot(q, (snapshot) => {
            const events = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
            callback(events);
        });
    },

    subscribeToCircleMember: (circleId, uid, callback) => {
        const docRef = doc(db, 'circles', circleId, 'members', uid);
        return onSnapshot(docRef, (docSnap) => {
            callback(docSnap.exists() ? docSnap.data() : null);
        });
    },

    getCircleById: async (circleId) => {
        const docRef = doc(db, 'circles', circleId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return null;
        return { id: docSnap.id, ...docSnap.data() };
    }
};
