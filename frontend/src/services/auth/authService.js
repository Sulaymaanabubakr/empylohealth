import { auth } from '../firebaseConfig';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updateProfile,
    onAuthStateChanged,
    sendPasswordResetEmail,
    confirmPasswordReset,
    sendEmailVerification,
    reload,
    GoogleAuthProvider,
    OAuthProvider,
    signInWithCredential,
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
        try {
            if (!webClientId) {
                console.warn('[AuthService] Google Sign-In web client ID not provided; skipping configure.');
                return;
            }
            GoogleSignin.configure({ webClientId });
            console.log('[AuthService] Google Sign-In configured successfully');
        } catch (error) {
            console.warn('[AuthService] Google Sign-In configuration failed:', error.message);
            // Non-fatal - app can still run without Google Sign-In
        }
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
            await sendEmailVerification(user);
            return { success: true, user };
        } catch (error) {
            throw error;
        }
    },

    /**
     * Update Firebase Auth profile
     */
    updateAuthProfile: async (displayName, photoURL) => {
        const user = auth.currentUser;
        if (!user) throw new Error('No authenticated user.');
        await updateProfile(user, { displayName, photoURL });
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
     * Send password reset email
     */
    sendPasswordReset: async (email) => {
        try {
            await sendPasswordResetEmail(auth, email);
            return { success: true };
        } catch (error) {
            throw error;
        }
    },

    /**
     * Confirm password reset using OOB code
     */
    confirmPasswordReset: async (oobCode, newPassword) => {
        try {
            await confirmPasswordReset(auth, oobCode, newPassword);
            return { success: true };
        } catch (error) {
            throw error;
        }
    },

    /**
     * Refresh and check if email is verified
     */
    refreshEmailVerification: async () => {
        if (!auth.currentUser) {
            console.log('[AuthService] No current user for verification refresh');
            return { verified: false };
        }
        console.log('[AuthService] Refreshing email verification for:', auth.currentUser.email);
        await reload(auth.currentUser);
        console.log('[AuthService] Email verified status after reload:', auth.currentUser.emailVerified);
        return { verified: auth.currentUser.emailVerified };
    },

    sendVerificationEmail: async () => {
        if (!auth.currentUser) {
            throw new Error('No authenticated user.');
        }
        await sendEmailVerification(auth.currentUser);
        return { success: true };
    },

    /**
     * Subscribe to auth state changes
     */
    onAuthStateChanged: (callback) => {
        return onAuthStateChanged(auth, callback);
    },

    getCurrentUser: () => auth.currentUser,

    /**
     * Login with Google (Native)
     */
    loginWithGoogle: async () => {
        try {
            await GoogleSignin.hasPlayServices();
            const response = await GoogleSignin.signIn();
            const idToken = (response).data?.idToken || (response).idToken;

            if (!idToken) throw new Error('No ID token found');

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
