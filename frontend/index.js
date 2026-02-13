import { registerRootComponent } from 'expo';
import 'react-native-get-random-values';
import { NativeModules, LogBox } from 'react-native';
console.log('[PERF] index.js: Module evaluating');

// Some native dependencies used by huddles don't implement listener stubs expected by RN 0.81.
// Add no-op methods to all loaded native modules that miss these methods.
const ensureNativeEventEmitterStubs = () => {
  const modules = NativeModules || {};
  Object.keys(modules).forEach((moduleName) => {
    const nativeModule = modules[moduleName];
    if (!nativeModule || typeof nativeModule !== 'object') return;
    if (typeof nativeModule.addListener !== 'function') {
      nativeModule.addListener = () => {};
    }
    if (typeof nativeModule.removeListeners !== 'function') {
      nativeModule.removeListeners = () => {};
    }
  });
};

ensureNativeEventEmitterStubs();

// Backstop for third-party native packages that still warn in dev.
LogBox.ignoreLogs([
  '`new NativeEventEmitter()` was called with a non-null argument without the required `addListener` method.',
  '`new NativeEventEmitter()` was called with a non-null argument without the required `removeListeners` method.'
]);

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
