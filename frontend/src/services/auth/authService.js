import { auth } from '../firebaseConfig';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updateProfile,
    onAuthStateChanged
} from 'firebase/auth';

/**
 * Service to handle all Authentication logic
 */
export const authService = {
    /**
     * Login with email and password
     * @param {string} email 
     * @param {string} password 
     * @returns {Promise<{user: User, success: boolean}>}
     */
    login: async (email, password) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            throw error;
        }
    },

    /**
     * Register a new user
     * @param {string} email 
     * @param {string} password 
     * @param {string} name 
     * @returns {Promise<{user: User, success: boolean}>}
     */
    register: async (email, password, name) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update Auth Profile
            await updateProfile(user, { displayName: name });

            return { success: true, user };
        } catch (error) {
            throw error;
        }
    },

    /**
     * Logout the current user
     */
    logout: async () => {
        try {
            await signOut(auth);
            return { success: true };
        } catch (error) {
            throw error;
        }
    },

    /**
     * Subscribe to auth state changes
     * @param {function} callback 
     * @returns {function} unsubscribe
     */
    onAuthStateChanged: (callback) => {
        return onAuthStateChanged(auth, callback);
    }
};
