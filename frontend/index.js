// IMPORTANT:
// Keep this file CommonJS-only. Metro hoists ESM imports which can cause Daily/WebRTC
// to evaluate before we can patch NativeModules for RN's NativeEventEmitter checks.
console.log('[PERF] index.js: Module evaluating');

require('react-native-get-random-values');

const { NativeModules } = require('react-native');
const { LogBox } = require('react-native');

// Keep dev console readable while we maintain compatibility with older dev clients.
LogBox.ignoreLogs([
  '[expo-av]: Expo AV has been deprecated and will be removed in SDK 54.'
]);

const ensureEventEmitterCompatibility = () => {
  const modules = NativeModules || {};

  const wrapForEventEmitter = (nativeModule) => {
    if (!nativeModule || (typeof nativeModule !== 'object' && typeof nativeModule !== 'function')) return nativeModule;
    const hasAdd = typeof nativeModule.addListener === 'function';
    const hasRemove = typeof nativeModule.removeListeners === 'function';
    if (hasAdd && hasRemove) return nativeModule;

    // TurboModules/HostObjects can be non-extensible; use a Proxy wrapper so NativeEventEmitter
    // sees addListener/removeListeners without mutating the native module object.
    return new Proxy(nativeModule, {
      get(target, prop) {
        if (prop === 'addListener') return () => {};
        if (prop === 'removeListeners') return () => {};
        return Reflect.get(target, prop);
      }
    });
  };

  if (modules.WebRTCModule) modules.WebRTCModule = wrapForEventEmitter(modules.WebRTCModule);
  if (modules.DailyNativeUtils) modules.DailyNativeUtils = wrapForEventEmitter(modules.DailyNativeUtils);

  // Best-effort: wrap any other modules that might be passed into NativeEventEmitter.
  Object.keys(modules).forEach((k) => {
    modules[k] = wrapForEventEmitter(modules[k]);
  });
};

ensureEventEmitterCompatibility();

const { registerRootComponent } = require('expo');
const App = require('./App').default;
registerRootComponent(App);
