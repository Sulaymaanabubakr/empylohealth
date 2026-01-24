import { db } from '../firebaseConfig';
import { doc, setDoc, getDoc, updateDoc, DocumentData } from 'firebase/firestore';

/**
 * Service to handle User data in Firestore
 */
export const userService = {
    /**
     * Get user document from Firestore
     * @param {string} uid 
     * @returns {Promise<object|null>}
     */
    getUserDocument: async (uid) => {
        try {
            const userRef = doc(db, 'users', uid);
            const userDoc = await getDoc(userRef);
            if (userDoc.exists()) {
                return userDoc.data();
            }
            return null;
        } catch (error) {
            console.error("Error getting user document:", error);
            throw error;
        }
    },

    /**
     * Update user profile data
     * @param {string} uid 
     * @param {object} data 
     */
    updateUserDocument: async (uid, data) => {
        try {
            const userRef = doc(db, 'users', uid);
            await updateDoc(userRef, data);
            return { success: true };
        } catch (error) {
            console.error("Error updating user document:", error);
            throw error;
        }
    }
};
