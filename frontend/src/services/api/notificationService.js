import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { db } from '../services/firebaseConfig';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

export const notificationService = {
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

            const token = (await Notifications.getExpoPushTokenAsync()).data;
            console.log("Expo Push Token:", token);

            // Save token to backend user profile
            if (uid && token) {
                const userRef = doc(db, 'users', uid);
                await updateDoc(userRef, {
                    fcmTokens: arrayUnion(token)
                });
            }
        } else {
            console.log('Must use physical device for Push Notifications');
        }
    }
};
