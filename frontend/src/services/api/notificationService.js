import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { navigate } from '../../navigation/navigationRef';
import { nativeCallService } from '../native/nativeCallService';
import { chatService } from './chatService';
import { huddleService } from './huddleService';
import { supabase } from '../supabase/supabaseClient';
import { callableClient } from './callableClient';

let notificationRoutingInitialized = false;
let responseSubscription = null;
let receiveSubscription = null;
let voipListenersRegistered = false;
let voipTokenUserId = null;
let lastVoipToken = null;
let pushRegistrationPromise = null;
let lastInAppIncoming = { huddleId: null, ts: 0 };
const incomingHuddleDedupe = new Map();
let lastHandledNotificationResponseKey = null;
let foregroundWarningHandler = null;
const CHAT_MESSAGE_CATEGORY_ID = 'chat-message-actions';
const CHAT_MESSAGE_ACTION_REPLY = 'chat-reply';
const CHAT_MESSAGE_ACTION_MARK_READ = 'chat-mark-read';
const HUDDLE_CALL_CATEGORY_ID = 'huddle-call-actions';
const HUDDLE_CALL_ACTION_ACCEPT = 'huddle-accept';
const HUDDLE_CALL_ACTION_REJECT = 'huddle-reject';
const HUDDLE_CALLS_CHANNEL_ID = 'huddle-calls-ringtone';
const REQUIRE_NATIVE_INCOMING_CALL_UI = true;

let VoipPushNotification = null;
let currentAuthUid = null;
try {
    // Optional native module available in custom/dev builds.
    VoipPushNotification = require('react-native-voip-push-notification').default;
} catch {
    VoipPushNotification = null;
}

supabase.auth.getSession().then(({ data }) => {
    currentAuthUid = data.session?.user?.id || null;
}).catch(() => {});

supabase.auth.onAuthStateChange((_event, session) => {
    currentAuthUid = session?.user?.id || null;
});

const saveUserPushToken = async (uid, field, token) => {
    if (!uid || !token) return;
    const { data } = await supabase.auth.getSession();
    if (!data.session?.access_token) return;
    const normalizedFieldMap = {
        expoPushTokens: 'expo_push_tokens',
        fcmTokens: 'fcm_tokens',
        voipPushTokens: 'voip_push_tokens',
    };
    const normalizedField = normalizedFieldMap[field] || field;
    await callableClient.invokeWithAuth('savePushToken', { field: normalizedField, token });
};

const resolveChatNavigationPayload = async (chatId) => {
    if (!chatId) return null;
    try {
        const [{ data: chatData, error: chatError }, { data: participantRows, error: participantError }] = await Promise.all([
            supabase.from('chats').select('*').eq('id', chatId).maybeSingle(),
            supabase.from('chat_participants').select('user_id').eq('chat_id', chatId).is('left_at', null),
        ]);
        if (chatError) throw chatError;
        if (participantError) throw participantError;
        if (!chatData) return null;

        const participants = Array.isArray(participantRows) ? participantRows.map((row) => row.user_id) : [];
        const isGroup = chatData.type === 'group' || participants.length > 2 || Boolean(chatData.circle_id);

        let name = chatData.name || 'Chat';
        let avatar = chatData.avatar || chatData.photo_url || chatData.image || '';

        if (isGroup && chatData.circle_id) {
            const { data: circleData } = await supabase.from('circles').select('name, image').eq('id', chatData.circle_id).maybeSingle();
            if (circleData) {
                name = circleData.name || name;
                avatar = circleData.image || avatar;
            }
        } else if (!isGroup) {
            const otherId = participants.find((id) => id !== currentAuthUid) || participants[0];
            if (otherId) {
                const { data: profileData } = await supabase.from('profiles').select('name, photo_url').eq('id', otherId).maybeSingle();
                if (profileData) {
                    name = profileData.name || name;
                    avatar = profileData.photo_url || avatar;
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
            me: currentAuthUid || null
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
            await huddleService.updateHuddleState(huddleId, 'join').catch(() => {});
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
                navigate('ChatDetail', { chat: chatService.serializeChatForNavigation(chat) });
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
                    navigate('ChatDetail', { chat: chatService.serializeChatForNavigation(chat) });
                    return true;
                }
            }
        }

        if (type === 'HUDDLE_LIMIT_WARNING') {
            if (huddleId) {
                navigate('Huddle', {
                    chat: { id: chatId || 'chat', name: data?.chatName || 'Huddle', isGroup: true },
                    huddleId,
                    mode: 'join'
                });
                return true;
            }
            return false;
        }

        return false;
    } catch (error) {
        console.error('[NotificationRouting] Failed to route notification payload', error);
        return false;
    }
};

const markChatNotificationsAsRead = async (chatId) => {
    await chatService.markChatNotificationsRead(chatId, currentAuthUid);
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

    if (actionId === HUDDLE_CALL_ACTION_REJECT) {
        if (data?.huddleId) {
            await huddleService.declineHuddle(data.huddleId).catch(() => {});
            nativeCallService.endHuddleCall(data.huddleId);
        }
        if (notificationId) {
            await Notifications.dismissNotificationAsync(notificationId).catch(() => {});
        }
        return true;
    }

    if (actionId === HUDDLE_CALL_ACTION_ACCEPT) {
        if (notificationId) {
            await Notifications.dismissNotificationAsync(notificationId).catch(() => {});
        }
        if (data?.huddleId) {
            await huddleService.updateHuddleState(data.huddleId, 'join').catch(() => {});
            navigate('Huddle', {
                chat: { id: data?.chatId || 'chat', name: data?.chatName || 'Huddle', isGroup: true },
                huddleId: data.huddleId,
                mode: 'join',
                callTapTs: Date.now()
            });
            return true;
        }
        return false;
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
        await Notifications.setNotificationCategoryAsync(HUDDLE_CALL_CATEGORY_ID, [
            {
                identifier: HUDDLE_CALL_ACTION_ACCEPT,
                buttonTitle: 'Accept',
                options: { opensAppToForeground: true }
            },
            {
                identifier: HUDDLE_CALL_ACTION_REJECT,
                buttonTitle: 'Reject',
                options: { opensAppToForeground: false, isDestructive: true }
            }
        ]);
    } catch (error) {
        console.warn('[NotificationRouting] Failed to set notification categories', error?.message || error);
    }
};

const maybeShowNativeIncomingCall = async (payload) => {
    const data = extractNotificationData(payload);
    if (data?.type !== 'HUDDLE_STARTED' || !data?.huddleId) return false;
    const now = Date.now();
    const lastTs = Number(incomingHuddleDedupe.get(data.huddleId) || 0);
    if (now - lastTs < 15000) return true;
    incomingHuddleDedupe.set(data.huddleId, now);
    const avatar = data?.avatar || data?.senderAvatar || data?.chatAvatar || '';

    const shown = await nativeCallService.presentIncomingHuddleCall({
        huddleId: data.huddleId,
        uuid: data?.uuid || null,
        chatId: data.chatId,
        chatName: data.chatName || 'Huddle',
        callerName: data.callerName || data.chatName || 'Incoming Huddle',
        avatar
    });
    if (shown) return true;

    const nativeSupported = nativeCallService.isSupported();
    if (REQUIRE_NATIVE_INCOMING_CALL_UI && nativeSupported) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
            console.log('[IncomingHuddle] Native UI unavailable; suppressed in-app ringing fallback', {
                huddleId: data.huddleId,
                platform: Platform.OS
            });
        }
        return false;
    }

    // In-app fallback for builds without CallKeep: show accept/decline UI + ringtone.
    if (lastInAppIncoming.huddleId !== data.huddleId || (now - lastInAppIncoming.ts) > 15000) {
        lastInAppIncoming = { huddleId: data.huddleId, ts: now };
        navigate('IncomingHuddle', {
            huddleId: data.huddleId,
            chatId: data.chatId,
            chatName: data.chatName || 'Huddle',
            callerName: data.callerName || data.chatName || 'Incoming Huddle',
            avatar
        });
    }
    return true;
};

const normalizeVoipNotificationData = (notification) => {
    const direct = notification?.data || notification;
    const payload = direct?.payload || {};
    return {
        uuid: direct?.uuid || payload?.uuid || null,
        huddleId: direct?.huddleId || payload?.huddleId || payload?.huddle_id,
        chatId: direct?.chatId || payload?.chatId || payload?.chat_id,
        chatName: direct?.chatName || payload?.chatName || payload?.chat_name || 'Huddle',
        callerName: direct?.callerName || payload?.callerName || payload?.caller_name || 'Incoming Huddle',
        avatar: direct?.avatar || payload?.avatar || '',
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
                const data = extractNotificationData(notification);
                const currentUid = currentAuthUid || null;
                // Never show push for messages authored by the currently signed-in user.
                if (data?.type === 'CHAT_MESSAGE' && currentUid && String(data?.senderId || '') === currentUid) {
                    return {
                        shouldShowBanner: false,
                        shouldShowList: false,
                        shouldPlaySound: false,
                        shouldSetBadge: false
                    };
                }
                const shownAsNativeCall = await maybeShowNativeIncomingCall(notification);
                return {
                    shouldShowBanner: !shownAsNativeCall,
                    shouldShowList: !shownAsNativeCall,
                    shouldPlaySound: !shownAsNativeCall,
                    shouldSetBadge: false
                };
            }
        });

        receiveSubscription = Notifications.addNotificationReceivedListener((notification) => {
            const data = extractNotificationData(notification);
            const currentUid = currentAuthUid || null;
            if (data?.type === 'CHAT_MESSAGE' && currentUid && String(data?.senderId || '') === currentUid) {
                return;
            }
            if (data?.type === 'HUDDLE_LIMIT_WARNING' && typeof foregroundWarningHandler === 'function') {
                try {
                    foregroundWarningHandler(data);
                } catch {
                    // ignore foreground warning handler failure
                }
            }
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

    setForegroundWarningHandler: (handler) => {
        foregroundWarningHandler = typeof handler === 'function' ? handler : null;
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
