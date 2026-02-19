import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useModal } from '../context/ModalContext';
import { authService } from '../services/auth/authService';
import { getDeviceIdentity } from '../services/auth/deviceIdentity';

const OTP_DIGITS = 6;

const OtpVerificationScreen = ({ navigation, route }) => {
  const { showModal } = useModal();
  const {
    email,
    purpose,
    title,
    subtitle,
    nextAction,
    initialCooldownSeconds = 60,
    resendMetadata = {}
  } = route.params || {};

  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(Number(initialCooldownSeconds || 0));

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
      const result = await authService.verifyOtp({ email, purpose, code: sanitizedCode });
      if (!result?.verified) {
        const attemptsLeft = Number(result?.attemptsLeft ?? 0);
        showModal({
          type: 'error',
          title: 'Code not valid',
          message: attemptsLeft > 0
            ? `That code is incorrect. ${attemptsLeft} attempt(s) left.`
            : 'Too many failed attempts. Request a new code.'
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
        navigation.reset({ index: 0, routes: [{ name: 'ProfileSetup' }] });
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
    if (resending || cooldown > 0) return;
    if (!email || !purpose) return;

    setResending(true);
    try {
      const metadata = {
        ...(await getDeviceIdentity()),
        ...resendMetadata
      };
      const result = await authService.requestOtp({ email, purpose, metadata });
      setCooldown(Number(result?.cooldownSeconds || 60));
      showModal({ type: 'success', title: 'Code sent', message: `A new code has been sent to ${email}.` });
    } catch (error) {
      showModal({ type: 'error', title: 'Resend failed', message: error?.message || 'Unable to resend code.' });
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={24} color="#111827" />
      </TouchableOpacity>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{title || 'Verify OTP Code'}</Text>
          <Text style={styles.subtitle}>{subtitle || `Enter the 6-digit code sent to ${email}`}</Text>

          <TextInput
            value={sanitizedCode}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={OTP_DIGITS}
            style={styles.codeInput}
            placeholder="000000"
            placeholderTextColor="#94A3B8"
          />

          <TouchableOpacity style={[styles.primaryButton, verifying && styles.buttonDisabled]} onPress={handleVerify} disabled={verifying}>
            <Text style={styles.primaryButtonText}>{verifying ? 'Verifying...' : 'Verify Code'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.secondaryButton, (resending || cooldown > 0) && styles.buttonDisabled]} onPress={handleResend} disabled={resending || cooldown > 0}>
            <Text style={styles.secondaryButtonText}>
              {cooldown > 0 ? `Resend in ${cooldown}s` : (resending ? 'Sending...' : 'Resend code')}
            </Text>
          </TouchableOpacity>
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
  backButton: {
    paddingHorizontal: 16,
    paddingTop: 10,
    width: 56
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A'
  },
  subtitle: {
    marginTop: 10,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20
  },
  codeInput: {
    marginTop: 28,
    height: 58,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    fontSize: 30,
    letterSpacing: 8,
    textAlign: 'center',
    color: '#0F172A',
    fontWeight: '700'
  },
  primaryButton: {
    marginTop: 24,
    backgroundColor: '#00A99D',
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center'
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800'
  },
  secondaryButton: {
    marginTop: 12,
    borderRadius: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF'
  },
  secondaryButtonText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700'
  },
  buttonDisabled: {
    opacity: 0.6
  }
});

export default OtpVerificationScreen;
