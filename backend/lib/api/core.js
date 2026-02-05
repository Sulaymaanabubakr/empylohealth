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
exports.deleteUserAccount = exports.submitContactForm = exports.sendAffirmationsEvening = exports.sendAffirmationsAfternoon = exports.sendAffirmationsMorning = exports.getSeedStatus = exports.seedAll = exports.backfillAffirmationImages = exports.seedAffirmations = exports.getAffirmations = exports.getExploreContent = exports.resolveCircleReport = exports.submitReport = exports.deleteScheduledHuddle = exports.scheduleHuddle = exports.updateHuddleState = exports.startHuddle = exports.updateSubscription = exports.getRecommendedContent = exports.getKeyChallenges = exports.getUserStats = exports.seedResources = exports.seedChallenges = exports.seedAssessmentQuestions = exports.submitAssessment = exports.sendMessage = exports.createDirectChat = exports.handleJoinRequest = exports.manageMember = exports.leaveCircle = exports.joinCircle = exports.updateCircle = exports.createCircle = exports.generateUploadSignature = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const cloudinary_1 = require("cloudinary");
const seedData_1 = require("../seedData");
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();
// Configure Cloudinary
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
    api_key: process.env.CLOUDINARY_API_KEY || '',
    api_secret: process.env.CLOUDINARY_API_SECRET || ''
});
const getTodayKey = () => new Date().toISOString().slice(0, 10);
const pickRandomItems = (items, count) => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = copy[i];
        copy[i] = copy[j];
        copy[j] = temp;
    }
    return copy.slice(0, Math.min(count, copy.length));
};
const requireAdmin = (context) => {
    if (!context.auth?.token?.admin) {
        throw new functions.https.HttpsError('permission-denied', 'Admin privileges required.');
    }
};
// ==========================================
// MEDIA FUNCTIONS
// ==========================================
/**
 * Generate a signature for client-side uploads.
 * Callable Function: 'generateUploadSignature'
 */
exports.generateUploadSignature = functions.https.onCall((data, context) => {
    // Ensure user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }
    if (!process.env.CLOUDINARY_API_SECRET || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_CLOUD_NAME) {
        throw new functions.https.HttpsError('failed-precondition', 'Cloudinary is not configured.');
    }
    const timestamp = Math.round((new Date()).getTime() / 1000);
    const signature = cloudinary_1.v2.utils.api_sign_request({
        timestamp: timestamp,
        folder: data.folder || 'avatars',
    }, process.env.CLOUDINARY_API_SECRET || '');
    return {
        signature,
        timestamp,
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY
    };
});
// ==========================================
// CIRCLE FUNCTIONS
// ==========================================
/**
 * Create a new Circle
 * Callable Function: 'createCircle'
 */
/**
 * Create a new Circle
 * Callable Function: 'createCircle'
 */
exports.createCircle = functions.https.onCall(async (data, context) => {
    // 1. Auth Check
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }
    const { name, description, category, type = 'public', image = null, visibility = 'visible' } = data;
    const uid = context.auth.uid;
    // 2. Validation
    if (!name) {
        throw new functions.https.HttpsError('invalid-argument', 'Circle name is required.');
    }
    try {
        const batch = db.batch();
        // 3. Create Circle Doc
        const circleRef = db.collection('circles').doc();
        const circleData = {
            id: circleRef.id,
            name,
            description: description || '',
            category: category || 'General',
            image: image || null,
            status: 'active',
            type: type || 'public', // 'public' | 'private'
            visibility: visibility || 'visible', // 'visible' | 'hidden'
            joinSettings: {
                requiresApproval: type === 'private',
                questions: []
            },
            adminId: uid,
            members: [uid], // Kept for backward compatibility / quick checks (limit ~20k in array)
            memberCount: 1,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        batch.set(circleRef, circleData);
        // 4. Create Creator Member in Subcollection (The Scalable Source of Truth)
        const memberRef = circleRef.collection('members').doc(uid);
        batch.set(memberRef, {
            uid,
            role: 'creator', // 'creator' | 'admin' | 'moderator' | 'member'
            status: 'active',
            joinedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // 4b. Maintain userCircles index
        const userCirclesRef = db.collection('userCircles').doc(uid);
        batch.set(userCirclesRef, {
            circleIds: admin.firestore.FieldValue.arrayUnion(circleRef.id)
        }, { merge: true });
        batch.set(userCirclesRef.collection('circles').doc(circleRef.id), {
            circleId: circleRef.id,
            role: 'creator',
            status: 'member',
            joinedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        // 5. Chat creation logic
        const chatRef = db.collection('chats').doc();
        batch.set(chatRef, {
            type: 'group',
            name,
            circleId: circleRef.id,
            participants: [uid],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        batch.update(circleRef, { chatId: chatRef.id });
        // Remove userCircles index
        const userCirclesSnap = await db.collection('userCircles').doc(uid).collection('circles').get();
        userCirclesSnap.docs.forEach((docSnap) => {
            batch.delete(docSnap.ref);
        });
        batch.delete(db.collection('userCircles').doc(uid));
        await batch.commit();
        console.log(`[Circles] Circle created: ${name} (${circleRef.id}) by ${uid}`);
        return { success: true, circleId: circleRef.id };
    }
    catch (error) {
        console.error("Error creating circle:", error);
        throw new functions.https.HttpsError('internal', 'Unable to create circle.');
    }
});
/**
 * Update Circle Details (Creator/Admin Only)
 * Callable Function: 'updateCircle'
 */
exports.updateCircle = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    const { circleId, name, description, type, settings } = data;
    const uid = context.auth.uid;
    if (!circleId)
        throw new functions.https.HttpsError('invalid-argument', 'Circle ID required.');
    try {
        const circleRef = db.collection('circles').doc(circleId);
        // 1. Permission Check
        const memberRef = circleRef.collection('members').doc(uid);
        const memberDoc = await memberRef.get();
        if (!memberDoc.exists)
            throw new functions.https.HttpsError('permission-denied', 'Not a member.');
        const role = memberDoc.data()?.role;
        if (!['creator', 'admin'].includes(role)) {
            throw new functions.https.HttpsError('permission-denied', 'Admin privileges required.');
        }
        // 2. Prepare Update Data
        const updates = {
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        if (name)
            updates.name = name;
        if (description !== undefined)
            updates.description = description;
        if (type) {
            updates.type = type; // 'public' | 'private'
            updates['joinSettings.requiresApproval'] = (type === 'private');
        }
        if (settings) {
            // merge settings (e.g. allowMemberHuddles)
            updates.settings = settings;
        }
        await circleRef.update(updates);
        return { success: true };
    }
    catch (error) {
        console.error("Error updating circle:", error);
        throw new functions.https.HttpsError('internal', 'Unable to update circle.');
    }
});
/**
 * Join an existing Circle
 * Callable Function: 'joinCircle'
 */
/**
 * Join an existing Circle
 * Callable Function: 'joinCircle'
 */
exports.joinCircle = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }
    const { circleId, answers = {} } = data; // answers for join questions
    const uid = context.auth.uid;
    if (!circleId) {
        throw new functions.https.HttpsError('invalid-argument', 'Circle ID is required.');
    }
    try {
        const circleRef = db.collection('circles').doc(circleId);
        const circleDoc = await circleRef.get();
        if (!circleDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Circle not found.');
        }
        const circleData = circleDoc.data() || {};
        const isPrivate = circleData.type === 'private';
        const requiresApproval = circleData.joinSettings?.requiresApproval || isPrivate;
        const members = circleData.members || [];
        // Already a member check
        if (members.includes(uid)) {
            // Check subcollection to be sure (and sync if needed)
            const memberDoc = await circleRef.collection('members').doc(uid).get();
            if (memberDoc.exists)
                return { success: true, message: 'Already a member' };
        }
        // Check if already requested
        if (requiresApproval) {
            const requestRef = circleRef.collection('requests').doc(uid);
            const requestDoc = await requestRef.get();
            if (requestDoc.exists) {
                return { success: true, status: 'pending', message: 'Request already sent' };
            }
            // Create Join Request
            const userRecord = await admin.auth().getUser(uid);
            await requestRef.set({
                uid,
                displayName: userRecord.displayName || 'User',
                photoURL: userRecord.photoURL || '',
                answers,
                status: 'pending',
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
            return { success: true, status: 'pending', message: 'Join request sent' };
        }
        // Direct Join (Public)
        const batch = db.batch();
        // 1. Add to Members Subcollection
        const memberRef = circleRef.collection('members').doc(uid);
        batch.set(memberRef, {
            uid,
            role: 'member',
            status: 'active',
            joinedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // Maintain userCircles index
        const userCirclesRef = db.collection('userCircles').doc(uid);
        batch.set(userCirclesRef, {
            circleIds: admin.firestore.FieldValue.arrayUnion(circleId)
        }, { merge: true });
        batch.set(userCirclesRef.collection('circles').doc(circleId), {
            circleId,
            role: 'member',
            status: 'member',
            joinedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        // 2. Update Circle Doc (Array + Count) for compatibility
        batch.update(circleRef, {
            members: admin.firestore.FieldValue.arrayUnion(uid),
            memberCount: admin.firestore.FieldValue.increment(1)
        });
        // 3. Add to Chat Participants
        if (circleData.chatId) {
            const chatRef = db.collection('chats').doc(circleData.chatId);
            batch.update(chatRef, {
                participants: admin.firestore.FieldValue.arrayUnion(uid),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
        await batch.commit();
        console.log(`[Circles] User ${uid} joined circle ${circleId} (Public)`);
        return { success: true, status: 'joined' };
    }
    catch (error) {
        console.error("Error joining circle:", error);
        throw new functions.https.HttpsError('internal', 'Unable to join circle.');
    }
});
/**
 * Leave an existing Circle
 * Callable Function: 'leaveCircle'
 */
/**
 * Leave an existing Circle
 * Callable Function: 'leaveCircle'
 */
exports.leaveCircle = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }
    const { circleId } = data;
    const uid = context.auth.uid;
    if (!circleId) {
        throw new functions.https.HttpsError('invalid-argument', 'Circle ID is required.');
    }
    try {
        const circleRef = db.collection('circles').doc(circleId);
        const circleDoc = await circleRef.get();
        if (!circleDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Circle not found.');
        }
        const circleData = circleDoc.data() || {};
        // Check if user is Creator
        if (circleData.adminId === uid) {
            throw new functions.https.HttpsError('failed-precondition', 'Creators cannot leave without transferring ownership.');
        }
        const batch = db.batch();
        // 1. Remove from Members subcollection
        const memberRef = circleRef.collection('members').doc(uid);
        batch.delete(memberRef);
        // 2. Remove from Circle Array
        batch.update(circleRef, {
            members: admin.firestore.FieldValue.arrayRemove(uid),
            memberCount: admin.firestore.FieldValue.increment(-1),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // 2b. Remove from userCircles index
        const userCirclesRef = db.collection('userCircles').doc(uid);
        batch.set(userCirclesRef, {
            circleIds: admin.firestore.FieldValue.arrayRemove(circleId)
        }, { merge: true });
        batch.delete(userCirclesRef.collection('circles').doc(circleId));
        // 3. Update Chat
        if (circleData.chatId) {
            const chatRef = db.collection('chats').doc(circleData.chatId);
            batch.update(chatRef, {
                participants: admin.firestore.FieldValue.arrayRemove(uid),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
        await batch.commit();
        console.log(`[Circles] User ${uid} left circle ${circleId}`);
        return { success: true };
    }
    catch (error) {
        console.error("Error leaving circle:", error);
        throw new functions.https.HttpsError('internal', 'Unable to leave circle.');
    }
});
/**
 * Manage Member (Promote/Demote/Kick/Ban)
 * Callable Function: 'manageMember'
 */
exports.manageMember = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    const { circleId, targetUid, action } = data; // action: 'promote_admin' | 'promote_mod' | 'demote' | 'kick' | 'ban' | 'mute'
    const uid = context.auth.uid;
    try {
        const circleRef = db.collection('circles').doc(circleId);
        // 1. Verify Requestor Permissions
        const requestorRef = circleRef.collection('members').doc(uid);
        const requestorDoc = await requestorRef.get();
        if (!requestorDoc.exists)
            throw new functions.https.HttpsError('permission-denied', 'You are not a member.');
        const requestorRole = requestorDoc.data()?.role;
        if (!['creator', 'admin'].includes(requestorRole)) {
            throw new functions.https.HttpsError('permission-denied', 'Admin privileges required.');
        }
        // 2. Verify Target
        const targetRef = circleRef.collection('members').doc(targetUid);
        const targetDoc = await targetRef.get();
        if (!targetDoc.exists)
            throw new functions.https.HttpsError('not-found', 'Target user not found in circle.');
        const targetRole = targetDoc.data()?.role;
        // 3. Permission Checks
        if (targetRole === 'creator')
            throw new functions.https.HttpsError('permission-denied', 'Cannot modify Creator.');
        if (requestorRole === 'admin' && targetRole === 'admin')
            throw new functions.https.HttpsError('permission-denied', 'Admins cannot modify other Admins.');
        const batch = db.batch();
        switch (action) {
            case 'promote_admin':
                batch.update(targetRef, { role: 'admin' });
                break;
            case 'promote_mod':
                batch.update(targetRef, { role: 'moderator' });
                break;
            case 'demote':
                batch.update(targetRef, { role: 'member' });
                break;
            case 'kick':
                batch.delete(targetRef);
                batch.update(circleRef, {
                    members: admin.firestore.FieldValue.arrayRemove(targetUid),
                    memberCount: admin.firestore.FieldValue.increment(-1)
                });
                batch.set(db.collection('userCircles').doc(targetUid), {
                    circleIds: admin.firestore.FieldValue.arrayRemove(circleId)
                }, { merge: true });
                batch.delete(db.collection('userCircles').doc(targetUid).collection('circles').doc(circleId));
                // Remove from Chat
                const circleData = (await circleRef.get()).data();
                if (circleData?.chatId) {
                    batch.update(db.collection('chats').doc(circleData.chatId), {
                        participants: admin.firestore.FieldValue.arrayRemove(targetUid)
                    });
                }
                break;
            case 'ban':
                batch.update(targetRef, { status: 'banned', role: 'member' }); // Keep record but banned
                batch.update(circleRef, {
                    members: admin.firestore.FieldValue.arrayRemove(targetUid), // Remove from quick access array
                    memberCount: admin.firestore.FieldValue.increment(-1)
                });
                batch.set(db.collection('userCircles').doc(targetUid), {
                    circleIds: admin.firestore.FieldValue.arrayRemove(circleId)
                }, { merge: true });
                batch.delete(db.collection('userCircles').doc(targetUid).collection('circles').doc(circleId));
                // Remove from Chat
                const cData = (await circleRef.get()).data();
                if (cData?.chatId) {
                    batch.update(db.collection('chats').doc(cData.chatId), {
                        participants: admin.firestore.FieldValue.arrayRemove(targetUid)
                    });
                }
                break;
            default:
                throw new functions.https.HttpsError('invalid-argument', 'Invalid action.');
        }
        await batch.commit();
        return { success: true };
    }
    catch (error) {
        console.error("Error managing member:", error);
        throw error; // Re-throw generic or specific error
    }
});
/**
 * Handle Join Request (Accept/Reject)
 * Callable Function: 'handleJoinRequest'
 */
exports.handleJoinRequest = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    const { circleId, targetUid, action } = data; // action: 'accept' | 'reject'
    const uid = context.auth.uid;
    try {
        const circleRef = db.collection('circles').doc(circleId);
        // 1. Verify Permission
        const requestorDoc = await circleRef.collection('members').doc(uid).get();
        if (!requestorDoc.exists || !['creator', 'admin', 'moderator'].includes(requestorDoc.data()?.role)) {
            throw new functions.https.HttpsError('permission-denied', 'Moderator privileges required.');
        }
        const requestRef = circleRef.collection('requests').doc(targetUid);
        const requestDoc = await requestRef.get();
        if (!requestDoc.exists)
            throw new functions.https.HttpsError('not-found', 'Request not found.');
        const batch = db.batch();
        if (action === 'accept') {
            // Move to Members
            batch.set(circleRef.collection('members').doc(targetUid), {
                uid: targetUid,
                role: 'member',
                status: 'active',
                joinedAt: admin.firestore.FieldValue.serverTimestamp(),
                approvedBy: uid
            });
            // Maintain userCircles index
            const userCirclesRef = db.collection('userCircles').doc(targetUid);
            batch.set(userCirclesRef, {
                circleIds: admin.firestore.FieldValue.arrayUnion(circleId)
            }, { merge: true });
            batch.set(userCirclesRef.collection('circles').doc(circleId), {
                circleId,
                role: 'member',
                status: 'member',
                joinedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            // Update Circle Stats
            batch.update(circleRef, {
                members: admin.firestore.FieldValue.arrayUnion(targetUid),
                memberCount: admin.firestore.FieldValue.increment(1)
            });
            // Add to Chat
            const circleData = (await circleRef.get()).data();
            if (circleData?.chatId) {
                batch.update(db.collection('chats').doc(circleData.chatId), {
                    participants: admin.firestore.FieldValue.arrayUnion(targetUid)
                });
            }
            // Delete Request
            batch.delete(requestRef);
        }
        else if (action === 'reject') {
            batch.delete(requestRef);
            // Optionally keep a rejection record? For now, delete.
        }
        await batch.commit();
        return { success: true };
    }
    catch (error) {
        console.error("Error handling request:", error);
        throw error;
    }
});
// ==========================================
// CHAT FUNCTIONS
// ==========================================
/**
 * Create or Get Direct Chat
 * Callable Function: 'createDirectChat'
 */
exports.createDirectChat = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }
    const { recipientId } = data;
    const uid = context.auth.uid;
    if (!recipientId)
        throw new functions.https.HttpsError('invalid-argument', 'Recipient ID required.');
    if (recipientId === uid) {
        throw new functions.https.HttpsError('invalid-argument', 'Recipient must be a different user.');
    }
    try {
        // Check if chat already exists
        const snapshot = await db.collection('chats')
            .where('type', '==', 'direct')
            .where('participants', 'array-contains', uid)
            .get();
        let existingChatId = null;
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.participants.includes(recipientId)) {
                existingChatId = doc.id;
            }
        });
        if (existingChatId) {
            return { success: true, chatId: existingChatId, isNew: false };
        }
        // Create new chat
        const chatRef = db.collection('chats').doc();
        await chatRef.set({
            type: 'direct',
            participants: [uid, recipientId],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            lastMessage: '',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return { success: true, chatId: chatRef.id, isNew: true };
    }
    catch (error) {
        console.error("Error creating chat:", error);
        throw new functions.https.HttpsError('internal', 'Unable to create chat.');
    }
});
/**
 * Send a Message
 * Callable Function: 'sendMessage'
 */
exports.sendMessage = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }
    const { chatId, text, type = 'text', mediaUrl = null } = data;
    const uid = context.auth.uid;
    if (!chatId || (!text && !mediaUrl)) {
        throw new functions.https.HttpsError('invalid-argument', 'Chat ID and message content are required.');
    }
    if (type === 'text' && !text) {
        throw new functions.https.HttpsError('invalid-argument', 'Text messages require text.');
    }
    const allowedTypes = ['text', 'image', 'video', 'system'];
    if (!allowedTypes.includes(type)) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid message type.');
    }
    if (type === 'system') {
        throw new functions.https.HttpsError('permission-denied', 'System messages are not allowed from clients.');
    }
    try {
        const chatRef = db.collection('chats').doc(chatId);
        const chatDoc = await chatRef.get();
        if (!chatDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Chat not found.');
        }
        const chatData = chatDoc.data();
        const participants = chatData?.participants || [];
        if (!participants.includes(uid)) {
            throw new functions.https.HttpsError('permission-denied', 'Not a chat participant.');
        }
        const messageData = {
            senderId: uid,
            text,
            type, // 'text' | 'image' | 'video'
            mediaUrl,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            readBy: [uid]
        };
        // Add to subcollection
        await chatRef.collection('messages').add(messageData);
        // Update parent
        await chatRef.update({
            lastMessage: type === 'text' ? text : '📷 Media',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return { success: true };
    }
    catch (error) {
        console.error("Error sending message:", error);
        throw new functions.https.HttpsError('internal', 'Unable to send message.');
    }
});
// ==========================================
// ASSESSMENT FUNCTIONS
// ==========================================
/**
 * Submit Daily Check-in / Assessment
 * Callable Function: 'submitAssessment'
 */
exports.submitAssessment = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    const { type, score, answers, mood } = data; // type: 'daily' | 'questionnaire'
    const uid = context.auth.uid;
    try {
        await db.collection('assessments').add({
            uid,
            type: type || 'daily',
            score: score || 0,
            mood: mood || '', // For daily emoji check-ins
            answers: answers || {}, // Map of questionId or QuestionText: answer
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // Theme Analysis Logic
        if (type === 'questionnaire' && answers) {
            // Standard Likert Scale Mapping
            const optionScore = {
                "Not at all": 1,
                "Rarely": 2,
                "Sometimes": 3,
                "Most times": 4,
                "Always": 5
            };
            // 1. Initialize Themes (Default to 5 = Good State/Low Risk)
            // We'll fetch dynamic questions to calculate actual scores
            const themes = {
                'Stress': 5,
                'Motivation': 5,
                'Energy': 5,
                'Social Connection': 5,
                'Focus': 5
            };
            // Helper to track averages so we don't just overwrite
            const themeAggregates = {};
            // 2. Fetch Questions from DB
            // Optimization: In production, cached via variable or standard caching strategy. 
            // For now, fast fetch.
            const questionsSnap = await db.collection('assessment_questions').where('isActive', '==', true).get();
            const dbQuestions = questionsSnap.docs.map(d => d.data());
            // If DB is empty, fallback to legacy hardcoded logic to prevent breaking
            if (dbQuestions.length === 0) {
                const legacyThemes = { ...themes };
                Object.entries(answers).forEach(([question, answer]) => {
                    const val = optionScore[String(answer)] || 3;
                    if (question.includes('relaxed'))
                        legacyThemes['Stress'] = val;
                    if (question.includes('useful'))
                        legacyThemes['Motivation'] = val;
                    if (question.includes('energy'))
                        legacyThemes['Energy'] = val;
                    if (question.includes('interested'))
                        legacyThemes['Social Connection'] = val;
                    if (question.includes('thinking'))
                        legacyThemes['Focus'] = val;
                });
                // Update User Stats
                await db.collection('users').doc(uid).set({
                    stats: {
                        lastAssessmentDate: admin.firestore.FieldValue.serverTimestamp(),
                        themes: legacyThemes,
                        overallScore: score
                    }
                }, { merge: true });
                return { success: true };
            }
            // 3. Dynamic Calculation
            Object.entries(answers).forEach(([questionText, answerVal]) => {
                // Normalize Answer
                let numericVal = 3;
                if (typeof answerVal === 'number')
                    numericVal = answerVal;
                else
                    numericVal = optionScore[String(answerVal)] || 3;
                // Find matching Question in DB (by exact text match for now)
                // In future, Frontend should send ID.
                const matchedQ = dbQuestions.find(q => q.text.trim() === questionText.trim());
                if (matchedQ && matchedQ.tags) {
                    matchedQ.tags.forEach((tag) => {
                        if (!themeAggregates[tag])
                            themeAggregates[tag] = { total: 0, count: 0 };
                        // Apply Weight if exists (default 1)
                        // If weight is negative, it reverses the scale? 
                        // Current logic: Higher Score = Better State.
                        // If Question is "I feel anxious" (Negative), Answer "Always" (5) -> High Anxiety -> Low Well-being Score.
                        // So for "I feel anxious", we want 5 -> 1. (6 - 5).
                        // Let's assume content weight handles this, or consistent Positive Questions.
                        // Currently hardcoded questions are all Positive ("Relaxed", "Useful").
                        // So direct mapping 1=Bad, 5=Good works.
                        themeAggregates[tag].total += numericVal;
                        themeAggregates[tag].count += 1;
                    });
                }
            });
            // 4. Finalize Averages
            Object.entries(themeAggregates).forEach(([tag, agg]) => {
                if (agg.count > 0) {
                    themes[tag] = Math.round(agg.total / agg.count);
                }
            });
            // Update User Stats
            await db.collection('users').doc(uid).set({
                stats: {
                    lastAssessmentDate: admin.firestore.FieldValue.serverTimestamp(),
                    themes,
                    overallScore: score
                }
            }, { merge: true });
        }
        return { success: true };
    }
    catch (error) {
        console.error("Error submitting assessment:", error);
        throw new functions.https.HttpsError('internal', 'Unable to submit assessment.');
    }
});
/**
 * Seed Assessment Questions (Admin Utility)
 * Callable Function: 'seedAssessmentQuestions'
 */
exports.seedAssessmentQuestions = functions.https.onCall(async (data, context) => {
    requireAdmin(context);
    // Explicit list of default questions
    const questions = [
        { text: "I've been feeling relaxed", type: "scale", category: "General", tags: ["Stress"], weight: 1, order: 1, isActive: true },
        { text: "I've been feeling useful", type: "scale", category: "General", tags: ["Motivation"], weight: 1, order: 2, isActive: true },
        { text: "I've had energy to spare", type: "scale", category: "General", tags: ["Energy"], weight: 1, order: 3, isActive: true },
        { text: "I've been feeling interested in other people", type: "scale", category: "General", tags: ["Social Connection"], weight: 1, order: 4, isActive: true },
        { text: "I've been thinking clearly", type: "scale", category: "General", tags: ["Focus"], weight: 1, order: 5, isActive: true }
    ];
    try {
        const batch = db.batch();
        const collectionRef = db.collection('assessment_questions');
        // Clear old ones? Safe to just add/overwrite if IDs provided. 
        // We'll generate new IDs for simplicity.
        // Check if exists to prevent duplicates
        const existing = await collectionRef.get();
        if (!existing.empty) {
            console.log("Assessment questions already exist. Skipping seed.");
            return { success: false, message: "Already seeded" };
        }
        questions.forEach(q => {
            const docRef = collectionRef.doc();
            batch.set(docRef, q);
        });
        await batch.commit();
        return { success: true, count: questions.length };
    }
    catch (error) {
        console.error("Seed failed", error);
        throw new functions.https.HttpsError('internal', `Seed failed: ${error.message || error}`);
    }
});
/**
 * Seed Challenges (Admin Utility)
 * Callable Function: 'seedChallenges'
 */
exports.seedChallenges = functions.https.onCall(async (data, context) => {
    requireAdmin(context);
    const challenges = seedData_1.seedChallengeData.map((challenge) => ({
        ...challenge,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    }));
    try {
        const batch = db.batch();
        const collectionRef = db.collection('challenges');
        // Check if exists to prevent duplicates
        const existing = await collectionRef.get();
        if (!existing.empty) {
            return { success: false, message: "Challenges already exist" };
        }
        challenges.forEach(c => {
            const docRef = collectionRef.doc();
            batch.set(docRef, c);
        });
        await batch.commit();
        return { success: true, count: challenges.length };
    }
    catch (error) {
        console.error("Error seeding challenges:", error);
        throw new functions.https.HttpsError('internal', `Unable to seed challenges: ${error.message || error}`);
    }
});
/**
 * Seed Resources (Admin Utility)
 * Callable Function: 'seedResources'
 */
exports.seedResources = functions.https.onCall(async (data, context) => {
    requireAdmin(context);
    const resources = seedData_1.seedResourceData.map((resource) => ({
        ...resource,
        publishedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    }));
    try {
        const batch = db.batch();
        const collectionRef = db.collection('resources');
        const existing = await collectionRef.get();
        if (!existing.empty) {
            return { success: false, message: "Resources already exist" };
        }
        resources.forEach(r => {
            const docRef = collectionRef.doc();
            batch.set(docRef, r);
        });
        await batch.commit();
        return { success: true, count: resources.length };
    }
    catch (error) {
        console.error("Error seeding resources:", error);
        throw new functions.https.HttpsError('internal', `Unable to seed resources: ${error.message || error}`);
    }
});
/**
 * Get User Wellbeing Stats
 * Callable Function: 'getUserStats'
 */
exports.getUserStats = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    const uid = context.auth.uid;
    try {
        // Fetch from user profile first for aggregated stats
        const userDoc = await db.collection('users').doc(uid).get();
        const stats = userDoc.data()?.stats;
        if (stats) {
            const score = stats.overallScore || 0;
            let label = 'Neutral';
            if (score >= 80)
                label = 'Thriving';
            else if (score >= 60)
                label = 'Doing Well';
            else if (score >= 40)
                label = 'Okay';
            else
                label = 'Struggling';
            return { score, label };
        }
        // Fallback to latest assessment query if no aggregated stats
        const snapshot = await db.collection('assessments')
            .where('uid', '==', uid)
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();
        if (snapshot.empty) {
            return { score: null, label: 'No data' };
        }
        const latest = snapshot.docs[0]?.data();
        const score = latest?.score || 0;
        let label = 'Neutral';
        if (score >= 80)
            label = 'Thriving';
        else if (score >= 60)
            label = 'Doing Well';
        else if (score >= 40)
            label = 'Okay';
        else
            label = 'Struggling';
        return { score, label };
    }
    catch (error) {
        console.error("Error fetching user stats:", error);
        return { score: 0, label: 'Error' };
    }
});
/**
 * Get Key Challenges
 * Callable Function: 'getKeyChallenges'
 */
exports.getKeyChallenges = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    const uid = context.auth.uid;
    try {
        // 1. Get User's weakest themes
        const userDoc = await db.collection('users').doc(uid).get();
        const themes = userDoc.data()?.stats?.themes || {};
        // Find themes with score <= 2 (1 or 2 means "Not at all" or "Rarely" positive)
        const weakThemes = Object.entries(themes)
            .filter(([_, score]) => score <= 2)
            .map(([theme]) => theme);
        // 2. Fetch Challenges matching these themes
        // Treat 'active' as published/visible; keep compatibility with any legacy 'published'
        let query = db.collection('challenges').where('status', 'in', ['active', 'published']);
        // If we have specific weak themes, prioritize them or filter by them.
        // For simplicity, if we have weak themes, we filter by them. 
        // Note: 'in' query supports max 10 items.
        let items = [];
        if (weakThemes.length > 0) {
            try {
                const snapshot = await query.where('category', 'in', weakThemes).limit(6).get();
                items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            }
            catch (e) {
                // Fallback if index missing or error
                console.log("Error querying challenges by theme", e);
            }
        }
        // If no items found (or no weak themes), fill with general high priority challenges
        if (items.length === 0) {
            const snapshot = await db.collection('challenges')
                .where('status', 'in', ['active', 'published'])
                .orderBy('priority', 'desc')
                .limit(4)
                .get();
            items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
        // If STILL empty, fallback to published resources mapped as challenges
        if (items.length === 0) {
            const snapshot = await db.collection('resources')
                .where('status', 'in', ['active', 'published'])
                .orderBy('publishedAt', 'desc')
                .limit(4)
                .get();
            items = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    title: data.title,
                    level: 'Moderate',
                    icon: 'lightbulb-outline',
                    bg: data.color || '#E0F2F1',
                    color: '#009688',
                    category: data.category || 'General',
                    status: data.status || 'published'
                };
            });
        }
        // Add context for the UI (why is this shown?)
        return items.map(item => ({
            ...item,
            reason: weakThemes.includes(item.category) ? `Based on your ${item.category} score` : 'Recommended for everyone'
        }));
    }
    catch (error) {
        console.error("Error fetching challenges:", error);
        throw new functions.https.HttpsError('internal', 'Unable to fetch challenges.');
    }
});
/**
 * Get Recommended Content
 * Callable Function: 'getRecommendedContent'
 */
exports.getRecommendedContent = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    const uid = context.auth.uid;
    try {
        // 1. Get User's weakest themes
        const userDoc = await db.collection('users').doc(uid).get();
        const themes = userDoc.data()?.stats?.themes || {};
        const weakThemes = Object.entries(themes)
            .filter(([_, score]) => score <= 3) // <= 3 includes "Sometimes"
            .map(([theme]) => theme);
        let items = [];
        if (weakThemes.length > 0) {
            const snapshot = await db.collection('resources')
                .where('status', 'in', ['active', 'published'])
                .where('tags', 'array-contains-any', weakThemes) // Ensure resources have 'tags' array
                .limit(10)
                .get();
            items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
        // Fill with generic if empty
        if (items.length < 5) {
            const snapshot = await db.collection('resources')
                .where('status', 'in', ['active', 'published'])
                .orderBy('publishedAt', 'desc')
                .limit(10 - items.length)
                .get();
            const genericItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Deduplicate
            const existingIds = new Set(items.map(i => i.id));
            genericItems.forEach(i => {
                if (!existingIds.has(i.id))
                    items.push(i);
            });
        }
        return { items };
    }
    catch (error) {
        console.error("Error fetching recommended content:", error);
        throw new functions.https.HttpsError('internal', 'Unable to fetch recommendations.');
    }
});
// ==========================================
// SUBSCRIPTION FUNCTIONS
// ==========================================
/**
 * Update Subscription Plan
 * Callable Function: 'updateSubscription'
 */
exports.updateSubscription = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    throw new functions.https.HttpsError('failed-precondition', 'Direct subscription updates are disabled. Use verified in-app purchase receipts.');
});
// ==========================================
// HUDDLE (CALL) FUNCTIONS
// ==========================================
/**
 * Start a Huddle (Video Call Session)
 * Callable Function: 'startHuddle'
 */
/**
 * Start a Huddle (Video Call Session)
 * Callable Function: 'startHuddle'
 */
exports.startHuddle = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    const { chatId, isGroup } = data;
    const uid = context.auth.uid;
    if (!chatId)
        throw new functions.https.HttpsError('invalid-argument', 'Chat ID required.');
    try {
        let roomUrl = null;
        const DAILY_API_KEY = process.env.DAILY_API_KEY;
        const chatRef = db.collection('chats').doc(chatId);
        const chatDoc = await chatRef.get();
        if (!chatDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Chat not found.');
        }
        const chatData = chatDoc.data();
        const participants = chatData?.participants || [];
        if (!participants.includes(uid)) {
            throw new functions.https.HttpsError('permission-denied', 'Not a chat participant.');
        }
        // PERMISSION CHECK: If it's a circle chat, only Creator/Admin/Moderator can start
        if (chatData?.circleId) {
            const circleId = chatData.circleId;
            const circleDoc = await db.collection('circles').doc(circleId).get();
            const circleData = circleDoc.exists ? circleDoc.data() : {};
            const memberDoc = await db.collection('circles').doc(circleId).collection('members').doc(uid).get();
            const role = memberDoc.data()?.role;
            const allowMemberHuddles = circleData?.settings?.allowMemberHuddles === true;
            if (!['creator', 'admin', 'moderator'].includes(role) && !allowMemberHuddles) {
                throw new functions.https.HttpsError('permission-denied', 'Only moderators or admins can start a huddle.');
            }
        }
        // 1. Create Room via Daily.co API if Key exists
        if (DAILY_API_KEY) {
            try {
                const response = await fetch('https://api.daily.co/v1/rooms', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${DAILY_API_KEY}`
                    },
                    body: JSON.stringify({
                        properties: {
                            exp: Math.round(Date.now() / 1000) + 3600, // Expires in 1 hour
                            enable_chat: true,
                        }
                    })
                });
                const roomData = await response.json();
                if (roomData.url) {
                    roomUrl = roomData.url;
                }
            }
            catch (e) {
                console.error("Daily API Error", e);
            }
        }
        if (!roomUrl) {
            throw new functions.https.HttpsError('failed-precondition', 'Video service is not configured.');
        }
        const huddleRef = db.collection('huddles').doc();
        const huddleData = {
            id: huddleRef.id,
            chatId,
            circleId: chatData?.circleId || null,
            roomUrl, // The actual video link
            startedBy: uid,
            isGroup: !!isGroup,
            isActive: true,
            participants: [uid],
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        await huddleRef.set(huddleData);
        // Notify chat participants (e.g. System Message)
        await db.collection('chats').doc(chatId).collection('messages').add({
            text: '📞 Started a Huddle',
            type: 'system',
            senderId: uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            metadata: { huddleId: huddleRef.id, roomUrl }
        });
        // UPDATE CIRCLE STATUS (for "Active Huddle" UI)
        if (chatData?.circleId) {
            await db.collection('circles').doc(chatData.circleId).update({
                activeHuddle: {
                    huddleId: huddleRef.id,
                    roomUrl,
                    startedBy: uid,
                    startedAt: admin.firestore.FieldValue.serverTimestamp()
                }
            });
        }
        // Notify other participants (push + in-app)
        try {
            const recipients = participants.filter((p) => p !== uid);
            if (recipients.length > 0) {
                const expoTokens = [];
                const fcmTokens = [];
                for (const ruid of recipients) {
                    const userDoc = await db.collection('users').doc(ruid).get();
                    const userData = userDoc.data() || {};
                    expoTokens.push(...(userData.expoPushTokens || []));
                    fcmTokens.push(...(userData.fcmTokens || []));
                }
                const notificationBatch = db.batch();
                recipients.forEach((ruid) => {
                    const notifRef = db.collection('notifications').doc();
                    notificationBatch.set(notifRef, {
                        uid: ruid,
                        title: 'Incoming Huddle',
                        subtitle: 'A call has started. Tap to join.',
                        type: 'HUDDLE_STARTED',
                        chatId,
                        huddleId: huddleRef.id,
                        roomUrl,
                        read: false,
                        createdAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                });
                await notificationBatch.commit();
                const payload = {
                    title: 'Incoming Huddle',
                    body: 'A call has started. Tap to join.',
                    data: { chatId, huddleId: huddleRef.id, roomUrl, type: 'HUDDLE_STARTED' }
                };
                if (fcmTokens.length > 0) {
                    const messagePayload = {
                        tokens: fcmTokens,
                        notification: { title: payload.title, body: payload.body },
                        data: payload.data
                    };
                    await admin.messaging().sendEachForMulticast(messagePayload);
                }
                if (expoTokens.length > 0) {
                    const expoMessages = expoTokens.map((token) => ({
                        to: token,
                        title: payload.title,
                        body: payload.body,
                        data: payload.data
                    }));
                    await fetch('https://exp.host/--/api/v2/push/send', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(expoMessages)
                    });
                }
            }
        }
        catch (notifyError) {
            console.error("Error sending huddle notifications:", notifyError);
        }
        return { success: true, huddleId: huddleRef.id, roomUrl };
    }
    catch (error) {
        console.error("Error starting huddle:", error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Unable to start huddle.');
    }
});
/**
 * Join/Leave Huddle
 * Callable Function: 'updateHuddleState'
 */
exports.updateHuddleState = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    const { huddleId, action } = data; // action: 'join' | 'leave'
    const uid = context.auth.uid;
    try {
        const huddleRef = db.collection('huddles').doc(huddleId);
        const huddleDoc = await huddleRef.get();
        if (!huddleDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Huddle not found.');
        }
        const chatId = huddleDoc.data()?.chatId;
        if (!chatId) {
            throw new functions.https.HttpsError('failed-precondition', 'Huddle is missing chat reference.');
        }
        const chatDoc = await db.collection('chats').doc(chatId).get();
        const participants = chatDoc.data()?.participants || [];
        if (!participants.includes(uid)) {
            throw new functions.https.HttpsError('permission-denied', 'Not a chat participant.');
        }
        if (action === 'join') {
            await huddleRef.update({
                participants: admin.firestore.FieldValue.arrayUnion(uid)
            });
        }
        else if (action === 'leave') {
            await huddleRef.update({
                participants: admin.firestore.FieldValue.arrayRemove(uid)
            });
            // If empty, close huddle or keep active? Logic depends. 
            // Simple: If 0 participants, set isActive false.
            const doc = await huddleRef.get();
            if (doc.exists && doc.data()?.participants.length === 0) {
                await huddleRef.update({ isActive: false, endedAt: admin.firestore.FieldValue.serverTimestamp() });
                // Clear active huddle on circle if any
                const hData = doc.data() || {};
                if (hData.chatId) {
                    const chatDoc = await db.collection('chats').doc(hData.chatId).get();
                    const circleId = chatDoc.data()?.circleId;
                    if (circleId) {
                        await db.collection('circles').doc(circleId).update({
                            activeHuddle: admin.firestore.FieldValue.delete()
                        });
                    }
                }
            }
        }
        return { success: true };
    }
    catch (error) {
        console.error("Error updating huddle state:", error);
        throw new functions.https.HttpsError('internal', 'Unable to update huddle.');
    }
});
/**
 * Schedule a Huddle
 * Callable Function: 'scheduleHuddle'
 */
exports.scheduleHuddle = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    const { circleId, title, scheduledAt } = data;
    const uid = context.auth.uid;
    if (!circleId || !title || !scheduledAt) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing fields.');
    }
    try {
        // Permission Check
        const memberRef = db.collection('circles').doc(circleId).collection('members').doc(uid);
        const memberDoc = await memberRef.get();
        const role = memberDoc.data()?.role;
        if (!['creator', 'admin', 'moderator'].includes(role)) {
            throw new functions.https.HttpsError('permission-denied', 'Only admins can schedule huddles.');
        }
        const scheduledRef = db.collection('circles').doc(circleId).collection('scheduledHuddles').doc();
        await scheduledRef.set({
            title,
            scheduledAt: new Date(scheduledAt), // Client sends ISO string/timestamp
            createdBy: uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return { success: true, id: scheduledRef.id };
    }
    catch (error) {
        console.error("Error scheduling huddle:", error);
        throw new functions.https.HttpsError('internal', 'Unable to schedule huddle.');
    }
});
/**
 * Delete a Scheduled Huddle
 * Callable Function: 'deleteScheduledHuddle'
 */
exports.deleteScheduledHuddle = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    const { circleId, eventId } = data;
    const uid = context.auth.uid;
    if (!circleId || !eventId) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing circleId or eventId.');
    }
    try {
        const memberRef = db.collection('circles').doc(circleId).collection('members').doc(uid);
        const memberDoc = await memberRef.get();
        const role = memberDoc.data()?.role;
        if (!memberDoc.exists || !['creator', 'admin', 'moderator'].includes(role)) {
            throw new functions.https.HttpsError('permission-denied', 'Only admins and moderators can delete scheduled huddles.');
        }
        await db.collection('circles').doc(circleId).collection('scheduledHuddles').doc(eventId).delete();
        return { success: true };
    }
    catch (error) {
        if (error instanceof functions.https.HttpsError)
            throw error;
        throw new functions.https.HttpsError('internal', 'Delete failed.');
    }
});
/**
 * Submit a Report (Circle Context)
 */
exports.submitReport = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in.');
    const { circleId, targetId, targetType, reason, description } = data;
    // targetType: 'member' | 'message' | 'huddle'
    if (!circleId || !targetId || !targetType) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing fields');
    }
    try {
        const reportPayload = {
            reporterId: context.auth.uid,
            reportedBy: context.auth.uid,
            targetId,
            targetType,
            reason,
            description: description || '',
            details: description || '',
            status: 'pending', // pending | resolved | dismissed
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        const reportRef = db.collection('circles').doc(circleId).collection('reports').doc();
        await reportRef.set(reportPayload);
        // Also write to top-level reports for global moderation
        const normalizedContentType = targetType === 'member' ? 'users' :
            targetType === 'message' ? 'messages' :
                targetType === 'huddle' ? 'huddles' : 'unknown';
        await db.collection('reports').add({
            ...reportPayload,
            circleId,
            reportedUserId: targetType === 'member' ? targetId : null,
            contentId: targetType !== 'member' ? targetId : null,
            contentType: normalizedContentType
        });
        return { success: true, reportId: reportRef.id };
    }
    catch (error) {
        console.error("Error submitting report:", error);
        throw new functions.https.HttpsError('internal', 'Report submission failed.');
    }
});
/**
 * Resolve Circle Report (Admin/Mod Only)
 * Callable Function: 'resolveCircleReport'
 */
exports.resolveCircleReport = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in.');
    const { circleId, reportId, action, resolutionNote } = data;
    // action: 'dismiss' | 'warn' | 'ban' | 'delete_content'
    const uid = context.auth.uid;
    try {
        const circleRef = db.collection('circles').doc(circleId);
        // 1. Permission Check
        const memberRef = circleRef.collection('members').doc(uid);
        const memberDoc = await memberRef.get();
        const role = memberDoc.data()?.role;
        if (!['creator', 'admin', 'moderator'].includes(role)) {
            throw new functions.https.HttpsError('permission-denied', 'Moderator privileges required.');
        }
        const reportRef = circleRef.collection('reports').doc(reportId);
        const reportDoc = await reportRef.get();
        if (!reportDoc.exists)
            throw new functions.https.HttpsError('not-found', 'Report not found.');
        const reportData = reportDoc.data();
        const targetId = reportData?.targetId;
        const targetType = reportData?.targetType; // 'member', 'message'
        const batch = db.batch();
        const circleReportDoc = await circleRef.get();
        const circleData = circleReportDoc.data();
        // 2. Perform Action
        if (action === 'ban' && targetType === 'member') {
            // Admin Check: Mod cannot ban Admin.
            if (role === 'moderator') {
                const targetMember = await circleRef.collection('members').doc(targetId).get();
                if (['admin', 'creator'].includes(targetMember.data()?.role)) {
                    throw new functions.https.HttpsError('permission-denied', 'Moderators cannot ban Admins.');
                }
            }
            batch.update(circleRef.collection('members').doc(targetId), { status: 'banned', role: 'member' });
            batch.update(circleRef, {
                members: admin.firestore.FieldValue.arrayRemove(targetId),
                memberCount: admin.firestore.FieldValue.increment(-1)
            });
            // Remove from chat
            if (circleData?.chatId) {
                batch.update(db.collection('chats').doc(circleData.chatId), {
                    participants: admin.firestore.FieldValue.arrayRemove(targetId)
                });
            }
        }
        else if (action === 'delete_content' && targetType === 'message') {
            if (circleData?.chatId) {
                // Delete the message from the chat
                const messageRef = db.collection('chats').doc(circleData.chatId).collection('messages').doc(targetId);
                batch.delete(messageRef);
                // Optional: Add a "Tombstone" message or system note?
                // For now, hard delete is sufficient for moderation.
            }
        }
        // 3. Update Report Status
        batch.update(reportRef, {
            status: 'resolved',
            resolution: action,
            resolutionNote: resolutionNote || '',
            resolvedBy: uid,
            resolvedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        await batch.commit();
        return { success: true };
    }
    catch (error) {
        console.error("Error resolving report:", error);
        throw new functions.https.HttpsError('internal', 'Resolution failed.');
    }
});
// ==========================================
// RESOURCE (EXPLORE) FUNCTIONS
// ==========================================
/**
 * Get Explore Content
 * Callable Function: 'getExploreContent'
 * (Can initially just return curated lists, or complex querying)
 */
exports.getExploreContent = functions.https.onCall(async (data, context) => {
    // Authenticated optional? Let's require it.
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    try {
        const snapshot = await db.collection('resources')
            .where('status', 'in', ['active', 'published'])
            .orderBy('publishedAt', 'desc')
            .limit(30)
            .get();
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return { items };
    }
    catch (error) {
        console.error("Error fetching content:", error);
        throw new functions.https.HttpsError('internal', 'Unable to fetch content.');
    }
});
/**
 * Get Daily Affirmations
 * Callable Function: 'getAffirmations'
 */
exports.getAffirmations = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    try {
        const todayKey = getTodayKey();
        const dailyRef = db.collection('daily_affirmations').doc(todayKey);
        const dailyDoc = await dailyRef.get();
        const buildDailySet = async () => {
            const snapshot = await db.collection('affirmations')
                .orderBy('publishedAt', 'desc')
                .limit(200)
                .get();
            const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Accept active/published or missing status; filter out suspended/rejected
            const filtered = all.filter((a) => !a.status || ['active', 'published'].includes(a.status));
            if (filtered.length === 0)
                return [];
            const picks = pickRandomItems(filtered, 3);
            const ids = picks.map((item) => item.id);
            await dailyRef.set({
                date: todayKey,
                affirmationIds: ids,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
            return ids;
        };
        let affirmationIds = dailyDoc.exists ? (dailyDoc.data()?.affirmationIds || []) : [];
        if (affirmationIds.length === 0) {
            affirmationIds = await buildDailySet();
        }
        const fetchByIds = async (ids) => {
            if (ids.length === 0)
                return [];
            const snapshot = await db.collection('affirmations')
                .where(admin.firestore.FieldPath.documentId(), 'in', ids)
                .get();
            const byId = new Map(snapshot.docs.map(doc => [doc.id, { id: doc.id, ...doc.data() }]));
            return ids.map(id => byId.get(id)).filter(Boolean);
        };
        let items = await fetchByIds(affirmationIds);
        // If the stored ids no longer exist or were filtered out, rebuild once
        if (items.length === 0) {
            affirmationIds = await buildDailySet();
            items = await fetchByIds(affirmationIds);
        }
        return { items };
    }
    catch (error) {
        console.error("Error fetching affirmations:", error);
        throw new functions.https.HttpsError('internal', 'Unable to fetch affirmations.');
    }
});
const ensureDailyAffirmations = async () => {
    const todayKey = getTodayKey();
    const dailyRef = db.collection('daily_affirmations').doc(todayKey);
    const dailyDoc = await dailyRef.get();
    let affirmationIds = dailyDoc.exists ? (dailyDoc.data()?.affirmationIds || []) : [];
    if (affirmationIds.length === 0) {
        const snapshot = await db.collection('affirmations')
            .where('status', '==', 'published')
            .orderBy('publishedAt', 'desc')
            .limit(200)
            .get();
        const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const picks = pickRandomItems(all, 3);
        affirmationIds = picks.map((item) => item.id);
        await dailyRef.set({
            date: todayKey,
            affirmationIds,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
    }
    return affirmationIds;
};
const sendDailyAffirmationsNotification = async (slotIndex, title) => {
    const affirmationIds = await ensureDailyAffirmations();
    if (affirmationIds.length === 0)
        return;
    const pickId = affirmationIds[Math.min(slotIndex, affirmationIds.length - 1)];
    const affirmationDoc = await db.collection('affirmations').doc(pickId).get();
    const content = affirmationDoc.data()?.content || 'Your daily affirmation is ready.';
    const usersSnap = await db.collection('users').get();
    const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const batchSize = 400;
    for (let i = 0; i < users.length; i += batchSize) {
        const batch = db.batch();
        users.slice(i, i + batchSize).forEach((user) => {
            const notifRef = db.collection('notifications').doc();
            batch.set(notifRef, {
                uid: user.id,
                title,
                subtitle: content,
                type: 'DAILY_AFFIRMATION',
                slot: slotIndex,
                affirmationId: pickId,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        });
        await batch.commit();
    }
    // Best-effort push notifications (if tokens exist)
    const expoMessages = [];
    const fcmTokens = [];
    users.forEach((user) => {
        if (Array.isArray(user.expoPushTokens)) {
            user.expoPushTokens.forEach((token) => {
                expoMessages.push({
                    to: token,
                    title,
                    body: content,
                    data: { type: 'DAILY_AFFIRMATION', affirmationId: pickId }
                });
            });
        }
        if (Array.isArray(user.fcmTokens)) {
            fcmTokens.push(...user.fcmTokens);
        }
    });
    // FCM
    const fcmChunkSize = 500;
    for (let i = 0; i < fcmTokens.length; i += fcmChunkSize) {
        const chunk = fcmTokens.slice(i, i + fcmChunkSize);
        const messagePayload = {
            tokens: chunk,
            notification: { title, body: content },
            data: { type: 'DAILY_AFFIRMATION', affirmationId: pickId }
        };
        await admin.messaging().sendEachForMulticast(messagePayload);
    }
    // Expo
    const expoChunkSize = 100;
    for (let i = 0; i < expoMessages.length; i += expoChunkSize) {
        const chunk = expoMessages.slice(i, i + expoChunkSize);
        await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(chunk)
        });
    }
};
exports.seedAffirmations = functions.https.onCall(async (data, context) => {
    requireAdmin(context);
    const affirmations = seedData_1.seedAffirmationData.map((affirmation, index) => ({
        ...affirmation,
        image: seedData_1.seedAffirmationImages[index % seedData_1.seedAffirmationImages.length],
        publishedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: affirmation.status || 'active'
    }));
    try {
        const collectionRef = db.collection('affirmations');
        const existing = await collectionRef.get();
        if (!existing.empty) {
            return { success: false, message: 'Affirmations already exist' };
        }
        const batch = db.batch();
        affirmations.forEach((a) => {
            const docRef = collectionRef.doc();
            batch.set(docRef, a);
        });
        await batch.commit();
        return { success: true, count: affirmations.length };
    }
    catch (error) {
        console.error('Error seeding affirmations:', error);
        throw new functions.https.HttpsError('internal', `Unable to seed affirmations: ${error.message || error}`);
    }
});
const allowSeedOrigin = (req, res) => {
    const allowed = (process.env.SEED_ALLOWED_ORIGINS || '*').split(',').map((item) => item.trim()).filter(Boolean);
    const origin = req.headers.origin || '*';
    if (allowed.includes('*') || allowed.includes(origin)) {
        res.set('Access-Control-Allow-Origin', origin);
    }
    res.set('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, x-seed-token');
};
const clearCollection = async (collectionName) => {
    const batchSize = 400;
    let deleted = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const snapshot = await db.collection(collectionName).limit(batchSize).get();
        if (snapshot.empty)
            break;
        const batch = db.batch();
        snapshot.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
        deleted += snapshot.size;
        if (snapshot.size < batchSize)
            break;
    }
    return deleted;
};
const seedCollectionHelper = async (collectionName, items, mapItem) => {
    const batch = db.batch();
    items.forEach((item, index) => {
        const docRef = db.collection(collectionName).doc();
        batch.set(docRef, mapItem ? mapItem(item, index) : item);
    });
    await batch.commit();
    return { success: true, count: items.length };
};
const backfillAffirmationImagesInternal = async () => {
    const collectionRef = db.collection('affirmations');
    let snapshot;
    try {
        snapshot = await collectionRef.orderBy('publishedAt', 'asc').get();
    }
    catch {
        snapshot = await collectionRef.get();
    }
    if (snapshot.empty) {
        return { updated: 0, total: 0 };
    }
    let updated = 0;
    let total = 0;
    let imageIndex = 0;
    let batch = db.batch();
    let batchCount = 0;
    const commitBatch = async () => {
        if (batchCount === 0)
            return;
        await batch.commit();
        batch = db.batch();
        batchCount = 0;
    };
    snapshot.forEach((doc) => {
        total += 1;
        const data = doc.data();
        if (data?.image) {
            return;
        }
        const image = seedData_1.seedAffirmationImages[imageIndex % seedData_1.seedAffirmationImages.length];
        imageIndex += 1;
        batch.update(doc.ref, {
            image,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        updated += 1;
        batchCount += 1;
        if (batchCount >= 450) {
            void commitBatch();
        }
    });
    await commitBatch();
    return { updated, total };
};
exports.backfillAffirmationImages = functions.https.onRequest(async (req, res) => {
    allowSeedOrigin(req, res);
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    const force = req.query.force === '1';
    try {
        if (force) {
            // If force flag set and affirmations missing, seed them with images first
            const existing = await db.collection('affirmations').limit(1).get();
            if (existing.empty) {
                await seedCollectionHelper('affirmations', seedData_1.seedAffirmationData, (item, index) => ({
                    ...item,
                    image: seedData_1.seedAffirmationImages[index % seedData_1.seedAffirmationImages.length],
                    publishedAt: admin.firestore.FieldValue.serverTimestamp()
                }));
            }
        }
        const result = await backfillAffirmationImagesInternal();
        res.status(200).json({ success: true, result });
    }
    catch (error) {
        console.error('Backfill affirmations error', error);
        res.status(500).json({ error: error.message || 'Backfill failed' });
    }
});
exports.seedAll = functions.https.onRequest(async (req, res) => {
    allowSeedOrigin(req, res);
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    const force = req.query.force === '1';
    const results = {};
    const seedCollection = async (collectionName, items, mapItem) => {
        const existing = await db.collection(collectionName).limit(1).get();
        if (!existing.empty && !force) {
            return { skipped: true, reason: 'already seeded' };
        }
        if (!existing.empty && force) {
            results[`${collectionName}_cleared`] = await clearCollection(collectionName);
        }
        const batch = db.batch();
        items.forEach((item, index) => {
            const docRef = db.collection(collectionName).doc();
            batch.set(docRef, mapItem ? mapItem(item, index) : item);
        });
        await batch.commit();
        return { success: true, count: items.length };
    };
    try {
        results.resources = await seedCollection('resources', seedData_1.seedResourceData, (item) => ({
            ...item,
            publishedAt: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        }));
        results.challenges = await seedCollection('challenges', seedData_1.seedChallengeData, (item) => ({
            ...item,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        }));
        results.affirmations = await seedCollection('affirmations', seedData_1.seedAffirmationData, (item, index) => ({
            ...item,
            image: seedData_1.seedAffirmationImages[index % seedData_1.seedAffirmationImages.length],
            publishedAt: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            status: item.status || 'active'
        }));
        results.affirmationImages = await backfillAffirmationImagesInternal();
        res.status(200).json({ success: true, results });
    }
    catch (error) {
        console.error('Seed all error', error);
        res.status(500).json({ error: error.message || 'Seed failed' });
    }
});
exports.getSeedStatus = functions.https.onRequest(async (req, res) => {
    allowSeedOrigin(req, res);
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    const collections = ['resources', 'challenges', 'affirmations', 'daily_affirmations'];
    const counts = {};
    try {
        for (const col of collections) {
            const snap = await db.collection(col).count().get();
            counts[col] = snap.data().count;
        }
        res.status(200).json({ success: true, counts });
    }
    catch (error) {
        console.error('Seed status error', error);
        res.status(500).json({ error: error.message || 'Status failed' });
    }
});
const AFFIRMATION_TIMEZONE = process.env.AFFIRMATION_TIMEZONE || 'UTC';
exports.sendAffirmationsMorning = functions.pubsub.schedule('0 8 * * *').timeZone(AFFIRMATION_TIMEZONE).onRun(async () => {
    await sendDailyAffirmationsNotification(0, 'Morning Affirmation');
});
exports.sendAffirmationsAfternoon = functions.pubsub.schedule('0 13 * * *').timeZone(AFFIRMATION_TIMEZONE).onRun(async () => {
    await sendDailyAffirmationsNotification(1, 'Afternoon Affirmation');
});
exports.sendAffirmationsEvening = functions.pubsub.schedule('0 21 * * *').timeZone(AFFIRMATION_TIMEZONE).onRun(async () => {
    await sendDailyAffirmationsNotification(2, 'Evening Affirmation');
});
// ==========================================
// CONTACT (WEB) FUNCTIONS
// ==========================================
exports.submitContactForm = functions.https.onRequest(async (req, res) => {
    const allowedOrigins = (process.env.CONTACT_ALLOWED_ORIGINS || '*')
        .split(',')
        .map(origin => origin.trim())
        .filter(Boolean);
    const origin = req.headers.origin || '';
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        res.set('Access-Control-Allow-Origin', origin || '*');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    }
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    try {
        const { firstName, lastName, email, company, message } = req.body || {};
        if (!firstName || !lastName || !email || !company || !message) {
            res.status(400).json({ error: 'Missing required fields.' });
            return;
        }
        const contactPayload = {
            firstName: String(firstName).trim(),
            lastName: String(lastName).trim(),
            email: String(email).trim(),
            company: String(company).trim(),
            message: String(message).trim(),
            status: 'new',
            source: 'webapp',
            userAgent: req.headers['user-agent'] || '',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        await db.collection('contactMessages').add(contactPayload);
        await db.collection('support_tickets').add({
            email: contactPayload.email,
            subject: `Contact form: ${contactPayload.company}`,
            message: contactPayload.message,
            status: 'open',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            source: 'webapp'
        });
        res.status(200).json({ success: true });
    }
    catch (error) {
        console.error('Error submitting contact form:', error);
        res.status(500).json({ error: 'Unable to submit contact form.' });
    }
});
// ==========================================
// ACCOUNT MANAGEMENT
// ==========================================
exports.deleteUserAccount = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    const uid = context.auth.uid;
    try {
        const batch = db.batch();
        batch.delete(db.collection('users').doc(uid));
        const circlesSnap = await db.collection('circles').where('members', 'array-contains', uid).get();
        circlesSnap.docs.forEach(doc => {
            batch.update(doc.ref, { members: admin.firestore.FieldValue.arrayRemove(uid) });
        });
        const chatsSnap = await db.collection('chats').where('participants', 'array-contains', uid).get();
        chatsSnap.docs.forEach(doc => {
            batch.update(doc.ref, { participants: admin.firestore.FieldValue.arrayRemove(uid) });
        });
        await batch.commit();
        const assessmentsSnap = await db.collection('assessments').where('uid', '==', uid).get();
        if (!assessmentsSnap.empty) {
            const deleteBatches = [];
            let currentBatch = db.batch();
            let count = 0;
            assessmentsSnap.docs.forEach((docSnap) => {
                currentBatch.delete(docSnap.ref);
                count += 1;
                if (count === 400) {
                    deleteBatches.push(currentBatch.commit());
                    currentBatch = db.batch();
                    count = 0;
                }
            });
            deleteBatches.push(currentBatch.commit());
            await Promise.all(deleteBatches);
        }
        await admin.auth().deleteUser(uid);
        return { success: true };
    }
    catch (error) {
        console.error('Error deleting user account:', error);
        throw new functions.https.HttpsError('internal', 'Unable to delete account.');
    }
});
//# sourceMappingURL=core.js.map