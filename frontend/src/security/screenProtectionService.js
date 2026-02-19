import { Alert, AppState, Platform } from 'react-native';
import * as ScreenCapture from 'expo-screen-capture';

const PROTECTION_KEY = 'route-protection';
const WARNING_COOLDOWN_MS = 7000;
const IOS_PROTECTION_THEME = {
  text: 'Circles Health App\nProtected Content',
  textColor: '#FFFFFF',
  backgroundColor: '#032322'
};

class ScreenProtectionService {
  constructor() {
    this.initialized = false;
    this.routeProtected = false;
    this.manualProtectors = new Set();
    this.applied = false;
    this.maskVisible = false;
    this.listeners = new Set();
    this.lastScreenshotWarningAt = 0;
    this.lastRecordingWarningAt = 0;
    this.routeName = '';
    this.appState = AppState.currentState;
    this.screenshotSub = null;
    this.appStateSub = null;
    this.captureSub = null;
    this.applyToken = 0;
    this.recordingDetected = false;
    this.captureProtectionApi = this._loadCaptureProtectionApi();
  }

  _loadCaptureProtectionApi() {
    try {
      const mod = require('react-native-capture-protection');
      const api = mod?.CaptureProtection;
      if (!api?.prevent || !api?.allow) return null;
      return {
        CaptureProtection: api,
        CaptureEventType: mod?.CaptureEventType || {}
      };
    } catch (error) {
      this._log('capture_protection_unavailable', { message: error?.message || String(error) });
      return null;
    }
  }

  _log(message, payload) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log(`[ScreenProtection] ${message}`, payload || '');
    }
  }

  _notify() {
    const snapshot = this.getSnapshot();
    this.listeners.forEach((listener) => {
      try {
        listener(snapshot);
      } catch {
        // ignore listener failures
      }
    });
  }

  _isProtectionActive() {
    return this.routeProtected || this.manualProtectors.size > 0;
  }

  _setMaskVisibilityForCurrentState() {
    this.maskVisible = Boolean(this._isProtectionActive() && (this.appState !== 'active' || this.recordingDetected));
    this._notify();
  }

  _showScreenshotWarning() {
    const now = Date.now();
    if (now - this.lastScreenshotWarningAt < WARNING_COOLDOWN_MS) return;
    this.lastScreenshotWarningAt = now;
    Alert.alert('Privacy Warning', 'Screenshots may contain sensitive information.');
  }

  _showRecordingWarning() {
    const now = Date.now();
    if (now - this.lastRecordingWarningAt < WARNING_COOLDOWN_MS) return;
    this.lastRecordingWarningAt = now;
    Alert.alert('Privacy Mode', 'Screen recording detected. Sensitive content is now hidden.');
  }

  async _syncRecordingState() {
    if (!this._isProtectionActive()) {
      this.recordingDetected = false;
      this._setMaskVisibilityForCurrentState();
      return;
    }

    const captureApi = this.captureProtectionApi?.CaptureProtection;
    if (!captureApi?.isScreenRecording) {
      this.recordingDetected = false;
      this._setMaskVisibilityForCurrentState();
      return;
    }

    try {
      const isRecording = await captureApi.isScreenRecording();
      this.recordingDetected = Boolean(isRecording);
    } catch (error) {
      this._log('recording_state_sync_failed', { message: error?.message || String(error) });
      this.recordingDetected = false;
    }
    this._setMaskVisibilityForCurrentState();
  }

  getSnapshot() {
    return {
      routeProtected: this.routeProtected,
      isProtectionActive: this._isProtectionActive(),
      applied: this.applied,
      maskVisible: this.maskVisible,
      routeName: this.routeName,
      recordingDetected: this.recordingDetected
    };
  }

  subscribe(listener) {
    if (typeof listener !== 'function') {
      return () => {};
    }
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  async initialize() {
    if (this.initialized) return;
    this.initialized = true;
    this._log('initialize');

    this.appStateSub = AppState.addEventListener('change', (nextState) => {
      this.appState = nextState;
      this._log('app_state', { nextState, active: this._isProtectionActive() });
      if (nextState === 'active') {
        this._syncRecordingState().catch(() => {});
        return;
      }
      this.recordingDetected = false;
      this._setMaskVisibilityForCurrentState();
    });

    const captureApi = this.captureProtectionApi?.CaptureProtection;
    const captureEvents = this.captureProtectionApi?.CaptureEventType || {};
    this.captureSub = captureApi?.addListener?.((eventType) => {
      if (!this._isProtectionActive()) return;
      this._log('capture_event', { eventType });

      if (eventType === captureEvents.CAPTURED) {
        this._showScreenshotWarning();
        return;
      }

      if (eventType === captureEvents.RECORDING) {
        this.recordingDetected = true;
        this._setMaskVisibilityForCurrentState();
        this._showRecordingWarning();
        return;
      }

      if (eventType === captureEvents.END_RECORDING) {
        this.recordingDetected = false;
        this._setMaskVisibilityForCurrentState();
      }
    });

    this.screenshotSub = ScreenCapture.addScreenshotListener(() => {
      if (!this._isProtectionActive()) return;
      this._showScreenshotWarning();
    });
  }

  async cleanup() {
    this.routeProtected = false;
    this.routeName = '';
    this.manualProtectors.clear();
    this.recordingDetected = false;

    if (this.applied) {
      try {
        if (this.captureProtectionApi?.CaptureProtection?.allow) {
          await this.captureProtectionApi.CaptureProtection.allow({
            screenshot: true,
            record: true,
            appSwitcher: true
          });
        } else {
          await ScreenCapture.allowScreenCaptureAsync(PROTECTION_KEY);
          if (Platform.OS === 'ios') {
            await ScreenCapture.disableAppSwitcherProtectionAsync();
          }
        }
      } catch {
        // ignore cleanup failures
      } finally {
        this.applied = false;
      }
    }

    if (this.screenshotSub) {
      this.screenshotSub.remove();
      this.screenshotSub = null;
    }

    if (this.captureSub) {
      try {
        this.captureProtectionApi?.CaptureProtection?.removeListener?.(this.captureSub);
      } catch {
        // ignore removal failures
      }
      this.captureSub = null;
    }

    if (this.appStateSub) {
      this.appStateSub.remove();
      this.appStateSub = null;
    }

    this.listeners.clear();
    this.initialized = false;
    this.maskVisible = false;
  }

  async _applyProtection() {
    const token = ++this.applyToken;
    const shouldProtect = this._isProtectionActive();
    this._log('apply', {
      shouldProtect,
      routeName: this.routeName,
      routeProtected: this.routeProtected,
      manualCount: this.manualProtectors.size
    });

    try {
      if (shouldProtect && !this.applied) {
        if (this.captureProtectionApi?.CaptureProtection?.prevent) {
          await this.captureProtectionApi.CaptureProtection.prevent({
            screenshot: true,
            record: Platform.OS === 'ios' ? IOS_PROTECTION_THEME : true,
            appSwitcher: Platform.OS === 'ios' ? IOS_PROTECTION_THEME : true
          });
        } else {
          await ScreenCapture.preventScreenCaptureAsync(PROTECTION_KEY);
          if (Platform.OS === 'ios') {
            await ScreenCapture.enableAppSwitcherProtectionAsync(0.68);
          }
        }
        if (token !== this.applyToken) return;
        this.applied = true;
      } else if (!shouldProtect && this.applied) {
        if (this.captureProtectionApi?.CaptureProtection?.allow) {
          await this.captureProtectionApi.CaptureProtection.allow({
            screenshot: true,
            record: true,
            appSwitcher: true
          });
        } else {
          await ScreenCapture.allowScreenCaptureAsync(PROTECTION_KEY);
          if (Platform.OS === 'ios') {
            await ScreenCapture.disableAppSwitcherProtectionAsync();
          }
        }
        if (token !== this.applyToken) return;
        this.applied = false;
      }
    } catch (error) {
      this._log('apply_failed', { message: error?.message || String(error) });
    } finally {
      await this._syncRecordingState();
    }
  }

  async setRouteProtection(enabled, routeName = '') {
    await this.initialize();
    this.routeProtected = Boolean(enabled);
    this.routeName = String(routeName || '');
    await this._applyProtection();
  }

  async clearRouteProtection() {
    this.routeProtected = false;
    this.routeName = '';
    await this._applyProtection();
  }

  async acquireManualProtection(reason = 'manual') {
    await this.initialize();
    const key = `${reason}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
    this.manualProtectors.add(key);
    await this._applyProtection();
    let released = false;
    return async () => {
      if (released) return;
      released = true;
      this.manualProtectors.delete(key);
      await this._applyProtection();
    };
  }
}

export const screenProtectionService = new ScreenProtectionService();
