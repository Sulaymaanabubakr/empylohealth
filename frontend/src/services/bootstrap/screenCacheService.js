import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'screen_cache_v1:';

const makeKey = (key) => `${PREFIX}${key}`;

export const screenCacheService = {
  async set(key, data) {
    try {
      const payload = {
        savedAt: Date.now(),
        data,
      };
      await AsyncStorage.setItem(makeKey(key), JSON.stringify(payload));
    } catch {
      // best effort cache
    }
  },

  async get(key, maxAgeMs = 10 * 60 * 1000) {
    try {
      const raw = await AsyncStorage.getItem(makeKey(key));
      if (!raw) return null;
      const payload = JSON.parse(raw);
      const savedAt = Number(payload?.savedAt || 0);
      if (!savedAt || (Date.now() - savedAt) > maxAgeMs) return null;
      return payload?.data ?? null;
    } catch {
      return null;
    }
  },
};

