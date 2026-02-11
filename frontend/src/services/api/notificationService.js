import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { db } from '../firebaseConfig';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { navigate } from '../../navigation/navigationRef';

let notificationRoutingInitialized = false;
let responseSubscription = null;

const navigateFromNotificationData = (payload) => {
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

    return false;
};

export const notificationService = {
    initializeNotificationRouting: () => {
        if (notificationRoutingInitialized) return;
        notificationRoutingInitialized = true;

        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: false
            })
        });

        responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
            navigateFromNotificationData(response);
        });

        Notifications.getLastNotificationResponseAsync().then((response) => {
            if (response) {
                navigateFromNotificationData(response);
            }
        }).catch(() => {});
    },

    cleanupNotificationRouting: () => {
        if (responseSubscription) {
            responseSubscription.remove();
            responseSubscription = null;
        }
        notificationRoutingInitialized = false;
    },

    /**
     * Register for Push Notifications
     * @param {string} uid User ID to save token for
     */
    registerForPushNotificationsAsync: async (uid) => {
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
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
                const userRef = doc(db, 'users', uid);
                await updateDoc(userRef, {
                    expoPushTokens: arrayUnion(expoToken)
                });
            }

            if (uid && nativeToken) {
                const userRef = doc(db, 'users', uid);
                await updateDoc(userRef, {
                    fcmTokens: arrayUnion(nativeToken)
                });
            }
        } else {
            console.log('Must use physical device for Push Notifications');
        }
    }
};
