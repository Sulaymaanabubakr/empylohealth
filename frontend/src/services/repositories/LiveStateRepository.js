import { rtdb } from '../firebaseConfig';
import { ref, set, update, onValue, off, remove, serverTimestamp } from 'firebase/database';

export const liveStateRepository = {
    setTyping(chatId, uid, isTyping) {
        if (!chatId || !uid) return Promise.resolve();
        const typingRef = ref(rtdb, `typing/${chatId}/${uid}`);

        if (!isTyping) {
            return remove(typingRef).catch((e) => {
                if (typeof __DEV__ !== 'undefined' && __DEV__) {
                    console.warn('[RTDB] setTyping remove failed', e?.message || e);
                }
            });
        }

        return set(typingRef, {
            state: 'typing',
            updatedAt: serverTimestamp()
        }).catch((e) => {
            if (typeof __DEV__ !== 'undefined' && __DEV__) {
                console.warn('[RTDB] setTyping failed', e?.message || e);
            }
        });
    },

    subscribeTyping(chatId, callback) {
        if (!chatId) return () => {};
        const typingRef = ref(rtdb, `typing/${chatId}`);
        const handler = (snap) => callback(snap.val() || {});
        onValue(typingRef, handler);
        return () => off(typingRef, 'value', handler);
    },

    upsertHuddleLiveState(roomId, patch) {
        if (!roomId) return Promise.resolve();
        const roomRef = ref(rtdb, `live/${roomId}`);
        return update(roomRef, {
            ...patch,
            updatedAt: serverTimestamp()
        }).catch((e) => {
            if (typeof __DEV__ !== 'undefined' && __DEV__) {
                console.warn('[RTDB] upsertHuddleLiveState failed', e?.message || e);
            }
        });
    },

    subscribeHuddleLiveState(roomId, callback) {
        if (!roomId) return () => {};
        const roomRef = ref(rtdb, `live/${roomId}`);
        const handler = (snap) => callback(snap.val() || null);
        onValue(roomRef, handler);
        return () => off(roomRef, 'value', handler);
    }
};
