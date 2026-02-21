import { Platform } from 'react-native';
import { navigate } from '../../navigation/navigationRef';

let RNCallKeep = null;
try {
  // Optional native module: available only in dev/custom builds.
  RNCallKeep = require('react-native-callkeep').default;
} catch {
  RNCallKeep = null;
}

const NAMESPACE = 'c0a80125b4e84b6fa0d9f8e4e8b3a4aa';

const huddleIdToUuid = new Map();
const uuidToPayload = new Map();
let initialized = false;
let subscriptions = [];

const hashToHex = (input = '') => {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i);
    hash |= 0;
  }
  const positive = Math.abs(hash);
  return positive.toString(16).padStart(8, '0');
};

const toUuid = (seed) => {
  const p1 = hashToHex(`${seed}:${NAMESPACE}:1`);
  const p2 = hashToHex(`${seed}:${NAMESPACE}:2`).slice(0, 4);
  const p3 = hashToHex(`${seed}:${NAMESPACE}:3`).slice(0, 4);
  const p4 = hashToHex(`${seed}:${NAMESPACE}:4`).slice(0, 4);
  const p5 = `${hashToHex(`${seed}:${NAMESPACE}:5`)}${hashToHex(`${seed}:${NAMESPACE}:6`)}`.slice(0, 12);
  return `${p1}-${p2}-${p3}-${p4}-${p5}`;
};

const getOrCreateUuid = (huddleId) => {
  if (!huddleIdToUuid.has(huddleId)) {
    huddleIdToUuid.set(huddleId, toUuid(huddleId));
  }
  return huddleIdToUuid.get(huddleId);
};

const getSetupOptions = () => ({
  ios: {
    appName: 'Circles App',
    supportsVideo: false,
    includesCallsInRecents: false
  },
  android: {
    alertTitle: 'Phone Account Permission',
    alertDescription: 'Circles needs phone account access to show incoming huddles like a real call.',
    cancelButton: 'Cancel',
    okButton: 'Allow',
    additionalPermissions: [
      'android.permission.READ_PHONE_STATE',
      'android.permission.CALL_PHONE'
    ],
    foregroundService: {
      channelId: 'huddle-calls-ringtone',
      channelName: 'Huddle Calls',
      notificationTitle: 'Huddle call in progress'
    }
  }
});

const handleAnswerCall = (event) => {
  const callUUID = event?.callUUID;
  const payload = uuidToPayload.get(callUUID);
  if (!payload?.huddleId) return;

  if (Platform.OS === 'android') {
    RNCallKeep?.backToForeground?.();
  }

  navigate('Huddle', {
    chat: { id: payload.chatId || 'chat', name: payload.chatName || 'Huddle', isGroup: true },
    huddleId: payload.huddleId,
    mode: 'join',
    callTapTs: Date.now()
  });
};

const handleEndCall = (event) => {
  const callUUID = event?.callUUID;
  if (!callUUID) return;
  const payload = uuidToPayload.get(callUUID);
  uuidToPayload.delete(callUUID);
  if (payload?.huddleId) {
    huddleIdToUuid.delete(payload.huddleId);

    // Best-effort: if user declined from native UI before opening the in-app screen,
    // reflect it in Firebase so the caller doesn't ring forever.
    try {
      // eslint-disable-next-line global-require
      const { huddleService } = require('../api/huddleService');
      huddleService.declineHuddle(payload.huddleId).catch(() => {});
    } catch {
      // ignore if services aren't available yet
    }
  }
};

export const nativeCallService = {
  isSupported: () => !!RNCallKeep,

  initialize: async () => {
    if (!RNCallKeep || initialized) return;
    initialized = true;

    try {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.log('[CallKeep] native module present:', true);
      }
      await RNCallKeep.setup(getSetupOptions());
      if (Platform.OS === 'android') {
        RNCallKeep.setAvailable?.(true);
      }

      subscriptions.push(RNCallKeep.addEventListener('answerCall', handleAnswerCall));
      subscriptions.push(RNCallKeep.addEventListener('endCall', handleEndCall));
    } catch (error) {
      // keep app functional without native call UI.
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.log('[CallKeep] setup failed; using in-app IncomingHuddle fallback');
      }
      initialized = false;
      subscriptions = [];
    }
  },

  cleanup: () => {
    subscriptions.forEach((sub) => {
      try {
        sub?.remove?.();
      } catch {
        // ignore
      }
    });
    subscriptions = [];
    initialized = false;
  },

  presentIncomingHuddleCall: async ({ huddleId, chatId, chatName, callerName, avatar }) => {
    if (!RNCallKeep || !huddleId) return false;
    await nativeCallService.initialize();

    const uuid = getOrCreateUuid(huddleId);
    uuidToPayload.set(uuid, { huddleId, chatId, chatName, avatar: avatar || '' });

    try {
      RNCallKeep.displayIncomingCall(
        uuid,
        'huddle',
        callerName || chatName || 'Incoming Huddle',
        'generic',
        false
      );
      return true;
    } catch {
      return false;
    }
  },

  startOutgoingHuddleCall: async ({ huddleId, chatName }) => {
    if (!RNCallKeep || !huddleId) return false;
    await nativeCallService.initialize();

    const uuid = getOrCreateUuid(huddleId);
    uuidToPayload.set(uuid, { huddleId, chatName });
    try {
      RNCallKeep.startCall(uuid, 'huddle', chatName || 'Huddle', 'generic', false);
      return true;
    } catch {
      return false;
    }
  },

  setHuddleCallActive: (huddleId) => {
    if (!RNCallKeep || !huddleId) return;
    const uuid = getOrCreateUuid(huddleId);
    try {
      RNCallKeep.setCurrentCallActive?.(uuid);
    } catch {
      // ignore
    }
  },

  endHuddleCall: (huddleId) => {
    if (!RNCallKeep || !huddleId) return;
    const uuid = huddleIdToUuid.get(huddleId);
    if (!uuid) return;
    try {
      RNCallKeep.endCall(uuid);
    } catch {
      // ignore
    } finally {
      uuidToPayload.delete(uuid);
      huddleIdToUuid.delete(huddleId);
    }
  },

  endAll: () => {
    if (!RNCallKeep) return;
    try {
      RNCallKeep.endAllCalls();
    } catch {
      // ignore
    } finally {
      uuidToPayload.clear();
      huddleIdToUuid.clear();
    }
  }
};
