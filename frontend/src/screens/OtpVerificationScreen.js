import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useModal } from '../context/ModalContext';
import { authService } from '../services/auth/authService';
import { getDeviceIdentity } from '../services/auth/deviceIdentity';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme/theme';

const OTP_DIGITS = 6;
const OTP_EXPIRY_MINUTES = 10;

const OtpVerificationScreen = ({ navigation, route }) => {
  const { showModal } = useModal();
  const {
    email,
    purpose,
    title,
    subtitle,
    nextAction,
    initialCooldownSeconds = 30,
    resendMetadata = {}
  } = route.params || {};

  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(Number(initialCooldownSeconds || 0));
  const [resendCount, setResendCount] = useState(0);
  const resendLimitReached = resendCount >= 5;

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const sanitizedCode = useMemo(() => String(code || '').replace(/[^0-9]/g, '').slice(0, OTP_DIGITS), [code]);

  useEffect(() => {
    if (sanitizedCode !== code) {
      setCode(sanitizedCode);
    }
  }, [sanitizedCode, code]);

  const handleVerify = async () => {
    if (verifying) return;
    if (!email || !purpose) {
      showModal({ type: 'error', title: 'Missing details', message: 'Unable to verify code right now.' });
      return;
    }
    if (sanitizedCode.length !== OTP_DIGITS) {
      showModal({ type: 'error', title: 'Invalid code', message: 'Enter the 6-digit code sent to your email.' });
      return;
    }

    setVerifying(true);
    try {
      console.log('[AuthUI] OTP verify pressed', { email, purpose, codeLength: sanitizedCode.length, nextAction: nextAction?.type || null });
      const result = await authService.verifyOtp({ email, purpose, code: sanitizedCode });
      if (!result?.verified) {
        const attemptsLeft = Number(result?.attemptsLeft ?? 0);
        const backendMessage = String(result?.message || '').trim();
        showModal({
          type: 'error',
          title: 'Code not valid',
          message: backendMessage || (attemptsLeft > 0
            ? `That code is incorrect. ${attemptsLeft} attempt(s) left.`
            : 'Too many failed attempts. Request a new code.')
        });
        return;
      }

      const verificationToken = String(result?.verificationToken || '');
      if (!verificationToken) {
        showModal({ type: 'error', title: 'Verification failed', message: 'Missing verification token. Try again.' });
        return;
      }

      if (nextAction?.type === 'signup') {
        await authService.registerWithOtp({
          email: nextAction.email,
          password: nextAction.password,
          name: nextAction.name,
          verificationToken
        });
        // Root navigation switches based on auth state; avoid resetting to a route
        // that may not exist in the current stack.
        showModal({
          type: 'success',
          title: 'Account created',
          message: 'Signing you in...'
        });
        return;
      }

      if (nextAction?.type === 'reset_password') {
        navigation.replace('ResetPassword', {
          email,
          verificationToken,
          viaOtp: true
        });
        return;
      }

      if (nextAction?.type === 'change_password') {
        await authService.changePasswordWithOtp({
          newPassword: nextAction.newPassword,
          verificationToken
        });
        showModal({
          type: 'success',
          title: 'Password updated',
          message: 'Your password has been changed successfully.',
          onConfirm: () => navigation.goBack()
        });
        return;
      }

      if (nextAction?.type === 'email_verify') {
        await authService.completeEmailVerificationWithOtp({ verificationToken });
        showModal({
          type: 'success',
          title: 'Email verified',
          message: 'Your email is now verified.',
          onConfirm: () => navigation.goBack()
        });
        return;
      }

      if (nextAction?.type === 'change_email') {
        await authService.changeEmailWithOtp({
          newEmail: nextAction.newEmail,
          verificationToken
        });
        showModal({
          type: 'success',
          title: 'Email changed',
          message: 'Your email has been updated.',
          onConfirm: () => navigation.goBack()
        });
        return;
      }

      showModal({ type: 'success', title: 'Verified', message: 'Code verified successfully.' });
    } catch (error) {
      showModal({ type: 'error', title: 'Verification failed', message: error?.message || 'Unable to verify code.' });
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resending || cooldown > 0 || resendLimitReached) {
      if (resendLimitReached) {
        showModal({ type: 'error', title: 'Try again later', message: 'You have reached the resend limit for now. Please wait before requesting another code.' });
      }
      return;
    }
    if (!email || !purpose) return;

    setResending(true);
    try {
      console.log('[AuthUI] OTP resend pressed', { email, purpose });
      const metadata = {
        ...(await getDeviceIdentity()),
        ...resendMetadata
      };
      const result = await authService.requestOtp({ email, purpose, metadata });
      setCooldown(Number(result?.cooldownSeconds || 30));
      setResendCount((prev) => prev + 1);
      showModal({ type: 'success', title: 'Code sent', message: `A new code has been sent to ${email}.` });
    } catch (error) {
      showModal({ type: 'error', title: 'Resend failed', message: error?.message || 'Unable to resend code.' });
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Image
              source={require('../assets/images/header_shape.png')}
              style={styles.headerShape}
              resizeMode="stretch"
            />
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.title}>{title || 'Verify OTP Code'}</Text>
            <Text style={styles.subtitle}>{subtitle || `Enter the 6-digit code sent to ${email}`}</Text>

            <View style={styles.emailPill}>
              <Ionicons name="mail-outline" size={16} color={COLORS.secondary} />
              <Text style={styles.emailPillText}>{email || 'your email'}</Text>
            </View>

            <View style={styles.verificationCard}>
              <Text style={styles.cardLabel}>Verification Code</Text>
              <TextInput
                value={sanitizedCode}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={OTP_DIGITS}
                style={styles.codeInput}
                placeholder="000000"
                placeholderTextColor="#B8C2CE"
              />
              <Text style={styles.helperText}>
                Use the latest 6-digit code from your inbox. This code expires in {OTP_EXPIRY_MINUTES} minutes.
              </Text>
            </View>

            <TouchableOpacity style={[styles.primaryButton, verifying && styles.buttonDisabled]} onPress={handleVerify} disabled={verifying}>
              {verifying ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.primaryButtonText}>Verify Code</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={[styles.secondaryButton, (resending || cooldown > 0 || resendLimitReached) && styles.buttonDisabled]} onPress={handleResend} disabled={resending || cooldown > 0 || resendLimitReached}>
              <Text style={styles.secondaryButtonText}>
                {resendLimitReached
                  ? 'Try again later'
                  : cooldown > 0
                    ? `Resend in ${cooldown}s`
                    : (resending ? 'Sending...' : 'Resend code')}
              </Text>
            </TouchableOpacity>

            <Text style={styles.footerHint}>
              {resendLimitReached
                ? 'You have requested too many codes. Please try again later.'
                : `Didn't receive anything? Check spam, then request a fresh code.`}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA'
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    height: 180,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerShape: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 14,
    left: 10,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  formContainer: {
    flexGrow: 1,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  title: {
    ...TYPOGRAPHY.h1,
    textAlign: 'center',
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    marginTop: 10,
    textAlign: 'center',
    color: '#64748B',
    lineHeight: 20,
  },
  emailPill: {
    marginTop: SPACING.lg,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#FFF3E4',
    borderWidth: 1,
    borderColor: '#FFE0B5',
  },
  emailPillText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: '#8A5A18',
  },
  verificationCard: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 22,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },
  cardLabel: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
    color: '#334155',
    marginBottom: 14,
  },
  codeInput: {
    height: 64,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D7E0EA',
    backgroundColor: '#F9FBFD',
    paddingHorizontal: 18,
    fontSize: 32,
    letterSpacing: 8,
    textAlign: 'center',
    color: '#0F172A',
    fontFamily: 'SpaceGrotesk_700Bold'
  },
  helperText: {
    marginTop: 12,
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: '#7A8898',
  },
  primaryButton: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'DMSans_700Bold'
  },
  secondaryButton: {
    marginTop: 14,
    borderRadius: 18,
    height: 52,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF'
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 15,
    fontFamily: 'DMSans_700Bold'
  },
  buttonDisabled: {
    opacity: 0.6
  },
  footerHint: {
    marginTop: SPACING.lg,
    textAlign: 'center',
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: '#7A8898',
  }
});

export default OtpVerificationScreen;
