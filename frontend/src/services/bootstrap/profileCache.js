import AsyncStorage from '@react-native-async-storage/async-storage';

const keyFor = (uid) => `cached_profile_${uid}`;

export const profileCache = {
    async load(uid) {
        if (!uid) return null;
        try {
            const raw = await AsyncStorage.getItem(keyFor(uid));
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    },

    async save(uid, profile) {
        if (!uid || !profile) return;
        try {
            await AsyncStorage.setItem(keyFor(uid), JSON.stringify(profile));
        } catch {
            // Ignore cache errors.
        }
    },

    async clear(uid) {
        if (!uid) return;
        try {
            await AsyncStorage.removeItem(keyFor(uid));
        } catch {
            // Ignore cache errors.
        }
    }
};
