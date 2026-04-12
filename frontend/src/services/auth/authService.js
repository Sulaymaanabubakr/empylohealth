import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { authApiClient } from './authApiClient';
import { authProfileService } from './authProfileService';
import { supabase } from '../supabase/supabaseClient';

const mapSupabaseUser = (user) => {
    if (!user) return null;
    const metadata = user.user_metadata || {};
    const identities = Array.isArray(user.identities) ? user.identities : [];
    return {
        uid: user.id,
        id: user.id,
        email: user.email || '',
        displayName: metadata.name || metadata.full_name || '',
        photoURL: metadata.avatar_url || metadata.picture || '',
        emailVerified: Boolean(user.email_confirmed_at),
        providerData: identities.map((identity) => ({
            providerId: identity.provider || identity.identity_id || '',
        })),
    };
};

const getCurrentSessionUser = async () => {
    const { data } = await supabase.auth.getUser();
    return mapSupabaseUser(data.user || null);
};

let cachedUser = null;

const waitForSession = async (timeoutMs = 8000) => {
    const start = Date.now();
    while ((Date.now() - start) < timeoutMs) {
        const { data } = await supabase.auth.getSession();
        if (data.session?.access_token && data.session?.user?.id) {
            return data.session;
        }
        await new Promise((resolve) => setTimeout(resolve, 150));
    }
    const { data } = await supabase.auth.getSession();
    return data.session || null;
};

const resolveAuthUserFromResponse = (data) => {
    const sessionUser = data?.session?.user || null;
    const responseUser = data?.user || null;
    if (sessionUser?.id && responseUser?.id && sessionUser.id !== responseUser.id) {
        console.warn('[AuthService] Auth response user mismatch', {
            sessionUid: sessionUser.id,
            responseUid: responseUser.id,
            sessionEmail: sessionUser.email || '',
            responseEmail: responseUser.email || '',
        });
    }
    return sessionUser || responseUser || null;
};

const ensureProfileForUser = async (user, { createIfMissing = false } = {}) => {
    if (!user?.id) return;
    console.log('[AuthService] ensureProfileForUser start', { uid: user.id, createIfMissing });
    const session = await waitForSession();
    if (!session?.access_token) {
        console.log('[AuthService] ensureProfileForUser missing session', { uid: user.id });
        throw new Error('Authenticated session was not established.');
    }
    const { data: existing, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();
    if (fetchError) throw fetchError;
    if (existing?.id) {
        console.log('[AuthService] ensureProfileForUser existing profile found', { uid: user.id });
        return;
    }
    if (!createIfMissing) return;

    const metadata = user.user_metadata || {};
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const payload = {
        id: user.id,
        email: user.email || '',
        name: metadata.name || metadata.full_name || metadata.user_name || '',
        photo_url: metadata.avatar_url || metadata.picture || '',
        role: 'personal',
        onboarding_completed: false,
        timezone,
    };

    const { error: insertError } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
    if (insertError) throw insertError;
    console.log('[AuthService] ensureProfileForUser created profile', { uid: user.id });
};

export const authService = {
    init: (webClientId) => {
        if (!webClientId) return;
        GoogleSignin.configure({
            webClientId,
            offlineAccess: true,
        });
        console.log('[AuthService] Google Sign-In configured');
    },

    login: async (email, password) => {
        console.log('[AuthService] Password login start', { email: String(email || '').trim().toLowerCase() });
        const { data, error } = await supabase.auth.signInWithPassword({
            email: String(email || '').trim().toLowerCase(),
            password: String(password || ''),
        });
        if (error) throw error;
        await ensureProfileForUser(data.user, { createIfMissing: false });
        cachedUser = mapSupabaseUser(data.user);
        console.log('[AuthService] Password login success', { uid: cachedUser?.uid || null });
        return { success: true, user: cachedUser };
    },

    register: async () => {
        throw new Error('Use the OTP registration flow.');
    },

    requestOtp: async ({ email, purpose, metadata = {} }) => {
        console.log('[AuthService] requestOtp start', { email: String(email || '').trim().toLowerCase(), purpose });
        return authApiClient.invokePublic('request-otp', { email, purpose, metadata });
    },

    verifyOtp: async ({ email, purpose, code }) => {
        console.log('[AuthService] verifyOtp start', { email: String(email || '').trim().toLowerCase(), purpose, codeLength: String(code || '').length });
        try {
            return await authApiClient.invokePublic('verify-otp', { email, purpose, code });
        } catch (error) {
            const status = Number(error?.status || 0);
            if (status === 403) {
                return {
                    verified: false,
                    attemptsLeft: Number(error?.details?.attemptsLeft ?? 0),
                    message: String(error?.message || 'OTP is invalid.'),
                };
            }
            throw error;
        }
    },

    registerWithOtp: async ({ email, password, name, verificationToken }) => {
        console.log('[AuthService] registerWithOtp start', { email: String(email || '').trim().toLowerCase() });
        await authApiClient.invokePublic('register-with-otp', {
            email,
            password,
            name,
            verificationToken,
        });
        return authService.login(email, password);
    },

    resetPasswordWithOtp: async ({ email, newPassword, verificationToken }) => {
        console.log('[AuthService] resetPasswordWithOtp start', { email: String(email || '').trim().toLowerCase(), passwordLength: String(newPassword || '').length });
        return authApiClient.invokePublic('reset-password-with-otp', {
            email,
            newPassword,
            verificationToken,
        });
    },

    changePasswordWithOtp: async ({ newPassword, verificationToken }) =>
        authApiClient.invokeWithAuth('change-password-with-otp', {
            newPassword,
            verificationToken,
        }),

    completeEmailVerificationWithOtp: async ({ verificationToken }) =>
        authApiClient.invokeWithAuth('complete-email-verification-with-otp', { verificationToken }),

    changeEmailWithOtp: async ({ newEmail, verificationToken }) =>
        authApiClient.invokeWithAuth('change-email-with-otp', { newEmail, verificationToken }),

    recordLoginDevice: async (payload) =>
        authApiClient.invokeWithAuth('record-login-device', payload || {}),

    deleteAccount: async () =>
        authApiClient.invokeWithAuth('delete-user-account', {}),

    updateAuthProfile: async (displayName, photoURL) => {
        const { data, error } = await supabase.auth.updateUser({
            data: {
                name: displayName || '',
                avatar_url: photoURL || '',
            },
        });
        if (error) throw error;
        cachedUser = mapSupabaseUser(data.user);
        if (cachedUser?.uid) {
            await authProfileService.updateProfile(cachedUser.uid, {
                name: displayName || '',
                photoURL: photoURL || '',
            }).catch(() => {});
        }
        return { success: true };
    },

    logout: async () => {
        await AsyncStorage.multiRemove([
            'pendingWeeklyAssessment',
            'lastWeeklyAssessmentDate',
            'lastWeeklyAssessmentWeekKey',
            'lastDailyCheckInDate',
        ]);
        await supabase.auth.signOut();
        cachedUser = null;
        try {
            await GoogleSignin.signOut();
        } catch {
            // Ignore provider sign-out issues.
        }
        return { success: true };
    },

    sendPasswordReset: async () => {
        throw new Error('Use the OTP password reset flow.');
    },

    confirmPasswordReset: async () => {
        throw new Error('Email-link password reset is not used in this build.');
    },

    refreshEmailVerification: async () => {
        cachedUser = await getCurrentSessionUser();
        return { verified: Boolean(cachedUser?.emailVerified) };
    },

    sendVerificationEmail: async () => {
        throw new Error('Use the OTP verification flow.');
    },

    onAuthStateChanged: (callback) => {
        supabase.auth.getSession().then(({ data }) => {
            cachedUser = mapSupabaseUser(data.session?.user || null);
            console.log('[AuthService] onAuthStateChanged initial', { uid: cachedUser?.uid || null });
            callback(cachedUser);
        });

        const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
            cachedUser = mapSupabaseUser(session?.user || null);
            console.log('[AuthService] onAuthStateChanged event', { event: _event, uid: cachedUser?.uid || null });
            callback(cachedUser);
        });
        return () => subscription.subscription.unsubscribe();
    },

    getCurrentUser: () => cachedUser,

    refreshCurrentUser: async () => {
        cachedUser = await getCurrentSessionUser();
        return cachedUser;
    },

    loginWithGoogle: async () => {
        try {
            console.log('[AuthService] Google sign-in start');
            await GoogleSignin.hasPlayServices();
            const response = await GoogleSignin.signIn();
            const idToken = response?.data?.idToken || response?.idToken || null;
            let accessToken = response?.data?.accessToken || response?.accessToken || null;
            if (!accessToken) {
                try {
                    const tokens = await GoogleSignin.getTokens();
                    accessToken = tokens?.accessToken || null;
                } catch (tokenError) {
                    console.warn('[AuthService] Google sign-in access token lookup failed', {
                        message: String(tokenError?.message || tokenError || ''),
                    });
                }
            }
            console.log('[AuthService] Google tokens received', {
                hasIdToken: Boolean(idToken),
                hasAccessToken: Boolean(accessToken),
            });
            if (!idToken) {
                console.log('[AuthService] Google sign-in missing idToken');
                return { success: false, cancelled: true, message: 'Google Sign-In did not return an ID token.' };
            }

            const { data, error } = await supabase.auth.signInWithIdToken({
                provider: 'google',
                token: idToken,
                access_token: accessToken || undefined,
            });
            if (error) throw error;
            const authUser = resolveAuthUserFromResponse(data);
            console.log('[AuthService] Google sign-in auth response', {
                responseUid: data?.user?.id || null,
                sessionUid: data?.session?.user?.id || null,
                responseEmail: data?.user?.email || '',
                sessionEmail: data?.session?.user?.email || '',
            });
            await ensureProfileForUser(authUser, { createIfMissing: true });
            cachedUser = mapSupabaseUser(authUser);
            const activeSession = await waitForSession(3000);
            console.log('[AuthService] Google sign-in success', {
                uid: cachedUser?.uid || null,
                email: cachedUser?.email || '',
                activeSessionUid: activeSession?.user?.id || null,
                activeSessionEmail: activeSession?.user?.email || '',
            });
            return { success: true, user: cachedUser };
        } catch (error) {
            const code = String(error?.code || '');
            const message = String(error?.message || '');
            console.log('[AuthService] Google sign-in failed', { code, message });
            const isCancelled = code === '12501' || code === 'SIGN_IN_CANCELLED' || message.toLowerCase().includes('cancel');
            if (isCancelled) return { success: false, cancelled: true };
            return { success: false, error: message || 'Google Sign-In failed.' };
        }
    },

    loginWithApple: async () => {
        try {
            console.log('[AuthService] Apple sign-in start');
            if (Platform.OS !== 'ios') {
                return { success: false, cancelled: true, message: 'Apple Sign-In is only available on iOS.' };
            }
            const isAvailable = await AppleAuthentication.isAvailableAsync();
            if (!isAvailable) throw new Error('Apple Sign-In is not available on this device/build.');

            const rawNonce = Math.random().toString(36).slice(2);
            const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
                nonce: hashedNonce,
            });

            if (!credential.identityToken) {
                return { success: false, cancelled: true, message: 'Apple Sign-In did not return an identity token.' };
            }

            const { data, error } = await supabase.auth.signInWithIdToken({
                provider: 'apple',
                token: credential.identityToken,
                nonce: rawNonce,
            });
            if (error) throw error;
            const authUser = resolveAuthUserFromResponse(data);
            await ensureProfileForUser(authUser, { createIfMissing: true });
            cachedUser = mapSupabaseUser(authUser);
            console.log('[AuthService] Apple sign-in success', { uid: cachedUser?.uid || null, email: cachedUser?.email || '' });
            return { success: true, user: cachedUser };
        } catch (error) {
            const message = String(error?.message || '');
            console.log('[AuthService] Apple sign-in failed', { message });
            if (message.toLowerCase().includes('cancel')) return { success: false, cancelled: true };
            return { success: false, error: message || 'Apple Sign-In failed.' };
        }
    },

    reauthenticateWithPassword: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({
            email: String(email || '').trim().toLowerCase(),
            password: String(password || ''),
        });
        if (error) throw error;
        cachedUser = await getCurrentSessionUser();
        return { success: true };
    },
};
