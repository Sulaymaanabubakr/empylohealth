let cachedImpl = null;

const tryLoadExpoAudio = () => {
  try {
    // Avoid importing expo-audio JS when current runtime doesn't include its native module.
    // Importing in that case logs: "Cannot find native module 'ExpoAudio'".
    // eslint-disable-next-line global-require
    const { NativeModules } = require('react-native');
    if (!NativeModules?.ExpoAudio) return null;
  } catch {
    return null;
  }

  try {
    // expo-audio (native; requires rebuild to be present in runtime)
    // eslint-disable-next-line global-require
    const mod = require('expo-audio');
    if (mod?.createAudioPlayer) return mod;
  } catch {
    // ignore
  }
  return null;
};

const tryLoadExpoAvAudio = () => {
  try {
    // expo-av (deprecated in SDK 54, but still present in older dev clients)
    // eslint-disable-next-line global-require
    const { Audio } = require('expo-av');
    if (Audio?.Sound?.createAsync) return Audio;
  } catch {
    // ignore
  }
  return null;
};

const resolveImpl = () => {
  if (cachedImpl) return cachedImpl;
  const expoAudio = tryLoadExpoAudio();
  if (expoAudio) {
    cachedImpl = { kind: 'expo-audio', mod: expoAudio };
    return cachedImpl;
  }
  const expoAv = tryLoadExpoAvAudio();
  if (expoAv) {
    cachedImpl = { kind: 'expo-av', mod: expoAv };
    return cachedImpl;
  }
  cachedImpl = { kind: 'none', mod: null };
  return cachedImpl;
};

export const loopingSound = {
  createAndPlay: async (assetModuleId, { volume = 1.0 } = {}) => {
    const impl = resolveImpl();
    if (impl.kind === 'expo-audio') {
      const player = impl.mod.createAudioPlayer(assetModuleId);
      player.loop = true;
      player.volume = volume;
      await player.play?.();
      return { kind: impl.kind, handle: player };
    }

    if (impl.kind === 'expo-av') {
      await impl.mod.setAudioModeAsync({
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        staysActiveInBackground: false
      });
      const created = await impl.mod.Sound.createAsync(assetModuleId, {
        isLooping: true,
        shouldPlay: true,
        volume
      });
      return { kind: impl.kind, handle: created.sound };
    }

    return null;
  },

  stopAndUnload: async (instance) => {
    if (!instance?.handle) return;
    const { kind, handle } = instance;
    if (kind === 'expo-audio') {
      await handle.pause?.();
      await handle.seekTo?.(0);
      await handle.remove?.();
      return;
    }
    if (kind === 'expo-av') {
      await handle.stopAsync?.();
      await handle.unloadAsync?.();
    }
  }
};
