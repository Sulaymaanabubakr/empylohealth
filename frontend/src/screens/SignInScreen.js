import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../theme/theme';
import Input from '../components/Input';
import Button from '../components/Button';
import { MaterialCommunityIcons, AntDesign, FontAwesome } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const SignInScreen = ({ navigation }) => {
  const { login, loginWithGoogle, loginWithApple, isAuthenticating } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null); // 'google' or 'apple' or null

  const handleSignIn = async () => {
    if (!email || !password) {
      showToast("Please enter both email and password", 'error');
      return;
    }

    console.log('[AuthUI] SignIn submit pressed', { email: String(email || '').trim().toLowerCase() });
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.mfaRequired) {
      navigation.navigate('TwoFactorSignIn');
    } else if (result.success) {
      // Navigation is handled by RootNavigator/App or we can manually navigate if needed
      // Typically the AuthProvider state change triggers a re-render in Navigation
      // But if standard stack, we might need to navigate.  
      // For now, let's assume manual navigation is okay as a fallback or if the structure relies on it.
      // Ideally, the root navigator switches stacks. 
      // Based on Navigation.js, all screens are in one stack. 
      // So we should navigate to Dashboard.
      // Navigation is handled by RootNavigator/App automatically when user state changes.
    } else {
      showToast(result.error || "Login failed", 'error');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {socialLoading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.secondary} />
        </View>
      ) : null}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.headerShape} />
            <Image
              source={require('../assets/images/logo_teal.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.title}>Sign In</Text>

            <Input
              label="Email Address"
              placeholder="Enter your email..."
              keyboardType="email-address"
              icon={<MaterialCommunityIcons name="email-outline" size={20} color={COLORS.secondary} />}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />

            <View style={styles.passwordContainer}>
              <Input
                label="Password"
                placeholder="Enter your password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <Button
              title={loading ? "Signing in..." : "Sign in"}
              onPress={handleSignIn}
              style={styles.signInButton}
              disabled={loading}
            />

            <Text style={styles.orText}>Or continue with</Text>

            <View style={styles.socialContainer}>
              <TouchableOpacity
                style={[styles.socialIcon, (isAuthenticating || socialLoading) && styles.socialIconDisabled]}
                onPress={async () => {
                  if (isAuthenticating || socialLoading) return;
                  console.log('[AuthUI] Google sign-in pressed on SignIn');
                  setSocialLoading('google');
                  try {
                    const res = await loginWithGoogle();
                    if (!res?.success && !res?.cancelled) {
                      showToast(res?.error || 'Google sign-in failed', 'error');
                    }
                  } finally {
                    setSocialLoading(null);
                  }
                }}
                disabled={isAuthenticating || socialLoading}
              >
                {socialLoading === 'google' ? (
                  <ActivityIndicator size="small" color={COLORS.secondary} />
                ) : (
                  <AntDesign name="google" size={24} color="black" />
                )}
              </TouchableOpacity>
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={[styles.socialIcon, (isAuthenticating || socialLoading) && styles.socialIconDisabled]}
                onPress={async () => {
                  if (isAuthenticating || socialLoading) return;
                  console.log('[AuthUI] Apple sign-in pressed on SignIn');
                  setSocialLoading('apple');
                  try {
                    const res = await loginWithApple();
                    if (!res?.success && !res?.cancelled) {
                      showToast(res?.error || 'Apple sign-in failed', 'error');
                    }
                  } finally {
                    setSocialLoading(null);
                  }
                }}
                  disabled={isAuthenticating || socialLoading}
                >
                  {socialLoading === 'apple' ? (
                    <ActivityIndicator size="small" color={COLORS.secondary} />
                  ) : (
                    <FontAwesome name="apple" size={24} color="black" />
                  )}
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                <Text style={styles.linkText}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotPassword} onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.linkText}>Forgot Password</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  headerShape: {
    position: 'absolute',
    top: -120,
    width: width * 1.55,
    height: 300,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: width,
    borderBottomRightRadius: width,
  },
  logo: {
    width: 72,
    height: 72,
    marginTop: 18,
    tintColor: COLORS.white,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    backgroundColor: '#F8F9FA',
  },
  title: {
    ...TYPOGRAPHY.h1,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  signInButton: {
    marginTop: SPACING.lg,
  },
  orText: {
    textAlign: 'center',
    color: '#666',
    marginTop: SPACING.lg,
    fontSize: 14,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.xl,
    gap: SPACING.lg,
  },
  socialIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  socialIconDisabled: {
    opacity: 0.6,
    backgroundColor: '#F5F5F5',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.xl,
  },
  footerText: {
    ...TYPOGRAPHY.caption,
    color: '#666',
  },
  linkText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.secondary,
    fontWeight: 'bold',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  }
});

export default SignInScreen;
