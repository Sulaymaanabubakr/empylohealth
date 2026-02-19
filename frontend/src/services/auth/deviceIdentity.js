import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

const INSTALLATION_ID_KEY = 'device_installation_id';

const getOrCreateInstallationId = async () => {
  const existing = await AsyncStorage.getItem(INSTALLATION_ID_KEY);
  if (existing) return existing;
  const created = uuidv4();
  await AsyncStorage.setItem(INSTALLATION_ID_KEY, created);
  return created;
};

export const getDeviceIdentity = async () => {
  const appVersion = Constants.expoConfig?.version || 'unknown';
  const buildNumber = Platform.OS === 'ios'
    ? (Constants.expoConfig?.ios?.buildNumber || Constants.nativeBuildVersion || '')
    : (Constants.expoConfig?.android?.versionCode?.toString?.() || Constants.nativeBuildVersion || '');

  return {
    deviceId: await getOrCreateInstallationId(),
    platform: Platform.OS,
    model: Device.modelName || Device.deviceName || 'Unknown',
    osVersion: Device.osVersion || 'Unknown',
    appVersion: buildNumber ? `${appVersion} (${buildNumber})` : appVersion,
    locale: String(Device.osInternalBuildId || '')
  };
};
