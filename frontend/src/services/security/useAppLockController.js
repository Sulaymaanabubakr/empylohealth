import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { biometricPrefs } from './biometricPrefs';

let LocalAuthentication = null;
try {
  LocalAuthentication = require('expo-local-authentication');
} catch {
  LocalAuthentication = null;
}

const DEFAULT_THRESHOLD_SECONDS = 60;

const debugLog = (...args) => {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.log('[AppLock]', ...args);
  }
};

const parseThresholdSeconds = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_THRESHOLD_SECONDS;
  return Math.min(3600, Math.max(15, Math.floor(n)));
};

export const useAppLockController = ({ user, userData, routeTarget }) => {
  const [deviceBiometricEnabled, setDeviceBiometricEnabled] = useState(false);
  const [lastBackgroundAt, setLastBackgroundAt] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [unlockInProgress, setUnlockInProgress] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [unlockError, setUnlockError] = useState('');
  const [promptEpoch, setPromptEpoch] = useState(0);
  const [privacyCoverVisible, setPrivacyCoverVisible] = useState(false);

  const appStateRef = useRef(AppState.currentState);
  const unlockInFlightRef = useRef(false);

  // Pessimistic lock policy:
  // if device lock is enabled and account setting is not explicitly false yet,
  // keep app locked to avoid exposing protected screens during profile-load races.
  const remoteBiometricSetting = userData?.settings?.biometrics;
  const accountLockEnabled = routeTarget !== 'UNAUTH' && remoteBiometricSetting !== false;
  const thresholdSeconds = parseThresholdSeconds(userData?.settings?.appLockThresholdSeconds);
  const lockEnabled = accountLockEnabled && deviceBiometricEnabled;

  const requestLock = useCallback((reason = 'manual') => {
    debugLog('requestLock', { reason });
    setIsLocked(true);
    setUnlockError('');
    setPromptEpoch((prev) => prev + 1);
  }, []);

  const forceUnlock = useCallback((reason = 'fallback') => {
    debugLog('forceUnlock', { reason });
    setIsLocked(false);
    setUnlockError('');
    setPrivacyCoverVisible(false);
  }, []);

  const markBackgroundTimestamp = useCallback(async (timestampMs) => {
    if (!user?.uid) return;
    setLastBackgroundAt(timestampMs);
    await biometricPrefs.setLastBackgroundAt(user.uid, timestampMs).catch(() => {});
    debugLog('setLastBackgroundAt', { timestampMs });
  }, [user?.uid]);

  const tryBiometricUnlock = useCallback(async () => {
    if (!lockEnabled) {
      setIsLocked(false);
      setUnlockError('');
      return true;
    }
    if (!LocalAuthentication) {
      setUnlockError('Biometric module unavailable in this build.');
      return false;
    }
    if (unlockInFlightRef.current) return false;

    unlockInFlightRef.current = true;
    setUnlockInProgress(true);
    setUnlockError('');
    debugLog('biometricPromptStart');
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Circles',
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use device passcode',
        disableDeviceFallback: false
      });

      if (result?.success) {
        debugLog('biometricPromptSuccess');
        setIsLocked(false);
        setUnlockError('');
        return true;
      }

      const reason = String(result?.error || 'cancelled');
      debugLog('biometricPromptFailed', { reason });
      setUnlockError(reason === 'user_cancel' ? 'Unlock cancelled.' : 'Biometric verification failed.');
      setIsLocked(true);
      return false;
    } catch (error) {
      debugLog('biometricPromptError', { message: error?.message || String(error) });
      setUnlockError('Could not verify biometrics. Try again.');
      setIsLocked(true);
      return false;
    } finally {
      setUnlockInProgress(false);
      unlockInFlightRef.current = false;
    }
  }, [lockEnabled]);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (!user?.uid || routeTarget === 'UNAUTH') {
        if (!mounted) return;
        setDeviceBiometricEnabled(false);
        setLastBackgroundAt(0);
        setIsLocked(false);
        setUnlockError('');
        setPrivacyCoverVisible(false);
        setInitializing(false);
        return;
      }

      setInitializing(true);
      const [enabled, backgroundAt] = await Promise.all([
        biometricPrefs.isDeviceBiometricEnabled(user.uid),
        biometricPrefs.getLastBackgroundAt(user.uid)
      ]);
      if (!mounted) return;

      setDeviceBiometricEnabled(enabled);
      setLastBackgroundAt(backgroundAt);

      const shouldLockOnColdStart = Boolean(routeTarget !== 'UNAUTH' && enabled && remoteBiometricSetting !== false);
      debugLog('coldStartDecision', {
        lockEnabled: Boolean(routeTarget !== 'UNAUTH' && enabled && remoteBiometricSetting !== false),
        shouldLockOnColdStart
      });

      setIsLocked(shouldLockOnColdStart);
      setUnlockError('');
      setPromptEpoch((prev) => (shouldLockOnColdStart ? prev + 1 : prev));
      setPrivacyCoverVisible(shouldLockOnColdStart);
      setInitializing(false);
    };

    init().catch(() => {
      if (!mounted) return;
      setInitializing(false);
    });

    return () => {
      mounted = false;
    };
  }, [user?.uid, routeTarget]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      const previous = appStateRef.current;
      appStateRef.current = nextState;
      debugLog('appStateChange', { previous, nextState, lockEnabled, lastBackgroundAt });

      if (nextState === 'inactive' || nextState === 'background') {
        if (lockEnabled) {
          setPrivacyCoverVisible(true);
        }
        if (user?.uid) {
          const now = Date.now();
          markBackgroundTimestamp(now);
        }
        return;
      }

      const becameActive = (previous === 'background' || previous === 'inactive') && nextState === 'active';
      if (!becameActive) return;

      if (!lockEnabled) {
        setPrivacyCoverVisible(false);
        return;
      }

      // Immediately mask UI while we decide lock state to avoid protected-screen flashes.
      setPrivacyCoverVisible(true);

      // Biometric prompt itself toggles app state; while unlock is in flight
      // do not run foreground lock/unlock decisions.
      if (unlockInFlightRef.current || unlockInProgress) {
        debugLog('foregroundDecisionSkipped', { reason: 'unlock_in_progress' });
        return;
      }

      const now = Date.now();
      const timeAwayMs = Math.max(0, now - Number(lastBackgroundAt || 0));
      const shouldLock = timeAwayMs > (thresholdSeconds * 1000);
      debugLog('foregroundDecision', { timeAwayMs, thresholdSeconds, shouldLock });

      if (shouldLock) {
        setIsLocked(true);
        setUnlockError('');
        setPromptEpoch((prev) => prev + 1);
        setPrivacyCoverVisible(true);
        return;
      }

      setPrivacyCoverVisible(false);
    });
    return () => sub.remove();
  }, [lastBackgroundAt, lockEnabled, markBackgroundTimestamp, thresholdSeconds, unlockInProgress, user?.uid]);

  useEffect(() => {
    if (!lockEnabled) {
      setIsLocked(false);
      setPrivacyCoverVisible(false);
      setUnlockError('');
    }
  }, [lockEnabled]);

  useEffect(() => {
    if (!isLocked && lockEnabled && appStateRef.current === 'active') {
      setPrivacyCoverVisible(false);
    }
  }, [isLocked, lockEnabled]);

  const state = useMemo(() => ({
    lockEnabled,
    lastBackgroundAt,
    isLocked,
    unlockInProgress,
    thresholdSeconds
  }), [lockEnabled, lastBackgroundAt, isLocked, unlockInProgress, thresholdSeconds]);

  return {
    state,
    initializing,
    deviceBiometricEnabled,
    setDeviceBiometricEnabled,
    unlockError,
    setUnlockError,
    promptEpoch,
    privacyCoverVisible,
    tryBiometricUnlock,
    requestLock,
    forceUnlock,
    markBackgroundTimestamp
  };
};
