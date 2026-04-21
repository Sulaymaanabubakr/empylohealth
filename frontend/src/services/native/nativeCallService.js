import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Vibration } from 'react-native';
import { loopingSound } from '../audio/loopingSound';

const INCOMING_DEDUPE_MS = 15000;
const HANDLED_TTL_MS = 2 * 60 * 60 * 1000;
const RING_REPEAT_MS = 4500;
const RING_GAP_MS = 300;
const HANDLED_STORAGE_KEY = 'incoming_huddle_handled_v1';
const PENDING_JOIN_STORAGE_KEY = 'incoming_huddle_pending_join_v1';

let initialized = false;
let activeIncomingHuddleId = null;
let ringtoneInstance = null;
let vibrationInterval = null;
let ringtoneSession = 0;
const dedupeMap = new Map();
const handledMap = new Map();

const safeCall = async (fn) => {
  try {
    return await fn();
  } catch {
    return null;
  }
};

const pruneHandledEntries = () => {
  const cutoff = Date.now() - HANDLED_TTL_MS;
  Array.from(handledMap.entries()).forEach(([huddleId, value]) => {
    if (!value?.ts || value.ts < cutoff) {
      handledMap.delete(huddleId);
    }
  });
};

const persistHandledEntries = async () => {
  pruneHandledEntries();
  try {
    await AsyncStorage.setItem(
      HANDLED_STORAGE_KEY,
      JSON.stringify(Array.from(handledMap.entries())),
    );
  } catch {
    // ignore persistence failures
  }
};

const hydrateHandledEntries = async () => {
  try {
    const raw = await AsyncStorage.getItem(HANDLED_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;
    parsed.forEach(([huddleId, value]) => {
      if (!huddleId || !value?.ts) return;
      handledMap.set(String(huddleId), value);
    });
    pruneHandledEntries();
  } catch {
    // ignore hydration failures
  }
};

const clearIntervals = () => {
  if (vibrationInterval) {
    clearInterval(vibrationInterval);
    vibrationInterval = null;
  }
};

const normalizePayload = (payload = {}) => ({
  huddleId: payload?.huddleId || null,
  chatId: payload?.chatId || null,
  chatName: payload?.chatName || 'Huddle',
  callerName: payload?.callerName || payload?.chatName || 'Incoming Huddle',
  avatar: payload?.isGroup
    ? (payload?.chatAvatar || payload?.groupAvatar || payload?.avatar || '')
    : (payload?.callerAvatar || payload?.senderAvatar || payload?.avatar || payload?.chatAvatar || ''),
  senderId: payload?.senderId || null,
  isGroup: Boolean(payload?.isGroup),
});

export const nativeCallService = {
  isSupported: () => false,

  getAvailability: async () => ({
    modulePresent: false,
    connectionServiceAvailable: false,
    mode: 'app-controlled',
  }),

  initialize: async () => {
    if (initialized) return;
    initialized = true;
    await hydrateHandledEntries();
  },

  cleanup: async () => {
    await nativeCallService.stopIncomingRingtone();
    activeIncomingHuddleId = null;
    dedupeMap.clear();
  },

  toIncomingRouteParams: (payload = {}) => {
    const normalized = normalizePayload(payload);
    return {
      huddleId: normalized.huddleId,
      chatId: normalized.chatId,
      chatName: normalized.chatName,
      callerName: normalized.callerName,
      avatar: normalized.avatar,
      isGroup: normalized.isGroup,
    };
  },

  shouldShowIncomingHuddle: async (payload = {}) => {
    await nativeCallService.initialize();
    const normalized = normalizePayload(payload);
    if (!normalized.huddleId) return false;
    const handled = handledMap.get(normalized.huddleId);
    if (handled?.status) return false;
    const now = Date.now();
    const lastSeenAt = Number(dedupeMap.get(normalized.huddleId) || 0);
    if ((now - lastSeenAt) < INCOMING_DEDUPE_MS) return false;
    dedupeMap.set(normalized.huddleId, now);
    activeIncomingHuddleId = normalized.huddleId;
    return true;
  },

  markIncomingHandled: async (huddleId, status = 'handled') => {
    if (!huddleId) return;
    handledMap.set(String(huddleId), {
      status,
      ts: Date.now(),
    });
    if (activeIncomingHuddleId === huddleId) {
      activeIncomingHuddleId = null;
    }
    await persistHandledEntries();
  },

  clearHandledState: async (huddleId) => {
    if (!huddleId) return;
    handledMap.delete(String(huddleId));
    await persistHandledEntries();
  },

  startIncomingRingtone: async (huddleId) => {
    if (!huddleId) return false;
    if (AppState.currentState !== 'active') {
      return false;
    }
    if (activeIncomingHuddleId && activeIncomingHuddleId !== huddleId) {
      await nativeCallService.stopIncomingRingtone();
    }
    activeIncomingHuddleId = huddleId;
    ringtoneSession += 1;
    const currentSession = ringtoneSession;
    clearIntervals();
    Vibration.cancel();

    const instance = await safeCall(() => loopingSound.createAndPlay(
      require('../../assets/sounds/circles_incoming_ringtone.wav'),
      { volume: 1.0, loop: false },
    ));

    if (!instance?.handle) {
      Vibration.vibrate(350);
      vibrationInterval = setInterval(() => {
        if (ringtoneSession !== currentSession) return;
        Vibration.vibrate(350);
      }, RING_REPEAT_MS);
      return true;
    }

    ringtoneInstance = instance;
    loopingSound.attachGapLoop(instance, { gapMs: RING_GAP_MS });
    return true;
  },

  stopIncomingRingtone: async () => {
    ringtoneSession += 1;
    clearIntervals();
    Vibration.cancel();
    const instance = ringtoneInstance;
    ringtoneInstance = null;
    if (instance) {
      await safeCall(() => loopingSound.stopAndUnload(instance));
    }
  },

  dismissIncomingHuddle: async (huddleId, status = 'dismissed') => {
    await nativeCallService.stopIncomingRingtone();
    if (huddleId) {
      await nativeCallService.markIncomingHandled(huddleId, status);
    }
  },

  setPendingJoinIntent: async (payload = {}) => {
    const normalized = normalizePayload(payload);
    if (!normalized.huddleId) return;
    try {
      await AsyncStorage.setItem(PENDING_JOIN_STORAGE_KEY, JSON.stringify({
        ...normalized,
        ts: Date.now(),
      }));
    } catch {
      // ignore persistence failures
    }
  },

  consumePendingJoinIntent: async () => {
    try {
      const raw = await AsyncStorage.getItem(PENDING_JOIN_STORAGE_KEY);
      if (!raw) return null;
      await AsyncStorage.removeItem(PENDING_JOIN_STORAGE_KEY);
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  },

  clearPendingJoinIntent: async () => {
    try {
      await AsyncStorage.removeItem(PENDING_JOIN_STORAGE_KEY);
    } catch {
      // ignore
    }
  },

  hasPendingIncomingHuddle: (huddleId) => {
    if (!huddleId) return false;
    return activeIncomingHuddleId === huddleId;
  },

  getCurrentIncomingHuddleId: () => activeIncomingHuddleId,

  clearIncomingHuddle: async (huddleId) => {
    if (huddleId && activeIncomingHuddleId !== huddleId) return;
    await nativeCallService.stopIncomingRingtone();
    activeIncomingHuddleId = null;
  },
};
