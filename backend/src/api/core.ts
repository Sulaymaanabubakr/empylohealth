import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { v2 as cloudinary } from 'cloudinary';

if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
    api_key: process.env.CLOUDINARY_API_KEY || '',
    api_secret: process.env.CLOUDINARY_API_SECRET || ''
});

const requireAdmin = (context: functions.https.CallableContext) => {
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
export const generateUploadSignature = functions.https.onCall((data, context) => {
    // Ensure user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }

    if (!process.env.CLOUDINARY_API_SECRET || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_CLOUD_NAME) {
        throw new functions.https.HttpsError('failed-precondition', 'Cloudinary is not configured.');
    }

    const timestamp = Math.round((new Date()).getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request({
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
export const createCircle = functions.https.onCall(async (data, context) => {
    // 1. Auth Check
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }

    const { name, description, category } = data;
    const uid = context.auth.uid;

    // 2. Validation
    if (!name) {
        throw new functions.https.HttpsError('invalid-argument', 'Circle name is required.');
    }

    try {
        // 3. Create Circle Doc
        const circleRef = db.collection('circles').doc();
        const circleData = {
            id: circleRef.id,
            name,
            description: description || '',
            category: category || 'General',
            adminId: uid,
            members: [uid], // Creator is the first member
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await circleRef.set(circleData);

        const chatRef = db.collection('chats').doc();
        await chatRef.set({
            type: 'group',
            name,
            circleId: circleRef.id,
            participants: [uid],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        await circleRef.update({ chatId: chatRef.id });

        console.log(`[Circles] Circle created: ${name} (${circleRef.id}) by ${uid}`);

        return { success: true, circleId: circleRef.id };
    } catch (error) {
        console.error("Error creating circle:", error);
        throw new functions.https.HttpsError('internal', 'Unable to create circle.');
    }
});

/**
 * Join an existing Circle
 * Callable Function: 'joinCircle'
 */
export const joinCircle = functions.https.onCall(async (data, context) => {
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
        const updates = {
            members: admin.firestore.FieldValue.arrayUnion(uid)
        };
        await circleRef.update(updates);

        if (circleData.chatId) {
            await db.collection('chats').doc(circleData.chatId).update({
                participants: admin.firestore.FieldValue.arrayUnion(uid),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }

        console.log(`[Circles] User ${uid} joined circle ${circleId}`);
        return { success: true };
    } catch (error) {
        console.error("Error joining circle:", error);
        throw new functions.https.HttpsError('internal', 'Unable to join circle.');
    }
});

/**
 * Leave an existing Circle
 * Callable Function: 'leaveCircle'
 */
export const leaveCircle = functions.https.onCall(async (data, context) => {
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
        await circleRef.update({
            members: admin.firestore.FieldValue.arrayRemove(uid),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        if (circleData.chatId) {
            await db.collection('chats').doc(circleData.chatId).update({
                participants: admin.firestore.FieldValue.arrayRemove(uid),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }

        console.log(`[Circles] User ${uid} left circle ${circleId}`);
        return { success: true };
    } catch (error) {
        console.error("Error leaving circle:", error);
        throw new functions.https.HttpsError('internal', 'Unable to leave circle.');
    }
});



// ==========================================
// CHAT FUNCTIONS
// ==========================================

/**
 * Create or Get Direct Chat
 * Callable Function: 'createDirectChat'
 */
export const createDirectChat = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }

    const { recipientId } = data;
    const uid = context.auth.uid;

    if (!recipientId) throw new functions.https.HttpsError('invalid-argument', 'Recipient ID required.');
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
    } catch (error) {
        console.error("Error creating chat:", error);
        throw new functions.https.HttpsError('internal', 'Unable to create chat.');
    }
});

/**
 * Send a Message
 * Callable Function: 'sendMessage'
 */
export const sendMessage = functions.https.onCall(async (data, context) => {
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
    } catch (error) {
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
export const submitAssessment = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');

    const { type, score, answers, mood } = data; // type: 'daily' | 'questionnaire'
    const uid = context.auth.uid;

    try {
        await db.collection('assessments').add({
            uid,
            type: type || 'daily',
            score: score || 0,
            mood: mood || '', // For daily emoji check-ins
            answers: answers || {}, // Map of questionId: answer
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Optional: Recalculate User's Wellbeing Score here and update user profile
        // await db.collection('users').doc(uid).update({ wellbeingScore: ... })

        return { success: true };
    } catch (error) {
        console.error("Error submitting assessment:", error);
        throw new functions.https.HttpsError('internal', 'Unable to submit assessment.');
    }
});

/**
 * Get User Wellbeing Stats
 * Callable Function: 'getUserStats'
 */
export const getUserStats = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    const uid = context.auth.uid;

    try {
        // Fetch latest assessment
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
        if (score >= 80) label = 'Thriving';
        else if (score >= 60) label = 'Doing Well';
        else if (score >= 40) label = 'Okay';
        else label = 'Struggling';

        return { score, label };
    } catch (error) {
        console.error("Error fetching user stats:", error);
        return { score: 0, label: 'Error' };
    }
});

/**
 * Get Key Challenges
 * Callable Function: 'getKeyChallenges'
 */
export const getKeyChallenges = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');

    try {
        const snapshot = await db.collection('challenges')
            .where('status', '==', 'published')
            .orderBy('priority', 'desc')
            .limit(6)
            .get();
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return items;
    } catch (error) {
        console.error("Error fetching challenges:", error);
        throw new functions.https.HttpsError('internal', 'Unable to fetch challenges.');
    }
});

// ==========================================
// SUBSCRIPTION FUNCTIONS
// ==========================================

/**
 * Update Subscription Plan
 * Callable Function: 'updateSubscription'
 */
export const updateSubscription = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');

    throw new functions.https.HttpsError(
        'failed-precondition',
        'Direct subscription updates are disabled. Use verified in-app purchase receipts.'
    );
});

// ==========================================
// HUDDLE (CALL) FUNCTIONS
// ==========================================

/**
 * Start a Huddle (Video Call Session)
 * Callable Function: 'startHuddle'
 */
export const startHuddle = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');

    const { chatId, isGroup } = data;
    const uid = context.auth.uid;

    if (!chatId) throw new functions.https.HttpsError('invalid-argument', 'Chat ID required.');

    try {
        let roomUrl = null;
        const DAILY_API_KEY = process.env.DAILY_API_KEY;
        const chatRef = db.collection('chats').doc(chatId);
        const chatDoc = await chatRef.get();
        if (!chatDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Chat not found.');
        }
        const participants = chatDoc.data()?.participants || [];
        if (!participants.includes(uid)) {
            throw new functions.https.HttpsError('permission-denied', 'Not a chat participant.');
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
                const roomData: any = await response.json();
                if (roomData.url) {
                    roomUrl = roomData.url;
                }
            } catch (e) {
                console.error("Daily API Error", e);
            }
        }

        if (!roomUrl) {
            throw new functions.https.HttpsError('failed-precondition', 'Video service is not configured.');
        }

        const huddleRef = db.collection('huddles').doc();
        await huddleRef.set({
            chatId,
            roomUrl, // The actual video link
            startedBy: uid,
            isGroup: !!isGroup,
            isActive: true,
            participants: [uid],
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Notify chat participants (e.g. System Message)
        await db.collection('chats').doc(chatId).collection('messages').add({
            text: '📞 Started a Huddle',
            type: 'system',
            senderId: uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            metadata: { huddleId: huddleRef.id, roomUrl }
        });

        return { success: true, huddleId: huddleRef.id, roomUrl };
    } catch (error) {
        console.error("Error starting huddle:", error);
        throw new functions.https.HttpsError('internal', 'Unable to start huddle.');
    }
});

/**
 * Join/Leave Huddle
 * Callable Function: 'updateHuddleState'
 */
export const updateHuddleState = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');

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
        } else if (action === 'leave') {
            await huddleRef.update({
                participants: admin.firestore.FieldValue.arrayRemove(uid)
            });
            // If empty, close huddle or keep active? Logic depends. 
            // Simple: If 0 participants, set isActive false.
            const doc = await huddleRef.get();
            if (doc.exists && doc.data()?.participants.length === 0) {
                await huddleRef.update({ isActive: false, endedAt: admin.firestore.FieldValue.serverTimestamp() });
            }
        }

        return { success: true };
    } catch (error) {
        console.error("Error updating huddle state:", error);
        throw new functions.https.HttpsError('internal', 'Unable to update huddle.');
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
export const getExploreContent = functions.https.onCall(async (data, context) => {
    // Authenticated optional? Let's require it.
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');

    try {
        const snapshot = await db.collection('resources')
            .where('status', '==', 'published')
            .orderBy('publishedAt', 'desc')
            .limit(30)
            .get();
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return { items };
    } catch (error) {
        console.error("Error fetching content:", error);
        throw new functions.https.HttpsError('internal', 'Unable to fetch content.');
    }
});

/**
 * Get Daily Affirmations
 * Callable Function: 'getAffirmations'
 */
export const getAffirmations = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');

    try {
        const snapshot = await db.collection('affirmations')
            .where('status', '==', 'published')
            .orderBy('publishedAt', 'desc')
            .limit(30)
            .get();
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return { items };
    } catch (error) {
        console.error("Error fetching affirmations:", error);
        throw new functions.https.HttpsError('internal', 'Unable to fetch affirmations.');
    }
});

// ==========================================
// CONTACT (WEB) FUNCTIONS
// ==========================================

export const submitContactForm = functions.https.onRequest(async (req, res) => {
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

        await db.collection('contactMessages').add({
            firstName: String(firstName).trim(),
            lastName: String(lastName).trim(),
            email: String(email).trim(),
            company: String(company).trim(),
            message: String(message).trim(),
            status: 'new',
            source: 'webapp',
            userAgent: req.headers['user-agent'] || '',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error submitting contact form:', error);
        res.status(500).json({ error: 'Unable to submit contact form.' });
    }
});



// ==========================================
// ACCOUNT MANAGEMENT
// ==========================================

export const deleteUserAccount = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
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
    } catch (error) {
        console.error('Error deleting user account:', error);
        throw new functions.https.HttpsError('internal', 'Unable to delete account.');
    }
});
