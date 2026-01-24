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
    getMultiFactorResolver,
    PhoneAuthProvider,
    PhoneMultiFactorGenerator,
    TotpMultiFactorGenerator,
    GoogleAuthProvider,
    OAuthProvider,
    signInWithCredential,
    User,
    UserCredential,
    MultiFactorResolver,
    MultiFactorInfo,
    multiFactor,
} from 'firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';

}

}

}

/**
 * Service to handle all Authentication logic
 */
export const authService = {
    _pendingMfaResolver: null,
    /**
     * Initialize Google Sign In
     * @param {string} webClientId - From Firebase Console > Auth > Google > Web SDK config
     */
    init: (webClientId() => {
        GoogleSignin.configure({
            webClientId: webClientId || 'YOUR_WEB_CLIENT_ID_FROM_FIREBASE_CONSOLE',
        });
    },

    /**
     * Login with email and password
     * ... (existing)
     */
    login: async (email) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            if (error.code === 'auth/multi-factor-auth-required') {
                const resolver = getMultiFactorResolver(auth, error);
                authService._pendingMfaResolver = resolver;
                return { success: false, mfaRequired: true, hints: resolver.hints };
            }
            throw error;
        }
    },

    /**
     * Register a new user
     * ... (existing)
     */
    register: async (email) => {
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
    confirmPasswordReset: async (oobCode) => {
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
    onAuthStateChanged: (callback) => void) => {
    return onAuthStateChanged(auth, callback);
},

getCurrentUser: (): User | null => auth.currentUser,

    getPendingMfaResolver: (): MultiFactorResolver | null => authService._pendingMfaResolver,
        clearPendingMfaResolver: (() => {
            authService._pendingMfaResolver = null;
        },

            startSmsMfaSignIn: async (hint) => {
                if (!authService._pendingMfaResolver) {
                    throw new Error('No pending MFA resolver.');
                }
                const phoneProvider = new PhoneAuthProvider(auth);
                return phoneProvider.verifyPhoneNumber(
                    { multiFactorHint: hint, session: authService._pendingMfaResolver.session },
                    recaptchaVerifier
                );
            },

                resolveSmsMfaSignIn: async (verificationId) => {
                    if (!authService._pendingMfaResolver) {
                        throw new Error('No pending MFA resolver.');
                    }
                    const credential = PhoneAuthProvider.credential(verificationId, code);
                    const assertion = PhoneMultiFactorGenerator.assertion(credential);
                    const result = await authService._pendingMfaResolver.resolveSignIn(assertion);
                    authService._pendingMfaResolver = null;
                    return result;
                },

                    resolveTotpMfaSignIn: async (hint) => {
                        if (!authService._pendingMfaResolver) {
                            throw new Error('No pending MFA resolver.');
                        }
                        const assertion = TotpMultiFactorGenerator.assertionForSignIn(hint.uid, code);
                        const result = await authService._pendingMfaResolver.resolveSignIn(assertion);
                        authService._pendingMfaResolver = null;
                        return result;
                    },

                        /**
                         * Start MFA enrollment with Phone Number
                         */
                        startPhoneMfaEnrollment: async (phoneNumber) => {
                            const user = auth.currentUser;
                            if (!user) throw new Error('No authenticated user.');

                            const session = await multiFactor(user).getSession();
                            const phoneProvider = new PhoneAuthProvider(auth);
                            return phoneProvider.verifyPhoneNumber(
                                { phoneNumber, session },
                                recaptchaVerifier
                            );
                        },

                            /**
                             * Complete MFA enrollment
                             */
                            finishPhoneMfaEnrollment: async (verificationId) => {
                                const user = auth.currentUser;
                                if (!user) throw new Error('No authenticated user.');

                                const credential = PhoneAuthProvider.credential(verificationId, code);
                                const assertion = PhoneMultiFactorGenerator.assertion(credential);
                                await multiFactor(user).enroll(assertion, displayName);
                            },

                                /**
                                 * Unenroll MFA
                                 */
                                unenrollMfa: async (factor) => {
                                    const user = auth.currentUser;
                                    if (!user) throw new Error('No authenticated user.');

                                    if (typeof factor === 'string') {
                                        // Unenroll by UID
                                        await multiFactor(user).unenroll(factor);
                                    } else {
                                        await multiFactor(user).unenroll(factor);
                                    }
                                },

                                    /**
                                     * Login with Google (Native)
                                     */
                                    loginWithGoogle: async () => {
                                        try {
                                            await GoogleSignin.hasPlayServices();
                                            const response = await GoogleSignin.signIn();
                                            const idToken = (response as any).data?.idToken || (response as any).idToken;

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
                                                    idToken: identityToken!,
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
