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
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            score: 85, // Default/Mock score for now
            activityLevel: 'High' // Mock
        };

        await circleRef.set(circleData);
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

        // Add user to members array
        await circleRef.update({
            members: admin.firestore.FieldValue.arrayUnion(uid)
        });

        console.log(`[Circles] User ${uid} joined circle ${circleId}`);
        return { success: true };
    } catch (error) {
        console.error("Error joining circle:", error);
        throw new functions.https.HttpsError('internal', 'Unable to join circle.');
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

    try {
        const chatRef = db.collection('chats').doc(chatId);

        // simple validation: check if user is in participants (optional but good security)
        // skipping detailed read for speed, assuming UI separates correctness. 
        // Real app should read chatRef and check participants.

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
            return { score: 79, label: 'Thriving' }; // Default for demo
        }

        const latest = snapshot.docs[0].data();
        const score = latest.score || 0;
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

    // For now, return static or random challenges as we don't have a complex challenge engine yet
    // In future: Analyze assessment answers
    return [
        { title: 'Sleep', level: 'Moderate', icon: 'weather-night', color: '#FF9800', bg: '#FFF3E0' },
        { title: 'Work-Life Balance', level: 'High', icon: 'briefcase-clock-outline', color: '#F44336', bg: '#FFEBEE' }
    ];
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

    const { planId, status } = data; // planId: 'pro', 'enterprise'
    const uid = context.auth.uid;

    try {
        // In a real app, verify payment signature/webhook here.
        // For now, we trust the client (or this is called by a webhook).

        await db.collection('users').doc(uid).update({
            'subscription.plan': planId,
            'subscription.status': status || 'active',
            'subscription.updatedAt': admin.firestore.FieldValue.serverTimestamp()
        });

        // Update Custom Claims if using Firebase Auth Claims for roles
        await admin.auth().setCustomUserClaims(uid, { plan: planId });

        return { success: true };
    } catch (error) {
        console.error("Error updating subscription:", error);
        throw new functions.https.HttpsError('internal', 'Unable to update subscription.');
    }
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
            // Fallback for development/testing without key
            console.log("No DAILY_API_KEY found or API failed. Using mock URL.");
            roomUrl = `https://demo.daily.co/huddle-${chatId}`;
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
        // Fetch recent/featured resources
        const snapshot = await db.collection('resources').where('status', '==', 'published').limit(20).get();
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

    return {
        items: [
            { id: 'a1', text: 'I am grounded, calm, and capable.' },
            { id: 'a2', text: 'I can take one step at a time.' },
            { id: 'a3', text: 'My growth is steady and real.' }
        ]
    };
});

/**
 * Seed Default Resources (Admin/Dev helper)
 * Callable Function: 'seedResources'
 */
export const seedResources = functions.https.onCall(async (data, context) => {
    // SECURITY: In real app, check context.auth.token.admin == true

    const resources = [
        {
            title: 'Sleep hygiene',
            type: 'article',
            tag: 'LEARN',
            time: '12 Mins',
            status: 'published',
            category: 'Self-development',
            image: 'https://img.freepik.com/free-vector/sleep-analysis-concept-illustration_114360-6395.jpg',
            content: "Good sleep hygiene is typically defined as a set of behavioral and environmental recommendations..."
        },
        // ... more seed data
    ];

    const batch = db.batch();
    resources.forEach(res => {
        const ref = db.collection('resources').doc();
        batch.set(ref, res);
    });

    await batch.commit();
    return { success: true, count: resources.length };
});

/**
 * Seed Demo Data for current user
 * Callable Function: 'seedDemoData'
 */
export const seedDemoData = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');

    const uid = context.auth.uid;
    const demoUserId = `demo_${uid.slice(0, 8)}`;

    const demoUser = {
        uid: demoUserId,
        email: 'demo.user@empylo.com',
        name: 'Demo User',
        role: 'personal',
        photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const resources = [
        {
            title: 'Sleep hygiene',
            type: 'article',
            tag: 'LEARN',
            time: '12 Mins',
            status: 'published',
            category: 'Self-development',
            image: 'https://img.freepik.com/free-vector/sleep-analysis-concept-illustration_114360-6395.jpg',
            content: "Good sleep hygiene is typically defined as a set of behavioral and environmental recommendations..."
        },
        {
            title: 'Mindfulness for Beginners',
            type: 'video',
            tag: 'WATCH',
            time: '5 Mins',
            status: 'published',
            category: 'Wellness',
            image: 'https://img.freepik.com/free-vector/meditation-concept-illustration_114360-2212.jpg',
            mediaUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
            content: "A short video introducing mindfulness techniques."
        },
        {
            title: 'Stress Management 101',
            type: 'article',
            tag: 'LEARN',
            time: '8 Mins',
            status: 'published',
            category: 'Mental Health',
            image: 'https://img.freepik.com/free-vector/stress-concept-illustration_114360-2394.jpg',
            content: "Learn how to manage stress effectively with these simple tips."
        }
    ];

    const circles = [
        {
            name: 'Community Connect',
            description: 'A community dedicated to connecting people from diverse backgrounds.',
            category: 'Culture',
            tags: ['Connect', 'Culture'],
            image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?ixlib=rb-1.2.1&auto=format&fit=crop&w=640&q=80',
            activityLevel: 'High'
        },
        {
            name: 'Mindful Moments',
            description: 'Practice mindfulness and meditation techniques to reduce stress.',
            category: 'Mental health',
            tags: ['Mental health'],
            image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-1.2.1&auto=format&fit=crop&w=640&q=80',
            activityLevel: 'Medium'
        }
    ];

    const batch = db.batch();

    // Demo user doc
    const demoUserRef = db.collection('users').doc(demoUserId);
    batch.set(demoUserRef, demoUser, { merge: true });

    // Resources
    resources.forEach(res => {
        const ref = db.collection('resources').doc();
        batch.set(ref, res);
    });

    // Circles
    circles.forEach(circle => {
        const circleRef = db.collection('circles').doc();
        batch.set(circleRef, {
            id: circleRef.id,
            name: circle.name,
            description: circle.description,
            category: circle.category,
            tags: circle.tags,
            image: circle.image,
            adminId: uid,
            members: [uid, demoUserId],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            score: 75,
            activityLevel: circle.activityLevel
        });
    });

    await batch.commit();

    // Direct chat between current user and demo user
    const chatRef = db.collection('chats').doc();
    await chatRef.set({
        type: 'direct',
        participants: [uid, demoUserId],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastMessage: 'Welcome to Empylo!',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await chatRef.collection('messages').add({
        senderId: demoUserId,
        text: 'Welcome to Empylo! Glad you are here.',
        type: 'text',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        readBy: [demoUserId]
    });

    return { success: true };
});
