import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { auth, db } from '../firebaseConfig';
import { doc, arrayUnion, setDoc, getDoc } from 'firebase/firestore';
import { navigate } from '../../navigation/navigationRef';
import { nativeCallService } from '../native/nativeCallService';

let notificationRoutingInitialized = false;
let responseSubscription = null;
let receiveSubscription = null;
let voipListenersRegistered = false;
let voipTokenUserId = null;
let lastInAppIncoming = { huddleId: null, ts: 0 };

let VoipPushNotification = null;
try {
    // Optional native module available in custom/dev builds.
    VoipPushNotification = require('react-native-voip-push-notification').default;
} catch {
    VoipPushNotification = null;
}

const saveUserPushToken = async (uid, field, token) => {
    if (!uid || !token) return;
    const userRef = doc(db, 'users', uid);
    try {
        await setDoc(userRef, { [field]: arrayUnion(token) }, { merge: true });
    } catch (error) {
        const code = String(error?.code || '');
        const message = String(error?.message || '').toLowerCase();
        const isAuthError = code.includes('permission-denied') || code.includes('unauthenticated') || message.includes('permission') || message.includes('unauthenticated');
        if (!isAuthError || !auth.currentUser) throw error;

        if (typeof __DEV__ !== 'undefined' && __DEV__) {
            console.warn('[FirestoreAuthRetry] saveUserPushToken failed; refreshing token and retrying once', {
                code: error?.code,
                message: error?.message,
                uid: auth.currentUser?.uid || null,
                field
            });
        }

        await auth.currentUser.getIdToken(true).catch(() => null);
        await setDoc(userRef, { [field]: arrayUnion(token) }, { merge: true });
    }
};

const resolveChatNavigationPayload = async (chatId) => {
    if (!chatId) return null;
    try {
        const chatSnap = await getDoc(doc(db, 'chats', chatId));
        if (!chatSnap.exists()) return null;

        const chatData = chatSnap.data() || {};
        const participants = Array.isArray(chatData.participants) ? chatData.participants : [];
        const isGroup = chatData.type === 'group' || participants.length > 2;

        let name = chatData.name || 'Chat';
        let avatar = chatData.avatar || chatData.photoURL || chatData.image || '';

        if (isGroup && chatData.circleId) {
            const circleSnap = await getDoc(doc(db, 'circles', chatData.circleId));
            if (circleSnap.exists()) {
                const circleData = circleSnap.data() || {};
                name = circleData.name || name;
                avatar = circleData.image || circleData.avatar || circleData.photoURL || avatar;
            }
        } else if (!isGroup) {
            const currentUid = auth.currentUser?.uid;
            const otherId = participants.find((id) => id !== currentUid) || participants[0];
            if (otherId) {
                const userSnap = await getDoc(doc(db, 'users', otherId));
                if (userSnap.exists()) {
                    const userData = userSnap.data() || {};
                    name = userData.name || userData.displayName || name;
                    avatar = userData.photoURL || avatar;
                }
            }
        }

        return {
            id: chatId,
            ...chatData,
            name,
            avatar,
            isGroup,
            members: participants.length,
            me: auth.currentUser?.uid || null
        };
    } catch {
        return null;
    }
};

const navigateFromNotificationData = async (payload) => {
    try {
        const data = payload?.notification?.request?.content?.data || payload?.data || {};
        const type = data?.type;
        const huddleId = data?.huddleId;
        const chatId = data?.chatId;

        if (type === 'HUDDLE_STARTED' && huddleId) {
            navigate('Huddle', {
                chat: { id: chatId || 'chat', name: 'Huddle', isGroup: true },
                huddleId,
                mode: 'join',
                callTapTs: Date.now()
            });
            return true;
        }

        if (type === 'CHAT_MESSAGE' && chatId) {
            const chat = await resolveChatNavigationPayload(chatId);
            if (chat) {
                navigate('ChatDetail', { chat });
                return true;
            }
            navigate('MainTabs', { screen: 'ChatList' });
            return true;
        }

        if (type === 'DAILY_AFFIRMATION') {
            navigate('Affirmations', { affirmationId: data?.affirmationId || null });
            return true;
        }

        return false;
    } catch (error) {
        console.error('[NotificationRouting] Failed to route notification payload', error);
        return false;
    }
};

const maybeShowNativeIncomingCall = async (payload) => {
    const data = payload?.request?.content?.data || payload?.notification?.request?.content?.data || payload?.data || {};
    if (data?.type !== 'HUDDLE_STARTED' || !data?.huddleId) return false;
    const shown = await nativeCallService.presentIncomingHuddleCall({
        huddleId: data.huddleId,
        chatId: data.chatId,
        chatName: data.chatName || 'Huddle',
        callerName: data.callerName || data.chatName || 'Incoming Huddle'
    });
    if (shown) return true;

    // In-app fallback for builds without CallKeep: show accept/decline UI + ringtone.
    const now = Date.now();
    if (lastInAppIncoming.huddleId !== data.huddleId || (now - lastInAppIncoming.ts) > 15000) {
        lastInAppIncoming = { huddleId: data.huddleId, ts: now };
        navigate('IncomingHuddle', {
            huddleId: data.huddleId,
            chatId: data.chatId,
            chatName: data.chatName || 'Huddle',
            callerName: data.callerName || data.chatName || 'Incoming Huddle'
        });
    }
    return true;
};

const normalizeVoipNotificationData = (notification) => {
    const direct = notification?.data || notification;
    const payload = direct?.payload || {};
    return {
        huddleId: direct?.huddleId || payload?.huddleId || payload?.huddle_id,
        chatId: direct?.chatId || payload?.chatId || payload?.chat_id,
        chatName: direct?.chatName || payload?.chatName || payload?.chat_name || 'Huddle',
        callerName: direct?.callerName || payload?.callerName || payload?.caller_name || 'Incoming Huddle',
        type: direct?.type || payload?.type || 'HUDDLE_STARTED'
    };
};

const registerVoipListeners = () => {
    if (!VoipPushNotification || voipListenersRegistered || Platform.OS !== 'ios') return;
    voipListenersRegistered = true;

    VoipPushNotification.addEventListener('register', (token) => {
        saveUserPushToken(voipTokenUserId, 'voipPushTokens', token).catch(() => {});
    });

    VoipPushNotification.addEventListener('notification', (notification) => {
        const data = normalizeVoipNotificationData(notification);
        if (data.type === 'HUDDLE_STARTED' && data.huddleId) {
            nativeCallService.presentIncomingHuddleCall(data).catch(() => {});
        }

        if (typeof notification?.completion === 'function') {
            try {
                notification.completion();
            } catch {
                // ignore
            }
        }
    });
};

export const notificationService = {
    routeFromNotificationPayload: async (payload) => {
        return navigateFromNotificationData(payload);
    },

    initializeNotificationRouting: () => {
        if (notificationRoutingInitialized) return;
        notificationRoutingInitialized = true;
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
            console.log('[Calls] CallKeep supported:', nativeCallService.isSupported());
        }
        nativeCallService.initialize();
        registerVoipListeners();

        Notifications.setNotificationHandler({
            handleNotification: async (notification) => {
                const shownAsNativeCall = await maybeShowNativeIncomingCall(notification);
                return {
                    shouldShowAlert: !shownAsNativeCall,
                    shouldPlaySound: true,
                    shouldSetBadge: false
                };
            }
        });

        receiveSubscription = Notifications.addNotificationReceivedListener((notification) => {
            maybeShowNativeIncomingCall(notification);
        });

        responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
            navigateFromNotificationData(response).catch((error) => {
                console.error('[NotificationRouting] Response listener failure', error);
            });
        });

        Notifications.getLastNotificationResponseAsync().then((response) => {
            if (response) {
                navigateFromNotificationData(response).catch((error) => {
                    console.error('[NotificationRouting] Last response routing failure', error);
                });
            }
        }).catch(() => {});
    },

    cleanupNotificationRouting: () => {
        if (responseSubscription) {
            responseSubscription.remove();
            responseSubscription = null;
        }
        if (receiveSubscription) {
            receiveSubscription.remove();
            receiveSubscription = null;
        }
        if (VoipPushNotification && voipListenersRegistered && Platform.OS === 'ios') {
            try {
                VoipPushNotification.removeEventListener('register');
                VoipPushNotification.removeEventListener('notification');
            } catch {
                // ignore
            }
            voipListenersRegistered = false;
        }
        nativeCallService.cleanup();
        notificationRoutingInitialized = false;
    },

    /**
     * Register for Push Notifications
     * @param {string} uid User ID to save token for
     */
    registerForPushNotificationsAsync: async (uid) => {
        voipTokenUserId = uid || null;
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
            await Notifications.setNotificationChannelAsync('huddle-calls', {
                name: 'Huddle Calls',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 500, 250, 500, 250, 700],
                lightColor: '#00A99D',
                lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
                sound: 'default'
            });
        }

        if (Device.isDevice) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                console.log('Failed to get push token for push notification!');
                return;
            }

            const expoToken = (await Notifications.getExpoPushTokenAsync()).data;
            console.log("Expo Push Token:", expoToken);

            let nativeToken = null;
            try {
                const deviceToken = await Notifications.getDevicePushTokenAsync();
                nativeToken = deviceToken.data;
            } catch (error) {
                // Native token may not be available in Expo Go
            }

            // Save token to backend user profile
            if (uid && expoToken) {
                await saveUserPushToken(uid, 'expoPushTokens', expoToken);
            }

            if (uid && nativeToken) {
                await saveUserPushToken(uid, 'fcmTokens', nativeToken);
            }

            if (Platform.OS === 'ios' && VoipPushNotification) {
                registerVoipListeners();
                try {
                    VoipPushNotification.registerVoipToken();
                } catch {
                    // ignore if unavailable in this build.
                }
            }
        } else {
            console.log('Must use physical device for Push Notifications');
        }
    }
};
