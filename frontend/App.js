import 'react-native-gesture-handler';
console.log('[PERF] App.js: Module evaluating');
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React, { useCallback, useEffect, useRef } from 'react';
import Navigation from './src/Navigation';
import { AuthProvider } from './src/context/AuthContext';
import { ToastProvider } from './src/context/ToastContext';
import { ModalProvider } from './src/context/ModalContext';
import { BrandedSplash } from './src/screens/SplashScreen';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

import { View, Text, TextInput } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { perfLogger } from './src/services/diagnostics/perfLogger';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error) {
    console.error('[App] Render error:', error);
    this.props.onError?.(error);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Keep typography consistent across OEM/device accessibility defaults.
if (Text.defaultProps == null) Text.defaultProps = {};
if (TextInput.defaultProps == null) TextInput.defaultProps = {};
Text.defaultProps.allowFontScaling = false;
TextInput.defaultProps.allowFontScaling = false;
Text.defaultProps.maxFontSizeMultiplier = 1;
TextInput.defaultProps.maxFontSizeMultiplier = 1;

export default function App() {
  console.log('[PERF] App: Starting...');
  perfLogger.mark('app_process_start');
  const fontLoadStart = Date.now();
  const splashHidden = useRef(false);
  const authReady = useRef(false);
  const [authBootReady, setAuthBootReady] = React.useState(false);

  // All fonts (custom + icon) are natively bundled via the expo-font config plugin in app.json.
  // Do NOT use Font.useFonts() — it triggers redundant runtime downloads from Metro that fail.
  const fontsLoaded = true;
  const fontError = null;

  const [errorState, setErrorState] = React.useState(null);

  // On the current dev build, font asset delivery can be flaky.
  // Keep startup deterministic by keying splash dismissal off auth/bootstrap readiness.
  const hideNativeSplash = useCallback(async () => {
    if (!splashHidden.current) {
      splashHidden.current = true;
      console.log('[PERF] App: Auth ready, hiding native splash screen');
      await SplashScreen.hideAsync().catch(() => { });
    }
  }, []);

  // Called by AuthProvider when auth is fully resolved
  const onAuthReady = useCallback(() => {
    console.log('[PERF] App: Auth ready callback received');
    perfLogger.log('time_to_auth_ready', perfLogger.elapsedSince('app_process_start'));
    authReady.current = true;
    setAuthBootReady(true);
    hideNativeSplash();
  }, [hideNativeSplash]);

  // Check if we can hide splash when fonts load
  useEffect(() => {
    if (fontError) {
      console.error('[App] Font load failed', fontError);
    }
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded) {
      console.log('[PERF] App: Fonts and icon fonts loaded', `${Date.now() - fontLoadStart}ms`);
      perfLogger.log('time_to_first_render_fonts_ready', perfLogger.elapsedSince('app_process_start'));
    }
  }, [fontsLoaded]);

  // Safety timeout in case auth hangs (increase to 5s for slow networks)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!splashHidden.current) {
        console.warn('[PERF] App: Splash hide timeout reached before auth was ready');
        setAuthBootReady(true);
        await hideNativeSplash();
      }
    }, 10000); // Increased to 10s for production reliability
    return () => clearTimeout(timer);
  }, [hideNativeSplash]);

  if (errorState) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#D32F2F', marginBottom: 10 }}>App Crashed</Text>
        <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>{errorState.toString()}</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ToastProvider>
          <ModalProvider>
            <AuthProvider onAuthReady={onAuthReady}>
              <ErrorBoundary onError={setErrorState}>
                {authBootReady ? (
                  <Navigation />
                ) : (
                  <BrandedSplash />
                )}
              </ErrorBoundary>
            </AuthProvider>
          </ModalProvider>
        </ToastProvider>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
