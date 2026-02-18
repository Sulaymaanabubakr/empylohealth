import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { auth, db } from '../firebaseConfig';
import { doc, arrayUnion, setDoc, getDoc } from 'firebase/firestore';
import { navigate } from '../../navigation/navigationRef';
import { nativeCallService } from '../native/nativeCallService';
import { chatService } from './chatService';

let notificationRoutingInitialized = false;
let responseSubscription = null;
let receiveSubscription = null;
let voipListenersRegistered = false;
let voipTokenUserId = null;
let lastVoipToken = null;
let pushRegistrationPromise = null;
let lastInAppIncoming = { huddleId: null, ts: 0 };
let lastHandledNotificationResponseKey = null;
const CHAT_MESSAGE_CATEGORY_ID = 'chat-message-actions';
const CHAT_MESSAGE_ACTION_REPLY = 'chat-reply';
const CHAT_MESSAGE_ACTION_MARK_READ = 'chat-mark-read';
const HUDDLE_CALLS_CHANNEL_ID = 'huddle-calls-ringtone';

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
        const data = extractNotificationData(payload);
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

        if ((type === 'CHAT_MESSAGE' || chatId) && chatId) {
            const chat = await resolveChatNavigationPayload(chatId);
            if (chat) {
                navigate('ChatDetail', { chat });
                return true;
            }
            navigate('ChatDetail', {
                chat: {
                    id: chatId,
                    name: data?.chatName || data?.senderName || 'Chat',
                    isGroup: String(data?.isGroup || '').toLowerCase() === 'true',
                    participants: []
                }
            });
            return true;
        }

        if (type === 'DAILY_AFFIRMATION') {
            navigate('Affirmations', { affirmationId: data?.affirmationId || null });
            return true;
        }

        if (type === 'SCHEDULED_HUDDLE_REMINDER') {
            if (data?.circleId) {
                navigate('CircleDetail', { circle: { id: data.circleId } });
                return true;
            }
            if (data?.chatId) {
                const chat = await resolveChatNavigationPayload(data.chatId);
                if (chat) {
                    navigate('ChatDetail', { chat });
                    return true;
                }
            }
        }

        return false;
    } catch (error) {
        console.error('[NotificationRouting] Failed to route notification payload', error);
        return false;
    }
};

const markChatNotificationsAsRead = async (chatId) => {
    await chatService.markChatNotificationsRead(chatId, auth.currentUser?.uid);
};

const handleNotificationAction = async (response) => {
    const actionId = response?.actionIdentifier;
    const data = extractNotificationData(response);
    const chatId = data?.chatId;
    const notificationId = response?.notification?.request?.identifier || null;

    if (!actionId || actionId === Notifications.DEFAULT_ACTION_IDENTIFIER) {
        return navigateFromNotificationData(response);
    }

    if (actionId === CHAT_MESSAGE_ACTION_MARK_READ) {
        if (chatId) {
            await markChatNotificationsAsRead(chatId).catch(() => {});
        }
        if (notificationId) {
            await Notifications.dismissNotificationAsync(notificationId).catch(() => {});
        }
        return true;
    }

    if (actionId === CHAT_MESSAGE_ACTION_REPLY) {
        const replyText = (response?.userText || '').trim();
        if (!chatId || !replyText) {
            if (notificationId) {
                await Notifications.dismissNotificationAsync(notificationId).catch(() => {});
            }
            return true;
        }
        await markChatNotificationsAsRead(chatId).catch(() => {});
        if (notificationId) {
            await Notifications.dismissNotificationAsync(notificationId).catch(() => {});
        }
        chatService.sendMessage(chatId, replyText, 'text', null).catch((error) => {
            console.error('[NotificationRouting] Quick reply failed', error);
        });
        return true;
    }

    return navigateFromNotificationData(response);
};

const getNotificationResponseKey = (response) => {
    const id = response?.notification?.request?.identifier || '';
    const action = response?.actionIdentifier || '';
    const data = extractNotificationData(response);
    return `${id}:${action}:${data?.type || ''}:${data?.chatId || ''}:${data?.huddleId || ''}:${data?.affirmationId || ''}`;
};

const consumeNotificationResponse = async (response) => {
    if (!response) return false;
    const key = getNotificationResponseKey(response);
    if (key && key === lastHandledNotificationResponseKey) return false;
    lastHandledNotificationResponseKey = key;
    await Notifications.clearLastNotificationResponseAsync().catch(() => {});
    return true;
};

const configureNotificationCategories = async () => {
    try {
        await Notifications.setNotificationCategoryAsync(CHAT_MESSAGE_CATEGORY_ID, [
            {
                identifier: CHAT_MESSAGE_ACTION_REPLY,
                buttonTitle: 'Reply',
                options: { opensAppToForeground: false },
                textInput: {
                    submitButtonTitle: 'Send',
                    placeholder: 'Type a reply...'
                }
            },
            {
                identifier: CHAT_MESSAGE_ACTION_MARK_READ,
                buttonTitle: 'Mark as read',
                options: { opensAppToForeground: false }
            }
        ]);
    } catch (error) {
        console.warn('[NotificationRouting] Failed to set notification categories', error?.message || error);
    }
};

const maybeShowNativeIncomingCall = async (payload) => {
    const data = extractNotificationData(payload);
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
        lastVoipToken = token || null;
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
        configureNotificationCategories().catch(() => {});

        Notifications.setNotificationHandler({
            handleNotification: async (notification) => {
                const shownAsNativeCall = await maybeShowNativeIncomingCall(notification);
                return {
                    shouldShowBanner: !shownAsNativeCall,
                    shouldShowList: !shownAsNativeCall,
                    shouldPlaySound: true,
                    shouldSetBadge: false
                };
            }
        });

        receiveSubscription = Notifications.addNotificationReceivedListener((notification) => {
            maybeShowNativeIncomingCall(notification);
        });

        responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
            consumeNotificationResponse(response)
                .then((shouldHandle) => {
                    if (!shouldHandle) return;
                    return handleNotificationAction(response);
                })
                .catch((error) => {
                    console.error('[NotificationRouting] Response listener failure', error);
                });
        });

        Notifications.getLastNotificationResponseAsync().then((response) => {
            if (response) {
                consumeNotificationResponse(response)
                    .then((shouldHandle) => {
                        if (!shouldHandle) return;
                        return handleNotificationAction(response);
                    })
                    .catch((error) => {
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
        if (pushRegistrationPromise) return pushRegistrationPromise;
        pushRegistrationPromise = (async () => {
            voipTokenUserId = uid || null;

            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('default', {
                    name: 'default',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#FF231F7C',
                });
                await Notifications.setNotificationChannelAsync('messages-default', {
                    name: 'Messages',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 180, 120, 180],
                    sound: 'default',
                    lightColor: '#00A99D'
                });
                await Notifications.setNotificationChannelAsync('messages-silent', {
                    name: 'Messages (Silent)',
                    importance: Notifications.AndroidImportance.HIGH,
                    vibrationPattern: [0],
                    sound: null,
                    lightColor: '#9CA3AF'
                });
                await Notifications.setNotificationChannelAsync('huddle-calls', {
                    name: 'Huddle Calls',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 500, 250, 500, 250, 700],
                    lightColor: '#00A99D',
                    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
                    sound: 'default'
                });
                await Notifications.setNotificationChannelAsync(HUDDLE_CALLS_CHANNEL_ID, {
                    name: 'Huddle Calls (Ringtone)',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0],
                    lightColor: '#00A99D',
                    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
                    sound: 'default'
                });
            }

            if (!Device.isDevice) {
                console.log('Must use physical device for Push Notifications');
                return;
            }

            try {
                const { status: existingStatus } = await Notifications.getPermissionsAsync();
                let finalStatus = existingStatus;

                if (existingStatus !== 'granted') {
                    const { status } = await Notifications.requestPermissionsAsync({
                        ios: {
                            allowAlert: true,
                            allowBadge: true,
                            allowSound: true
                        }
                    });
                    finalStatus = status;
                }

                if (finalStatus !== 'granted') {
                    console.log('Failed to get push token for push notification!');
                    return;
                }

                const projectId = Constants?.expoConfig?.extra?.eas?.projectId || Constants?.easConfig?.projectId;
                const expoToken = (await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)).data;
                console.log('Expo Push Token:', expoToken);

                let nativeToken = null;
                try {
                    const deviceToken = await Notifications.getDevicePushTokenAsync();
                    nativeToken = deviceToken.data;
                } catch {
                    // Native token may not be available in all dev environments.
                }

                if (uid && expoToken) {
                    await saveUserPushToken(uid, 'expoPushTokens', expoToken);
                }

                if (uid && nativeToken) {
                    await saveUserPushToken(uid, 'fcmTokens', nativeToken);
                }

                // VoIP token registration is already triggered natively in AppDelegate.
                // Avoid forcing an extra native register call during permission flow.
                if (Platform.OS === 'ios' && VoipPushNotification) {
                    registerVoipListeners();
                    if (uid && lastVoipToken) {
                        await saveUserPushToken(uid, 'voipPushTokens', lastVoipToken);
                    }
                }
            } catch (error) {
                console.warn('[PushRegistration] registration failed', error?.message || error);
            }
        })();

        try {
            await pushRegistrationPromise;
        } finally {
            pushRegistrationPromise = null;
        }
    }
};
const toObject = (value) => {
    if (!value) return {};
    if (typeof value === 'object') return value;
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch {
            return {};
        }
    }
    return {};
};

const extractNotificationData = (payload) => {
    const responseData = toObject(payload?.notification?.request?.content?.data);
    const directData = toObject(payload?.data);
    const requestData = toObject(payload?.request?.content?.data);
    const triggerData = toObject(payload?.notification?.request?.trigger?.remoteMessage?.data);
    const remoteMessageData = toObject(payload?.request?.trigger?.remoteMessage?.data);
    const apsCustomData = toObject(payload?.notification?.request?.trigger?.payload);
    const nestedData = toObject(responseData?.data);
    return {
        ...apsCustomData,
        ...remoteMessageData,
        ...triggerData,
        ...requestData,
        ...directData,
        ...responseData,
        ...nestedData
    };
};
