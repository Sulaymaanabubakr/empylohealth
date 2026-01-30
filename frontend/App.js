import 'react-native-gesture-handler';
console.log('[PERF] App.js: Module evaluating');
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import Navigation from './src/Navigation';
import { AuthProvider } from './src/context/AuthContext';
import { ToastProvider } from './src/context/ToastContext';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';

import { View, Platform, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  console.log('[PERF] App: Starting...');
  const fontLoadStart = Date.now();
  const splashHidden = useRef(false);
  const authReady = useRef(false);

  const [fontsLoaded] = Font.useFonts({
    'SpaceGrotesk_400Regular': require('./assets/fonts/SpaceGrotesk_400Regular.ttf'),
    'SpaceGrotesk_600SemiBold': require('./assets/fonts/SpaceGrotesk_600SemiBold.ttf'),
    'SpaceGrotesk_700Bold': require('./assets/fonts/SpaceGrotesk_700Bold.ttf'),
    'DMSans_400Regular': require('./assets/fonts/DMSans_400Regular.ttf'),
    'DMSans_500Medium': require('./assets/fonts/DMSans_500Medium.ttf'),
    'DMSans_700Bold': require('./assets/fonts/DMSans_700Bold.ttf'),
  });

  const [error, setError] = useState(null);

  // Hide splash only when BOTH fonts AND auth are ready
  const tryHideSplash = useCallback(async () => {
    if (fontsLoaded && authReady.current && !splashHidden.current) {
      splashHidden.current = true;
      console.log('[PERF] App: Fonts + Auth ready, hiding splash screen');
      await SplashScreen.hideAsync().catch(() => { });
    }
  }, [fontsLoaded]);

  // Called by AuthProvider when auth is fully resolved
  const onAuthReady = useCallback(() => {
    console.log('[PERF] App: Auth ready callback received');
    authReady.current = true;
    tryHideSplash();
  }, [tryHideSplash]);

  // Check if we can hide splash when fonts load
  useEffect(() => {
    if (fontsLoaded) {
      console.log('[PERF] App: Fonts loaded', `${Date.now() - fontLoadStart}ms`);
      tryHideSplash();
    }
  }, [fontsLoaded, tryHideSplash]);

  // Safety timeout in case auth hangs (increase to 5s for slow networks)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!splashHidden.current) {
        console.log('[PERF] App: Forcing Splash Screen hide (timeout)');
        splashHidden.current = true;
        await SplashScreen.hideAsync().catch(() => { });
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#D32F2F', marginBottom: 10 }}>App Crashed</Text>
        <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>{error.toString()}</Text>
      </View>
    );
  }

  try {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ToastProvider>
            <AuthProvider onAuthReady={onAuthReady}>
              <Navigation />
            </AuthProvider>
          </ToastProvider>
          <StatusBar style="auto" />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  } catch (err) {
    console.error('[App] Render error:', err);
    setError(err);
    return null;
  }
}
