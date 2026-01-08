import { auth } from '../firebaseConfig';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updateProfile,
    onAuthStateChanged,
    GoogleAuthProvider,
    OAuthProvider,
    signInWithCredential
} from 'firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';

/**
 * Service to handle all Authentication logic
 */
export const authService = {
    /**
     * Initialize Google Sign In
     * @param {string} webClientId - From Firebase Console > Auth > Google > Web SDK config
     */
    init: (webClientId) => {
        GoogleSignin.configure({
            webClientId: webClientId || 'YOUR_WEB_CLIENT_ID_FROM_FIREBASE_CONSOLE',
        });
    },

    /**
     * Login with email and password
     * ... (existing)
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
     * ... (existing)
     */
    register: async (email, password, name) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
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
            try {
                await GoogleSignin.signOut();
            } catch (e) {
                // Ignore if not signed in with Google
            }
            return { success: true };
        } catch (error) {
            throw error;
        }
    },

    /**
     * Subscribe to auth state changes
     */
    onAuthStateChanged: (callback) => {
        return onAuthStateChanged(auth, callback);
    },

    /**
     * Login with Google (Native)
     */
    loginWithGoogle: async () => {
        try {
            await GoogleSignin.hasPlayServices();
            const { idToken } = await GoogleSignin.signIn();
            const googleCredential = GoogleAuthProvider.credential(idToken);
            const userCredential = await signInWithCredential(auth, googleCredential);
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error("Google Sign-In Error", error);
            // Handle cancel
            if (error.code === '12501') return { success: false, cancelled: true };
            throw error;
        }
    },

    /**
     * Login with Apple (Native)
     */
    loginWithApple: async () => {
        try {
            const csrf = Math.random().toString(36).substring(2, 15);
            const nonce = Math.random().toString(36).substring(2, 10);
            const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, nonce);

            const appleCredential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
                nonce: hashedNonce
            });

            const { identityToken } = appleCredential;

            const provider = new OAuthProvider('apple.com');
            const credential = provider.credential({
                idToken: identityToken,
                rawNonce: nonce,
            });

            const userCredential = await signInWithCredential(auth, credential);

            // Apple only shares name on first login, update profile if available
            if (appleCredential.fullName) {
                const name = `${appleCredential.fullName.givenName || ''} ${appleCredential.fullName.familyName || ''}`.trim();
                if (name) {
                    await updateProfile(userCredential.user, { displayName: name });
                }
            }

            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error("Apple Sign-In Error", error);
            if (error.code === 'ERR_CANCELED') return { success: false, cancelled: true };
            throw error;
        }
    }
};
