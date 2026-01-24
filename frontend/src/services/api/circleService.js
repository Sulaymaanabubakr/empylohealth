// TypeScript conversion in progress
import { functions, db } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import { collection, query, where, getDocs, orderBy, onSnapshot, doc, getDoc, updateDoc } from 'firebase/firestore';

export const circleService = {
    /**
     * Create a new circle via Backend API
     * @param {string} name 
     * @param {string} description 
     * @param {string} category 
     */
    createCircle: async (name) => {
        try {
            const createFn = httpsCallable(functions, 'createCircle');
            const result = await createFn({ name, description, category, type, image });
            return result.data; // { success: true, circleId: '...' }
        } catch (error) {
            console.error("Error creating circle:", error);
            throw error;
        }
    },

    /**
     * Update circle details
     * @param {string} circleId
     * @param {object} data
     */
    updateCircle: async (circleId) => {
        try {
            const updateFn = httpsCallable(functions, 'updateCircle');
            await updateFn({ circleId, ...data });
            return { success: true };
        } catch (error) {
            console.error("Error updating circle:", error);
            throw error;
        }
    },

    /**
     * Join a circle via Backend API
     * @param {string} circleId 
     */
    joinCircle: async (circleId) => {
        try {
            const joinFn = httpsCallable(functions, 'joinCircle');
            const result = await joinFn({ circleId });
            return result.data;
        } catch (error) {
            console.error("Error joining circle:", error);
            throw error;
        }
    },

    /**
     * Leave a circle via Backend API
     * @param {string} circleId 
     */
    leaveCircle: async (circleId) => {
        try {
            const leaveFn = httpsCallable(functions, 'leaveCircle');
            const result = await leaveFn({ circleId });
            return result.data;
        } catch (error) {
            console.error("Error leaving circle:", error);
            throw error;
        }
    },


    /**
     * Get circles user is a member of (Real-time)
     * @param {string} uid 
     * @param {function} callback 
     * @returns {function} unsubscribe
     */
    subscribeToMyCircles: (uid, callback) => {
        const q = query(
            collection(db, 'circles'),
            where('members', 'array-contains', uid),
            orderBy('createdAt', 'desc')
        );
        return onSnapshot(q, (snapshot) => {
            const circles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(circles);
        }, (error) => {
            console.error("Error subscribing to circles:", error);
            // Don't crash the app, just log. 
            // In a real app, might want to notify user via Toast.
        });
    },

    /**
     * Get all circles for Explore (Simple fetch)
     */
    getAllCircles: async () => {
        try {
            const q = query(collection(db, 'circles'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Error fetching circles:", error);
            throw error;
        }
    },

    /**
     * Get a single circle by ID
     * @param {string} circleId
     */
    /**
     * Manage member status (Promote, Demote, Kick, Ban)
     */
    manageMember: async (circleId) => {
        try {
            const manageFn = httpsCallable(functions, 'manageMember');
            const result = await manageFn({ circleId, targetUid, action });
            return result.data;
        } catch (error) {
            console.error("Error managing member:", error);
            throw error;
        }
    },

    /**
     * Handle join request (Accept/Reject)
     */
    handleJoinRequest: async (circleId) => {
        try {
            const fn = httpsCallable(functions, 'handleJoinRequest');
            await fn({ circleId, targetUid, action });
            return { success: true };
        } catch (error) {
            console.error("Error handling request:", error);
            throw error;
        }
    },

    /**
     * Submit a report for a circle member or content
     */
    resolveCircleReport: async (circleId) => {
        try {
            const fn = httpsCallable(functions, 'resolveCircleReport');
            const result = await fn({ circleId, reportId, action, resolutionNote });
            return result.data;
        } catch (error) {
            console.error("Error resolving report:", error);
            throw error;
        }
    },

    /**
     * Submit a report for a circle member or content
     */
    submitReport: async (circleId) => {
        try {
            const fn = httpsCallable(functions, 'submitReport');
            const result = await fn({ circleId, targetId, targetType, reason, description });
            return result.data;
        } catch (error) {
            console.error("Error submitting report:", error);
            throw error;
        }
    },

    scheduleHuddle: async (circleId) => {
        try {
            const fn = httpsCallable(functions, 'scheduleHuddle');
            const result = await fn({ circleId, title, scheduledAt: scheduledAt.toISOString() });
            return result.data;
        } catch (error) {
            console.error("Error scheduling huddle:", error);
            throw error;
        }
    },

    deleteScheduledHuddle: async (circleId) => {
        try {
            const fn = httpsCallable(functions, 'deleteScheduledHuddle');
            await fn({ circleId, eventId });
            return { success: true };
        } catch (error) {
            console.error("Error deleting scheduled huddle:", error);
            throw error;
        }
    },

    subscribeToScheduledHuddles: (circleId) ) => {
        const q = query(
            collection(db, 'circles', circleId, 'scheduledHuddles'),
            orderBy('scheduledAt', 'asc')
        );
        return onSnapshot(q, (snapshot) => {
            const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Filter out past events client-side or use a where clause if needed
            // For now, returning all, UI can filter
            callback(events);
        });
    },

    /**
     * Subscribe to my member status in a specific circle (Real-time Role)
     */
    subscribeToCircleMember: (circleId) ) => {
        const docRef = doc(db, 'circles', circleId, 'members', uid);
        return onSnapshot(docRef, (doc) => {
            if (doc.exists()) {
                callback(doc.data());
            } else {
                callback(null);
            }
        });
    },



    getCircleById: async (circleId) => {
        try {
            const docRef = doc(db, 'circles', circleId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            }
            return null;
        } catch (error) {
            console.error("Error fetching circle by ID:", error);
            throw error;
        }
    }
};
