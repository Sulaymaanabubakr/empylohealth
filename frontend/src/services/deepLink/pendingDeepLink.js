import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'pending_deep_link_url_v1';

export const pendingDeepLink = {
  save: async (url) => {
    const value = String(url || '').trim();
    if (!value) return;
    await AsyncStorage.setItem(KEY, value);
  },
  read: async () => {
    const value = await AsyncStorage.getItem(KEY);
    return value ? String(value).trim() : '';
  },
  clear: async () => {
    await AsyncStorage.removeItem(KEY);
  },
  consume: async () => {
    const value = await pendingDeepLink.read();
    if (value) {
      await pendingDeepLink.clear();
    }
    return value;
  }
};

