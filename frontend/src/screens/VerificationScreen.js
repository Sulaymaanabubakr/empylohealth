import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme/theme';
import Button from '../components/Button';
import { Ionicons } from '@expo/vector-icons';

import EmailIllustration from '../../assets/images/email_icon.svg';
import { authService } from '../services/auth/authService';
import { useAuth } from '../context/AuthContext';

const VerificationScreen = ({ navigation, route }) => {
  const { user } = useAuth();

  const handleVerify = async () => {
    try {
      const result = await authService.refreshEmailVerification();
      if (result.verified) {
        navigation.navigate('ProfileSetup');
        return;
      }
      Alert.alert('Not verified', 'Please verify your email using the link we sent.');
    } catch (error) {
      Alert.alert('Error', error.message || 'Unable to verify email.');
    }
  };

  const handleResend = async () => {
    try {
      await authService.sendVerificationEmail();
      Alert.alert('Email sent', 'Check your inbox for the verification link.');
    } catch (error) {
      Alert.alert('Error', error.message || 'Unable to resend verification email.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
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
          title="Verify"
          onPress={handleVerify}
          style={styles.verifyButton}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Didn't receive the email? </Text>
          <TouchableOpacity onPress={handleResend}>
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
