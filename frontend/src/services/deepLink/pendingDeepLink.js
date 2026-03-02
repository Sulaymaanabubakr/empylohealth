import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'pending_deep_link_url_v1';
const KEY_TYPED = 'pending_deep_link_payload_v2';

export const pendingDeepLink = {
  save: async (input) => {
    if (typeof input === 'string') {
      const value = String(input || '').trim();
      if (!value) return;
      await AsyncStorage.setItem(KEY, value);
      await AsyncStorage.setItem(KEY_TYPED, JSON.stringify({
        kind: 'url',
        url: value,
        source: 'legacy',
        createdAt: Date.now()
      }));
      return;
    }
    const payload = input && typeof input === 'object' ? input : null;
    const url = String(payload?.url || '').trim();
    if (!url) return;
    await AsyncStorage.setItem(KEY, url);
    await AsyncStorage.setItem(KEY_TYPED, JSON.stringify({
      kind: payload?.kind || 'url',
      url,
      route: payload?.route || null,
      source: payload?.source || 'unknown',
      createdAt: Number(payload?.createdAt || Date.now())
    }));
  },
  read: async () => {
    const typedRaw = await AsyncStorage.getItem(KEY_TYPED);
    if (typedRaw) {
      try {
        const parsed = JSON.parse(typedRaw);
        if (parsed?.url) return parsed;
      } catch {
        // Fall through to legacy key.
      }
    }
    const value = await AsyncStorage.getItem(KEY);
    const normalized = value ? String(value).trim() : '';
    if (!normalized) return null;
    return {
      kind: 'url',
      url: normalized,
      route: null,
      source: 'legacy',
      createdAt: Date.now()
    };
  },
  clear: async () => {
    await AsyncStorage.removeItem(KEY);
    await AsyncStorage.removeItem(KEY_TYPED);
  },
  consume: async () => {
    const value = await pendingDeepLink.read();
    if (value) {
      await pendingDeepLink.clear();
    }
    return value;
  }
};
