import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme/theme';
import Button from '../components/Button';
import { Ionicons } from '@expo/vector-icons';

import EmailIllustration from '../../assets/images/email_icon.svg';
import { authService } from '../services/auth/authService';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { getDeviceIdentity } from '../services/auth/deviceIdentity';

const VerificationScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { showModal } = useModal();
  const [verifying, setVerifying] = React.useState(false);
  const [resending, setResending] = React.useState(false);

  const handleVerify = async () => {
    if (verifying) return;
    setVerifying(true);
    try {
      const currentUser = authService.getCurrentUser();
      if (currentUser?.emailVerified) {
        showModal({ type: 'success', title: 'Already verified', message: 'Your email is already verified.' });
        return;
      }
      const metadata = await getDeviceIdentity();
      const result = await authService.requestOtp({
        email: currentUser?.email || user?.email,
        purpose: 'EMAIL_VERIFY',
        metadata
      });
      navigation.navigate('OtpVerification', {
        email: currentUser?.email || user?.email,
        purpose: 'EMAIL_VERIFY',
        title: 'Verify Email',
        subtitle: `Enter the code sent to ${currentUser?.email || user?.email}.`,
        initialCooldownSeconds: Number(result?.cooldownSeconds || 60),
        nextAction: { type: 'email_verify' }
      });
    } catch (error) {
      showModal({ type: 'error', title: 'Error', message: error.message || 'Unable to verify email.' });
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resending) return;
    setResending(true);
    try {
      const metadata = await getDeviceIdentity();
      await authService.requestOtp({
        email: user?.email,
        purpose: 'EMAIL_VERIFY',
        metadata
      });
      showModal({ type: 'success', title: 'Code sent', message: 'Check your inbox for the verification code.' });
    } catch (error) {
      showModal({ type: 'error', title: 'Error', message: error.message || 'Unable to resend verification email.' });
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('SignIn')}
      >
        <Ionicons name="chevron-back" size={24} color="black" />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Enter Your Verification Code</Text>

        <View style={[styles.icon, { justifyContent: 'center', alignItems: 'center' }]}>
          <EmailIllustration width={120} height={120} />
        </View>

        <Text style={styles.infoText}>
          We sent a verification link to your email{"\n"}
          <Text style={styles.emailText}>{user?.email || 'your email address'}</Text>
        </Text>

        <Button
          title={verifying ? 'Verifying...' : 'Verify'}
          onPress={handleVerify}
          style={styles.verifyButton}
          loading={verifying}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Didn't receive the email? </Text>
          <TouchableOpacity onPress={handleResend} disabled={resending || verifying}>
            <Text style={styles.resendText}>Resend</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  backButton: {
    padding: SPACING.md,
    marginTop: SPACING.sm,
    width: 60,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
  },
  title: {
    ...TYPOGRAPHY.h2,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  icon: {
    width: 150,
    height: 150,
    marginBottom: SPACING.xl,
  },
  infoText: {
    ...TYPOGRAPHY.caption,
    textAlign: 'center',
    color: '#666',
    lineHeight: 20,
    marginBottom: SPACING.xxl,
  },
  emailText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  verifyButton: {
    width: '100%',
  },
  footer: {
    flexDirection: 'row',
    marginTop: SPACING.xl,
  },
  footerText: {
    ...TYPOGRAPHY.caption,
    color: '#666',
  },
  resendText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});

export default VerificationScreen;
