// IMPORTANT:
// Keep this file CommonJS-only. Metro hoists ESM imports which can cause Daily/WebRTC
// to evaluate before we can patch NativeModules for RN's NativeEventEmitter checks.
console.log('[PERF] index.js: Module evaluating');

require('react-native-get-random-values');

const { LogBox } = require('react-native');

// Keep dev console readable while we maintain compatibility with older dev clients.
LogBox.ignoreLogs([
  '[expo-av]: Expo AV has been deprecated and will be removed in SDK 54.',
  'new NativeEventEmitter() was called with a non-null argument without the required',
  '`new NativeEventEmitter()` was called with a non-null argument without the required `addListener` method.',
  '`new NativeEventEmitter()` was called with a non-null argument without the required `removeListeners` method.'
]);

const { registerRootComponent } = require('expo');
const App = require('./App').default;
registerRootComponent(App);
