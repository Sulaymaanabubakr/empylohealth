import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { screenProtectionService } from './screenProtectionService';

export const useScreenProtection = ({ enabled = true, reason = 'manual' } = {}) => {
  useFocusEffect(
    useCallback(() => {
      if (!enabled) return undefined;
      let release = null;
      let cancelled = false;
      screenProtectionService.acquireManualProtection(reason).then((fn) => {
        if (cancelled) {
          fn?.();
          return;
        }
        release = fn;
      });
      return () => {
        cancelled = true;
        if (typeof release === 'function') {
          release();
        }
      };
    }, [enabled, reason])
  );
};
