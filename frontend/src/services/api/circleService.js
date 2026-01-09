import { functions, db } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import { collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';

export const circleService = {
    /**
     * Create a new circle via Backend API
     * @param {string} name 
     * @param {string} description 
     * @param {string} category 
     */
    createCircle: async (name, description, category) => {
        try {
            const createFn = httpsCallable(functions, 'createCircle');
            const result = await createFn({ name, description, category });
            return result.data; // { success: true, circleId: '...' }
        } catch (error) {
            console.error("Error creating circle:", error);
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
    }
};
