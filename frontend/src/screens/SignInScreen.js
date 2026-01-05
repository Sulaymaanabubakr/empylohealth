import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../theme/theme';
import Input from '../components/Input';
import Button from '../components/Button';
import { MaterialCommunityIcons, AntDesign, FontAwesome } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const SignInScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Image
            source={require('../assets/images/header_shape.png')}
            style={styles.headerShape}
            resizeMode="stretch"
          />
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Sign In</Text>

          <Input
            label="Email Address"
            placeholder="Enter your email..."
            keyboardType="email-address"
            icon={<MaterialCommunityIcons name="email-outline" size={20} color={COLORS.secondary} />}
          />

          <View style={styles.passwordContainer}>
            <Input
              label="Password"
              placeholder=""
              secureTextEntry
            /* Password field in screenshot has a gray circle as if typing or placeholder */
            />
          </View>

          <Button
            title="Sign in"
            onPress={() => navigation.navigate('ProfileSetup')}
            style={styles.signInButton}
          /* Screenshot shows an arrow in the button */
          />

          <View style={styles.socialContainer}>
            <TouchableOpacity style={styles.socialIcon}>
              <FontAwesome name="facebook" size={24} color="black" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon}>
              <AntDesign name="google" size={24} color="black" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon}>
              <AntDesign name="instagram" size={24} color="black" />
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUpSelection')}>
              <Text style={styles.linkText}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.forgotPassword} onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.linkText}>Forgot Password</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  },
  headerShape: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: '100%',
  },
  logo: {
    width: 100,
    height: 100,
    tintColor: COLORS.white,
    marginTop: 50,
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
  }
});

export default SignInScreen;
