import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const AppLockScreen = ({
  user,
  unlocking,
  passwordUnlocking,
  unlockPassword,
  setUnlockPassword,
  unlockError,
  canUsePasswordFallback,
  onUnlockBiometric,
  onUnlockPassword,
  promptEpoch
}) => {
  useEffect(() => {
    onUnlockBiometric?.();
  }, [onUnlockBiometric, promptEpoch]);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#033D3A', '#056761', '#012625']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bg}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.content}
      >
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {String(user?.displayName || user?.email || 'U')
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .map((p) => p[0] || '')
                .join('')
                .toUpperCase() || 'U'}
            </Text>
          </View>

          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Unlock Circles to continue</Text>

          <TouchableOpacity
            style={styles.biometricButton}
            onPress={onUnlockBiometric}
            disabled={unlocking || passwordUnlocking}
          >
            <Ionicons name="finger-print" size={18} color="#FFFFFF" />
            <Text style={styles.biometricButtonText}>
              {unlocking ? 'Verifying...' : 'Use biometrics'}
            </Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          {canUsePasswordFallback ? (
            <>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter account password"
                placeholderTextColor="#9CA3AF"
                value={unlockPassword}
                onChangeText={setUnlockPassword}
                secureTextEntry
                editable={!unlocking && !passwordUnlocking}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.passwordButton}
                onPress={onUnlockPassword}
                disabled={unlocking || passwordUnlocking}
              >
                <Text style={styles.passwordButtonText}>
                  {passwordUnlocking ? 'Checking...' : 'Unlock with password'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.hintText}>
              Use biometrics or your device passcode to unlock.
            </Text>
          )}

          {!!unlockError && <Text style={styles.error}>{unlockError}</Text>}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#032826' },
  bg: { ...StyleSheet.absoluteFillObject },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 18,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CCFBF1'
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0B1324'
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0B1324',
    marginTop: 14
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#475569',
    textAlign: 'center'
  },
  biometricButton: {
    marginTop: 18,
    backgroundColor: '#00A99D',
    borderRadius: 14,
    width: '100%',
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  biometricButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800'
  },
  dividerRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%'
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB'
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '700'
  },
  passwordInput: {
    width: '100%',
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginTop: 12,
    color: '#0F172A'
  },
  passwordButton: {
    width: '100%',
    minHeight: 42,
    borderWidth: 1,
    borderColor: '#00A99D',
    borderRadius: 12,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDFA'
  },
  passwordButtonText: {
    color: '#0F766E',
    fontSize: 14,
    fontWeight: '700'
  },
  hintText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center'
  },
  error: {
    marginTop: 12,
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center'
  }
});

export default AppLockScreen;

