import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../theme/theme';
import Button from '../components/Button';

const OnboardingScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('../assets/images/logo_teal.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.welcomeText}>
          Welcome to the Circles{"\n"}Health App by{"\n"}Empylo
        </Text>

        <View style={styles.illustrationContainer}>
          <Image
            source={require('../assets/images/onboarding_illustration.png')}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>

        <View style={styles.bottomContainer}>
          <Button
            title="Get Started"
            onPress={() => navigation.navigate('SignIn')}
            style={styles.button}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.signInLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white, // Clean white background
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: SPACING.xxl,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: SPACING.xl,
    // tintColor: COLORS.primary, // Removed tintColor to show original logo colors
  },
  welcomeText: {
    ...TYPOGRAPHY.h1,
    textAlign: 'center',
    lineHeight: 34,
    color: '#9E9E9E', // Keep gray but ensure it contrasts well on white
    marginBottom: SPACING.xxl,
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  illustration: {
    width: 300,
    height: 300,
    alignSelf: 'center',
  },
  bottomContainer: {
    width: '100%',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
    alignItems: 'center',
  },
  button: {
    width: '100%',
    backgroundColor: COLORS.primary, // Vibrant primary button
    marginTop: SPACING.xl,
  },
  footer: {
    flexDirection: 'row',
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  footerText: {
    ...TYPOGRAPHY.caption,
    color: '#9E9E9E',
  },
  signInLink: {
    ...TYPOGRAPHY.caption,
    color: COLORS.secondary,
    fontWeight: 'bold',
  },
});

export default OnboardingScreen;
