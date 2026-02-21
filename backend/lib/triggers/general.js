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
                biometrics: false,
                securityNotifications: true,
                msgShow: true,
                msgSound: true,
                groupShow: true,
                groupSound: true,
                showPreview: true
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
        const senderExpoTokens = new Set((Array.isArray(senderData?.expoPushTokens) ? senderData.expoPushTokens : [])
            .map((token) => String(token || '').trim())
            .filter(Boolean));
        const senderFcmTokens = new Set((Array.isArray(senderData?.fcmTokens) ? senderData.fcmTokens : [])
            .map((token) => String(token || '').trim())
            .filter(Boolean));
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
        // 3. Resolve per-recipient notification preferences
        const recipientPrefs = (await Promise.all(recipients.map(async (uid) => {
            const userDoc = await db.collection('users').doc(uid).get();
            const userData = userDoc.data() || {};
            const settings = userData?.settings || {};
            const mutedChatIds = Array.isArray(userData?.mutedChatIds) ? userData.mutedChatIds : [];
            const chatMuted = mutedChatIds.includes(chatId);
            const showNotifications = isGroup
                ? (settings.groupShow ?? true)
                : (settings.msgShow ?? true);
            const showPreview = settings.showPreview ?? true;
            const playSound = isGroup
                ? (settings.groupSound ?? true)
                : (settings.msgSound ?? true);
            return {
                uid,
                showNotifications: showNotifications && !chatMuted,
                showPreview,
                playSound,
                // Defensive filter: exclude sender-owned tokens in case tokens
                // were left attached to multiple user accounts on the same device.
                expoTokens: (Array.isArray(userData.expoPushTokens) ? userData.expoPushTokens : [])
                    .map((token) => String(token || '').trim())
                    .filter((token) => token && !senderExpoTokens.has(token)),
                fcmTokens: (Array.isArray(userData.fcmTokens) ? userData.fcmTokens : [])
                    .map((token) => String(token || '').trim())
                    .filter((token) => token && !senderFcmTokens.has(token))
            };
        }))).filter((row) => row.showNotifications);
        if (recipientPrefs.length === 0)
            return;
        // 3b. Write in-app notifications for recipients
        const notificationBatch = db.batch();
        const messageText = String(message?.text || '').trim();
        recipientPrefs.forEach((recipient) => {
            const subtitle = recipient.showPreview
                ? String(messageText || 'New message')
                : 'New message';
            const notifRef = db.collection('notifications').doc();
            notificationBatch.set(notifRef, {
                uid: recipient.uid,
                title: isGroup ? circleName : senderName,
                subtitle,
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
        // 4. Send recipient-specific push payloads (filters + preview masking + sound settings)
        const fcmMessages = [];
        const expoMessages = [];
        const seenFcmTokens = new Set();
        const seenExpoTokens = new Set();
        recipientPrefs.forEach((recipient) => {
            const body = recipient.showPreview
                ? (isGroup ? `${senderName}: ${messageText || 'New message'}` : (messageText || 'New message'))
                : (isGroup ? `${senderName}: New message` : 'New message');
            const data = {
                chatId,
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
            };
            recipient.fcmTokens.forEach((token) => {
                if (seenFcmTokens.has(token))
                    return;
                seenFcmTokens.add(token);
                fcmMessages.push({
                    token,
                    notification: {
                        title: isGroup ? circleName : senderName,
                        body
                    },
                    data,
                    android: {
                        priority: 'high',
                        notification: {
                            channelId: recipient.playSound ? 'messages-default' : 'messages-silent',
                            tag: chatId
                        }
                    },
                    apns: {
                        headers: {
                            'apns-push-type': 'alert',
                            'apns-priority': '10'
                        },
                        payload: {
                            aps: {
                                category: 'chat-message-actions',
                                'thread-id': chatId,
                                ...(recipient.playSound ? { sound: 'default' } : {})
                            }
                        }
                    }
                });
            });
            recipient.expoTokens.forEach((token) => {
                if (seenExpoTokens.has(token))
                    return;
                seenExpoTokens.add(token);
                expoMessages.push({
                    to: token,
                    title: isGroup ? circleName : senderName,
                    body,
                    data,
                    categoryId: 'chat-message-actions',
                    channelId: recipient.playSound ? 'messages-default' : 'messages-silent',
                    ...(recipient.playSound ? { sound: 'default' } : {})
                });
            });
        });
        if (fcmMessages.length > 0) {
            const response = await admin.messaging().sendEach(fcmMessages);
            const successCount = response.responses.filter((r) => r.success).length;
            console.log(`[Backend] FCM notifications sent: ${successCount}/${fcmMessages.length}`);
        }
        if (expoMessages.length > 0) {
            try {
                const chunkSize = 100;
                let sent = 0;
                for (let i = 0; i < expoMessages.length; i += chunkSize) {
                    const chunk = expoMessages.slice(i, i + chunkSize);
                    const response = await fetch('https://exp.host/--/api/v2/push/send', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(chunk)
                    });
                    const result = await response.json();
                    sent += Array.isArray(result?.data) ? result.data.length : chunk.length;
                }
                console.log('[Backend] Expo notifications sent:', sent);
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