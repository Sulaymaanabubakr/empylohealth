import { auth, db } from '../firebaseConfig';
import { collection, query, where, getDocs, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { circleRepository } from '../repositories/CircleRepository';
import { callableClient } from './callableClient';

const isAuthPermissionError = (error) => {
    const code = String(error?.code || '');
    const message = String(error?.message || '').toLowerCase();
    return code.includes('permission-denied') || code.includes('unauthenticated') || message.includes('permission') || message.includes('unauthenticated');
};

const getDocsWithAuthRetry = async (q, label) => {
    try {
        return await getDocs(q);
    } catch (error) {
        if (!isAuthPermissionError(error) || !auth.currentUser) throw error;
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
            console.warn(`[FirestoreAuthRetry] ${label} failed; refreshing token and retrying once`, {
                code: error?.code,
                message: error?.message,
                uid: auth.currentUser?.uid || null
            });
        }
        await auth.currentUser.getIdToken(true).catch(() => null);
        return getDocs(q);
    }
};

export const circleService = {
    createCircle: async (name, description = '', category = 'General', type = 'public', image = null, visibility = 'visible') => {
        return circleRepository.createCircle({ name, description, category, type, image, visibility });
    },

    updateCircle: async (circleId, data) => {
        return circleRepository.updateCircle(circleId, data);
    },

    joinCircle: async (circleId) => {
        return circleRepository.joinCircle(circleId);
    },

    leaveCircle: async (circleId) => {
        return circleRepository.leaveCircle(circleId);
    },

    deleteCircle: async (circleId) => {
        return circleRepository.deleteCircle(circleId);
    },

    subscribeToMyCircles: (uid, callback) => {
        const q = query(
            collection(db, 'circles'),
            where('members', 'array-contains', uid),
            orderBy('createdAt', 'desc')
        );
        let unsubscribeSnapshot = () => {};
        let disposed = false;
        let retriedAfterAuthRefresh = false;

        const attach = () => {
            unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
                const circles = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
                callback(circles);
            }, async (error) => {
                if (!disposed && !retriedAfterAuthRefresh && isAuthPermissionError(error) && auth.currentUser) {
                    retriedAfterAuthRefresh = true;
                    if (typeof __DEV__ !== 'undefined' && __DEV__) {
                        console.warn('[FirestoreAuthRetry] subscribeToMyCircles failed; refreshing token and re-subscribing', {
                            code: error?.code,
                            message: error?.message,
                            uid: auth.currentUser?.uid || null
                        });
                    }
                    await auth.currentUser.getIdToken(true).catch(() => null);
                    if (!disposed) {
                        unsubscribeSnapshot();
                        attach();
                    }
                    return;
                }
                console.error('Error subscribing to circles:', error);
            });
        };

        attach();
        return () => {
            disposed = true;
            unsubscribeSnapshot();
        };
    },

    getAllCircles: async () => {
        const resultsById = new Map();
        const publicQuery = query(
            collection(db, 'circles'),
            where('type', '==', 'public')
        );
        const publicSnapshot = await getDocsWithAuthRetry(publicQuery, 'circles_public');
        publicSnapshot.docs.forEach((docSnap) => {
            resultsById.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
        });

        // Also include circles the user is already in (private circles won't match the public query).
        const uid = auth.currentUser?.uid;
        if (uid) {
            const mineQuery = query(
                collection(db, 'circles'),
                where('members', 'array-contains', uid)
            );
            const mineSnapshot = await getDocsWithAuthRetry(mineQuery, 'circles_mine');
            mineSnapshot.docs.forEach((docSnap) => {
                resultsById.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
            });
        }

        const circles = Array.from(resultsById.values());
        circles.sort((a, b) => {
            const aMs = a?.createdAt?.toMillis?.() || 0;
            const bMs = b?.createdAt?.toMillis?.() || 0;
            return bMs - aMs;
        });
        return circles;
    },

    // Privileged operations are still Functions-backed.
    manageMember: async (circleId, targetUid, action) => {
        return callableClient.invokeWithAuth('manageMember', { circleId, targetUid, action });
    },

    handleJoinRequest: async (circleId, targetUid, action) => {
        return callableClient.invokeWithAuth('handleJoinRequest', { circleId, targetUid, action });
    },

    resolveCircleReport: async (circleId, reportId, action, resolutionNote = '') => {
        return callableClient.invokeWithAuth('resolveCircleReport', { circleId, reportId, action, resolutionNote });
    },

    submitReport: async (circleId, targetId, targetType, reason, description = '') => {
        return callableClient.invokeWithAuth('submitReport', { circleId, targetId, targetType, reason, description });
    },

    scheduleHuddle: async (circleId, title, scheduledAt) => {
        return callableClient.invokeWithAuth('scheduleHuddle', { circleId, title, scheduledAt: scheduledAt.toISOString() });
    },

    deleteScheduledHuddle: async (circleId, eventId) => {
        return callableClient.invokeWithAuth('deleteScheduledHuddle', { circleId, eventId });
    },

    subscribeToScheduledHuddles: (circleId, callback) => {
        const q = query(
            collection(db, 'circles', circleId, 'scheduledHuddles'),
            orderBy('scheduledAt', 'asc')
        );
        return onSnapshot(q, (snapshot) => {
            const events = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
            callback(events);
        });
    },

    subscribeToCircleMember: (circleId, uid, callback) => {
        const docRef = doc(db, 'circles', circleId, 'members', uid);
        return onSnapshot(docRef, (docSnap) => {
            callback(docSnap.exists() ? docSnap.data() : null);
        });
    },

    getCircleById: async (circleId) => {
        const docRef = doc(db, 'circles', circleId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return null;
        return { id: docSnap.id, ...docSnap.data() };
    }
};
