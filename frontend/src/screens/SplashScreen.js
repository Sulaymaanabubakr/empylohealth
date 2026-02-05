import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { COLORS } from '../theme/theme';
import { useAuth } from '../context/AuthContext';

const SplashScreen = ({ navigation }) => {
  const { user, loading } = useAuth();

  useEffect(() => {
    // If auth is still loading, wait.
    if (loading) return;

    // If suddenly user appears (from slow firebase), navigation will switch stack automatically
    // due to Navigation.js logic. But if we are STILL in this unauthenticated stack's Splash:
    if (!user) {
      const timer = setTimeout(() => {
        navigation.replace('Onboarding');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [navigation, user, loading]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/logo_white.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary, // Vibrant primary color
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '60%',
    height: undefined,
    aspectRatio: 1,
  },
});

export default SplashScreen;
