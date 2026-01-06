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
/**
 * Trigger: Auth User OnCreate
 * Goal: Create a User Profile in Firestore when a new Auth user is created.
 */
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
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
    }
    catch (error) {
        console.error(`[Backend] Error creating profile for ${user.email}:`, error);
    }
});
/**
 * Trigger: Firestore Message OnCreate
 * Goal: Send Push Notification to chat participants when a new message arrives.
 */
exports.onMessageCreate = functions.firestore.document('chats/{chatId}/messages/{messageId}')
    .onCreate(async (snapshot, context) => {
    const message = snapshot.data();
    const { chatId } = context.params;
    const senderId = message.senderId;
    try {
        // 1. Get Chat Metadata (to find participants)
        const chatRef = db.collection('chats').doc(chatId);
        const chatDoc = await chatRef.get();
        if (!chatDoc.exists)
            return;
        const chatData = chatDoc.data();
        const participants = chatData?.participants || [];
        // 2. Filter out the sender
        const recipients = participants.filter((uid) => uid !== senderId);
        if (recipients.length === 0)
            return;
        // 3. Get Recipient Tokens (Assuming 'fcmTokens' field in User Profile)
        // Note: This requires a separate implementation of saving FCM tokens on frontend
        const tokens = [];
        for (const uid of recipients) {
            const userDoc = await db.collection('users').doc(uid).get();
            const userTokens = userDoc.data()?.fcmTokens || [];
            tokens.push(...userTokens);
        }
        if (tokens.length === 0)
            return;
        // 4. Send Notification
        const messagePayload = {
            tokens: tokens,
            notification: {
                title: 'New Message',
                body: message.type === 'text' ? message.text : 'Sent a photo',
            },
            data: {
                chatId: chatId,
                type: 'CHAT_MESSAGE'
            }
        };
        const response = await admin.messaging().sendEachForMulticast(messagePayload);
        console.log(`[Backend] Notifications sent: ${response.successCount}`);
        // Cleanup invalid tokens could happen here
    }
    catch (error) {
        console.error("[Backend] Error sending notification:", error);
    }
});
//# sourceMappingURL=general.js.map