import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { circleRepository } from '../repositories/CircleRepository';
import { callableClient } from './callableClient';

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
        return callableClient.invokeWithAuth('manageMember', { circleId, targetUid, action });
    },

    handleJoinRequest: async (circleId, targetUid, action) => {
        return callableClient.invokeWithAuth('handleJoinRequest', { circleId, targetUid, action });
    },

    resolveCircleReport: async (circleId, reportId, action, resolutionNote = '') => {
        return callableClient.invokeWithAuth('resolveCircleReport', { circleId, reportId, action, resolutionNote });
    },

    submitReport: async (circleId, targetId, targetType, reason, description = '') => {
        return callableClient.invokeWithAuth('submitReport', { circleId, targetId, targetType, reason, description });
    },

    scheduleHuddle: async (circleId, title, scheduledAt) => {
        return callableClient.invokeWithAuth('scheduleHuddle', { circleId, title, scheduledAt: scheduledAt.toISOString() });
    },

    deleteScheduledHuddle: async (circleId, eventId) => {
        return callableClient.invokeWithAuth('deleteScheduledHuddle', { circleId, eventId });
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
