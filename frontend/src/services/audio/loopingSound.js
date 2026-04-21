let cachedImpl = null;

const tryLoadExpoAudio = () => {
  try {
    // expo-audio (native; requires rebuild to be present in runtime).
    // Do not gate on NativeModules because Expo modules may not be exposed there.
    // eslint-disable-next-line global-require
    const mod = require('expo-audio');
    if (mod?.createAudioPlayer) return mod;
  } catch {
    // ignore; runtime does not include ExpoAudio native module.
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
  cachedImpl = { kind: 'none', mod: null };
  return cachedImpl;
};

export const loopingSound = {
  createAndPlay: async (assetModuleId, { volume = 1.0, loop = true } = {}) => {
    const impl = resolveImpl();
    if (impl.kind === 'expo-audio') {
      await impl.mod.setIsAudioActiveAsync?.(true);
      await impl.mod.setAudioModeAsync?.({
        playsInSilentMode: true,
        interruptionMode: 'doNotMix',
        shouldPlayInBackground: true,
        shouldRouteThroughEarpiece: false,
      });
      const player = impl.mod.createAudioPlayer(assetModuleId, {
        keepAudioSessionActive: true,
      });
      player.loop = loop;
      player.volume = volume;
      player.play?.();
      return { kind: impl.kind, handle: player };
    }

    return null;
  },

  attachGapLoop: (instance, { gapMs = 0 } = {}) => {
    if (!instance?.handle?.addListener) return;

    loopingSound.detachGapLoop(instance);

    let restartTimeout = null;
    const subscription = instance.handle.addListener?.('playbackStatusUpdate', (status) => {
      if (!status?.didJustFinish) return;
      if (restartTimeout) {
        clearTimeout(restartTimeout);
      }
      restartTimeout = setTimeout(() => {
        restartTimeout = null;
        loopingSound.restart(instance).catch(() => {});
      }, gapMs);
    });

    instance._gapLoop = {
      subscription,
      clear: () => {
        if (restartTimeout) {
          clearTimeout(restartTimeout);
          restartTimeout = null;
        }
        subscription?.remove?.();
      },
    };
  },

  detachGapLoop: (instance) => {
    if (!instance?._gapLoop) return;
    instance._gapLoop.clear?.();
    instance._gapLoop = null;
  },

  restart: async (instance) => {
    if (!instance?.handle) return;
    const { kind, handle } = instance;
    if (kind === 'expo-audio') {
      await handle.pause?.();
      await handle.seekTo?.(0);
      handle.play?.();
    }
  },

  stopAndUnload: async (instance) => {
    if (!instance?.handle) return;
    loopingSound.detachGapLoop(instance);
    const { kind, handle } = instance;
    if (kind === 'expo-audio') {
      await handle.pause?.();
      await handle.seekTo?.(0);
      await handle.remove?.();
      await resolveImpl().mod?.setIsAudioActiveAsync?.(false);
      return;
    }
  }
};
