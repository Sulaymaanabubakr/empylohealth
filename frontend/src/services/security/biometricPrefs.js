import AsyncStorage from '@react-native-async-storage/async-storage';

const setupSeenKey = (uid) => `biometric_setup_seen:${uid}`;
const deviceEnabledKey = (uid) => `biometric_device_enabled:${uid}`;
const backgroundAtKey = (uid) => `biometric_background_at:${uid}`;

const parseBool = (value) => value === '1';

export const biometricPrefs = {
    async hasSeenSetupPrompt(uid) {
        if (!uid) return true;
        const value = await AsyncStorage.getItem(setupSeenKey(uid));
        return parseBool(value);
    },

    async markSetupPromptSeen(uid) {
        if (!uid) return;
        await AsyncStorage.setItem(setupSeenKey(uid), '1');
    },

    async isDeviceBiometricEnabled(uid) {
        if (!uid) return false;
        const value = await AsyncStorage.getItem(deviceEnabledKey(uid));
        return parseBool(value);
    },

    async setDeviceBiometricEnabled(uid, enabled) {
        if (!uid) return;
        await AsyncStorage.setItem(deviceEnabledKey(uid), enabled ? '1' : '0');
    },

    async getLastBackgroundAt(uid) {
        if (!uid) return 0;
        const raw = await AsyncStorage.getItem(backgroundAtKey(uid));
        const value = Number(raw || 0);
        return Number.isFinite(value) ? value : 0;
    },

    async setLastBackgroundAt(uid, timestampMs) {
        if (!uid) return;
        await AsyncStorage.setItem(backgroundAtKey(uid), String(Math.max(0, Number(timestampMs) || 0)));
    }
};
