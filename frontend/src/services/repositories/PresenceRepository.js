import { auth, rtdb } from '../firebaseConfig';
import {
    ref,
    set,
    onValue,
    onDisconnect,
    serverTimestamp,
    off,
    get
} from 'firebase/database';

const CONNECTED_PATH = '.info/connected';

const buildPresencePayload = (state) => ({
    state,
    lastChanged: serverTimestamp()
});

export const presenceRepository = {
    startPresence(uid) {
        if (!uid) return () => {};

        const userStatusRef = ref(rtdb, `status/${uid}`);
        const connectedRef = ref(rtdb, CONNECTED_PATH);

        const handler = async (snap) => {
            if (snap.val() !== true) {
                return;
            }

            try {
                await onDisconnect(userStatusRef).set(buildPresencePayload('offline'));
                await set(userStatusRef, buildPresencePayload('online'));
            } catch (e) {
                if (typeof __DEV__ !== 'undefined' && __DEV__) {
                    console.warn('[RTDB] startPresence write failed', e?.message || e);
                }
            }
        };

        onValue(connectedRef, handler);
        const connectedUnsubscribe = () => off(connectedRef, 'value', handler);

        return async () => {
            try {
                connectedUnsubscribe();
                await set(userStatusRef, buildPresencePayload('offline'));
            } catch {
                // Ignore cleanup errors.
            }
        };
    },

    subscribeToPresence(uid, callback) {
        if (!uid) return () => {};
        const statusRef = ref(rtdb, `status/${uid}`);
        const handler = (snap) => callback(snap.val() || { state: 'offline', lastChanged: null });
        onValue(statusRef, handler);
        return () => off(statusRef, 'value', handler);
    },

    async getPresence(uid) {
        if (!uid) return { state: 'offline', lastChanged: null };
        const snap = await get(ref(rtdb, `status/${uid}`));
        return snap.val() || { state: 'offline', lastChanged: null };
    },

    async markOffline(uid = auth.currentUser?.uid) {
        if (!uid) return;
        try {
            await set(ref(rtdb, `status/${uid}`), buildPresencePayload('offline'));
        } catch (e) {
            if (typeof __DEV__ !== 'undefined' && __DEV__) {
                console.warn('[RTDB] markOffline failed', e?.message || e);
            }
        }
    }
};
