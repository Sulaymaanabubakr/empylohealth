import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

// Initialize admin if not already initialized (helper check/init pattern is better in index, but fine here for now)
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();
const regionalFunctions = functions.region('europe-west1');

/**
 * Trigger: Auth User OnCreate
 * Goal: Create a User Profile in Firestore when a new Auth user is created.
 */
export const onUserCreate = regionalFunctions.auth.user().onCreate(async (user: admin.auth.UserRecord) => {
    try {
        const { uid, email, displayName, photoURL } = user;

        const userDoc = {
            uid,
            email: email || '',
            name: displayName || 'New User',
            role: 'personal',
            photoURL: photoURL || '',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            settings: {
                notifications: true,
                biometrics: false
            }
        };

        await db.collection('users').doc(uid).set(userDoc);
        await db.collection('userCircles').doc(uid).set({
            circleIds: []
        }, { merge: true });
        console.log(`[Backend] User profile created for ${email} (${uid})`);
    } catch (error) {
        console.error(`[Backend] Error creating profile for ${user.email}:`, error);
    }
});

/**
 * Trigger: Firestore Message OnCreate
 * Goal: Send Push Notification to chat participants when a new message arrives.
 */
export const onMessageCreate = regionalFunctions.firestore.document('chats/{chatId}/messages/{messageId}')
    .onCreate(async (snapshot, context) => {
        const message = snapshot.data();
        const { chatId, messageId } = context.params as { chatId: string; messageId: string };
        const senderId = message.senderId;

        try {
            // 1. Get Chat Metadata (to find participants)
            const chatRef = db.collection('chats').doc(chatId);
            const [chatDoc, senderDoc] = await Promise.all([
                chatRef.get(),
                db.collection('users').doc(senderId).get()
            ]);
            if (!chatDoc.exists) return;

            const chatData = chatDoc.data() || {};
            const senderData = senderDoc.exists ? (senderDoc.data() || {}) : {};
            const participants = chatData?.participants || [];
            const isGroup = chatData.type === 'group' || participants.length > 2;
            const senderName = String(senderData?.name || senderData?.displayName || 'Someone');
            const senderImage = String(senderData?.photoURL || '');

            let circleImage = '';
            let circleName = String(chatData?.name || 'Circle');
            if (isGroup && chatData?.circleId) {
                const circleDoc = await db.collection('circles').doc(chatData.circleId).get();
                if (circleDoc.exists) {
                    const circleData = circleDoc.data() || {};
                    circleImage = String(circleData?.image || circleData?.avatar || circleData?.photoURL || '');
                    circleName = String(circleData?.name || circleName);
                }
            }

            // 2. Filter out the sender
            const recipients = participants.filter((uid: string) => uid !== senderId);

            if (recipients.length === 0) return;

            // 3. Get Recipient Tokens (Expo + FCM)
            const expoTokens: string[] = [];
            const fcmTokens: string[] = [];
            for (const uid of recipients) {
                const userDoc = await db.collection('users').doc(uid).get();
                const userData = userDoc.data() || {};
                const userExpoTokens = userData.expoPushTokens || [];
                const userFcmTokens = userData.fcmTokens || [];
                expoTokens.push(...userExpoTokens);
                fcmTokens.push(...userFcmTokens);
            }

            // 3b. Write in-app notifications for recipients
            const notificationBatch = db.batch();
            recipients.forEach((uid: string) => {
                const notifRef = db.collection('notifications').doc();
                notificationBatch.set(notifRef, {
                    uid,
                    title: isGroup ? circleName : senderName,
                    subtitle: message.type === 'text' ? message.text : 'Sent a photo',
                    type: 'CHAT_MESSAGE',
                    chatId,
                    senderId,
                    senderName,
                    messageId,
                    image: isGroup ? circleImage : senderImage,
                    read: false,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
            });
            await notificationBatch.commit();

            if (expoTokens.length === 0 && fcmTokens.length === 0) return;

            const payload = {
                title: isGroup ? circleName : senderName,
                body: message.type === 'text'
                    ? (isGroup ? `${senderName}: ${message.text}` : String(message.text || 'New message'))
                    : (isGroup ? `${senderName} sent a photo` : 'Sent a photo'),
                categoryId: 'chat-message-actions',
                data: {
                    chatId: chatId,
                    messageId,
                    senderId: String(senderId || ''),
                    senderName,
                    image: isGroup ? circleImage : senderImage,
                    type: 'CHAT_MESSAGE',
                    categoryId: 'chat-message-actions'
                },
                image: isGroup ? circleImage : senderImage
            };

            // 4a. Send FCM notifications (native tokens)
            if (fcmTokens.length > 0) {
                const androidNotification: admin.messaging.AndroidNotification = {
                    channelId: 'default',
                    ...(payload.image ? { imageUrl: payload.image } : {})
                };
                const apnsConfig: admin.messaging.ApnsConfig = {
                    payload: {
                        aps: {
                            category: 'chat-message-actions'
                        }
                    },
                    ...(payload.image ? { fcmOptions: { imageUrl: payload.image } } : {})
                };
                const messagePayload: admin.messaging.MulticastMessage = {
                    tokens: fcmTokens,
                    notification: {
                        title: payload.title,
                        body: payload.body,
                    },
                    data: payload.data,
                    android: {
                        notification: androidNotification
                    },
                    apns: apnsConfig
                };

                const response = await admin.messaging().sendEachForMulticast(messagePayload);
                console.log(`[Backend] FCM notifications sent: ${response.successCount}`);
            }

            // 4b. Send Expo notifications (Expo push tokens)
            if (expoTokens.length > 0) {
                const expoMessages = expoTokens.map((token: string) => ({
                    to: token,
                    title: payload.title,
                    body: payload.body,
                    data: payload.data,
                    categoryId: payload.categoryId,
                    ...(payload.image ? { imageUrl: payload.image } : {})
                }));

                try {
                    const response = await fetch('https://exp.host/--/api/v2/push/send', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(expoMessages)
                    });
                    const result = await response.json();
                    console.log('[Backend] Expo notifications sent:', result?.data?.length || 0);
                } catch (error) {
                    console.error('[Backend] Expo push error:', error);
                }
            }

            // Cleanup invalid tokens could happen here
        } catch (error) {
            console.error("[Backend] Error sending notification:", error);
        }
    });
