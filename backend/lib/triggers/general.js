"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onMessageCreate = exports.onUserCreate = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
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
exports.onUserCreate = regionalFunctions.auth.user().onCreate(async (user) => {
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
    }
    catch (error) {
        console.error(`[Backend] Error creating profile for ${user.email}:`, error);
    }
});
/**
 * Trigger: Firestore Message OnCreate
 * Goal: Send Push Notification to chat participants when a new message arrives.
 */
exports.onMessageCreate = regionalFunctions.firestore.document('chats/{chatId}/messages/{messageId}')
    .onCreate(async (snapshot, context) => {
    const message = snapshot.data();
    const { chatId, messageId } = context.params;
    const senderId = message.senderId;
    try {
        // 1. Get Chat Metadata (to find participants)
        const chatRef = db.collection('chats').doc(chatId);
        const [chatDoc, senderDoc] = await Promise.all([
            chatRef.get(),
            db.collection('users').doc(senderId).get()
        ]);
        if (!chatDoc.exists)
            return;
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
        const recipients = participants.filter((uid) => uid !== senderId);
        if (recipients.length === 0)
            return;
        // 3. Get Recipient Tokens (Expo + FCM)
        const expoTokens = [];
        const fcmTokens = [];
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
        recipients.forEach((uid) => {
            const notifRef = db.collection('notifications').doc();
            notificationBatch.set(notifRef, {
                uid,
                title: isGroup ? circleName : senderName,
                subtitle: String(message.text || 'New message'),
                type: 'CHAT_MESSAGE',
                chatId,
                senderId,
                senderName,
                messageId,
                avatar: isGroup ? circleImage : senderImage,
                read: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        });
        await notificationBatch.commit();
        if (expoTokens.length === 0 && fcmTokens.length === 0)
            return;
        const messageText = String(message?.text || '').trim();
        const payload = {
            title: isGroup ? circleName : senderName,
            body: isGroup ? `${senderName}: ${messageText || 'New message'}` : (messageText || 'New message'),
            categoryId: 'chat-message-actions',
            data: {
                chatId: chatId,
                conversationId: chatId,
                messageId,
                senderId: String(senderId || ''),
                senderName,
                chatName: isGroup ? circleName : senderName,
                isGroup: String(isGroup),
                senderAvatar: isGroup ? circleImage : senderImage,
                chatAvatar: isGroup ? circleImage : senderImage,
                type: 'CHAT_MESSAGE',
                categoryId: 'chat-message-actions'
            }
        };
        // 4a. Send FCM notifications (native tokens)
        if (fcmTokens.length > 0) {
            const androidNotification = {
                channelId: 'default',
                tag: chatId
            };
            const apnsConfig = {
                headers: {
                    'apns-push-type': 'alert',
                    'apns-priority': '10'
                },
                payload: {
                    aps: {
                        category: 'chat-message-actions',
                        'thread-id': chatId
                    }
                }
            };
            const messagePayload = {
                tokens: fcmTokens,
                notification: {
                    title: payload.title,
                    body: payload.body,
                },
                data: payload.data,
                android: {
                    priority: 'high',
                    notification: androidNotification
                },
                apns: apnsConfig
            };
            const response = await admin.messaging().sendEachForMulticast(messagePayload);
            console.log(`[Backend] FCM notifications sent: ${response.successCount}`);
        }
        // 4b. Send Expo notifications (Expo push tokens)
        if (expoTokens.length > 0) {
            const expoMessages = expoTokens.map((token) => ({
                to: token,
                title: payload.title,
                body: payload.body,
                data: payload.data,
                categoryId: payload.categoryId
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
            }
            catch (error) {
                console.error('[Backend] Expo push error:', error);
            }
        }
        // Cleanup invalid tokens could happen here
    }
    catch (error) {
        console.error("[Backend] Error sending notification:", error);
    }
});
//# sourceMappingURL=general.js.map