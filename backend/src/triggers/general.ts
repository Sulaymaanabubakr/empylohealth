import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

// Initialize admin if not already initialized (helper check/init pattern is better in index, but fine here for now)
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();

/**
 * Trigger: Auth User OnCreate
 * Goal: Create a User Profile in Firestore when a new Auth user is created.
 */
export const onUserCreate = functions.auth.user().onCreate(async (user: admin.auth.UserRecord) => {
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
        console.log(`[Backend] User profile created for ${email} (${uid})`);
    } catch (error) {
        console.error(`[Backend] Error creating profile for ${user.email}:`, error);
    }
});

/**
 * Trigger: Firestore Message OnCreate
 * Goal: Send Push Notification to chat participants when a new message arrives.
 */
export const onMessageCreate = functions.firestore.document('chats/{chatId}/messages/{messageId}')
    .onCreate(async (snapshot, context) => {
        const message = snapshot.data();
        const { chatId } = context.params;
        const senderId = message.senderId;

        try {
            // 1. Get Chat Metadata (to find participants)
            const chatRef = db.collection('chats').doc(chatId);
            const chatDoc = await chatRef.get();
            if (!chatDoc.exists) return;

            const chatData = chatDoc.data();
            const participants = chatData?.participants || [];

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

            if (expoTokens.length === 0 && fcmTokens.length === 0) return;

            const payload = {
                title: 'New Message',
                body: message.type === 'text' ? message.text : 'Sent a photo',
                data: {
                    chatId: chatId,
                    type: 'CHAT_MESSAGE'
                }
            };

            // 4a. Send FCM notifications (native tokens)
            if (fcmTokens.length > 0) {
                const messagePayload: admin.messaging.MulticastMessage = {
                    tokens: fcmTokens,
                    notification: {
                        title: payload.title,
                        body: payload.body,
                    },
                    data: payload.data
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
                    data: payload.data
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
