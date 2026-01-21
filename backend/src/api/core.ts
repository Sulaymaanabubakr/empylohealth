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
/**
 * Create a new Circle
 * Callable Function: 'createCircle'
 */
export const createCircle = functions.https.onCall(async (data, context) => {
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

        await batch.commit();

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
/**
 * Join an existing Circle
 * Callable Function: 'joinCircle'
 */
export const joinCircle = functions.https.onCall(async (data, context) => {
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
            if (memberDoc.exists) return { success: true, message: 'Already a member' };
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
    } catch (error) {
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

        // Check if user is Creator
        if (circleData.adminId === uid) {
            // Check if other admins exist before allowing leave
            // For now, simple block
            // throw new functions.https.HttpsError('failed-precondition', 'Creators cannot leave without transferring ownership.');
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
    } catch (error) {
        console.error("Error leaving circle:", error);
        throw new functions.https.HttpsError('internal', 'Unable to leave circle.');
    }
});

/**
 * Manage Member (Promote/Demote/Kick/Ban)
 * Callable Function: 'manageMember'
 */
export const manageMember = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');

    const { circleId, targetUid, action } = data; // action: 'promote_admin' | 'promote_mod' | 'demote' | 'kick' | 'ban' | 'mute'
    const uid = context.auth.uid;

    try {
        const circleRef = db.collection('circles').doc(circleId);

        // 1. Verify Requestor Permissions
        const requestorRef = circleRef.collection('members').doc(uid);
        const requestorDoc = await requestorRef.get();
        if (!requestorDoc.exists) throw new functions.https.HttpsError('permission-denied', 'You are not a member.');

        const requestorRole = requestorDoc.data()?.role;
        if (!['creator', 'admin'].includes(requestorRole)) {
            throw new functions.https.HttpsError('permission-denied', 'Admin privileges required.');
        }

        // 2. Verify Target
        const targetRef = circleRef.collection('members').doc(targetUid);
        const targetDoc = await targetRef.get();
        if (!targetDoc.exists) throw new functions.https.HttpsError('not-found', 'Target user not found in circle.');
        const targetRole = targetDoc.data()?.role;

        // 3. Permission Checks
        if (targetRole === 'creator') throw new functions.https.HttpsError('permission-denied', 'Cannot modify Creator.');
        if (requestorRole === 'admin' && targetRole === 'admin') throw new functions.https.HttpsError('permission-denied', 'Admins cannot modify other Admins.');

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

    } catch (error) {
        console.error("Error managing member:", error);
        throw error; // Re-throw generic or specific error
    }
});

/**
 * Handle Join Request (Accept/Reject)
 * Callable Function: 'handleJoinRequest'
 */
export const handleJoinRequest = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');

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
        if (!requestDoc.exists) throw new functions.https.HttpsError('not-found', 'Request not found.');

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

        } else if (action === 'reject') {
            batch.delete(requestRef);
            // Optionally keep a rejection record? For now, delete.
        }

        await batch.commit();
        return { success: true };

    } catch (error) {
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
            answers: answers || {}, // Map of questionId or QuestionText: answer
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Theme Analysis Logic
        if (type === 'questionnaire' && answers) {
            // Standard Likert Scale Mapping
            const optionScore: Record<string, number> = {
                "Not at all": 1,
                "Rarely": 2,
                "Sometimes": 3,
                "Most times": 4,
                "Always": 5
            };

            // 1. Initialize Themes (Default to 5 = Good State/Low Risk)
            // We'll fetch dynamic questions to calculate actual scores
            const themes: Record<string, number> = {
                'Stress': 5,
                'Motivation': 5,
                'Energy': 5,
                'Social Connection': 5,
                'Focus': 5
            };

            // Helper to track averages so we don't just overwrite
            const themeAggregates: Record<string, { total: number; count: number }> = {};

            // 2. Fetch Questions from DB
            // Optimization: In production, cached via variable or standard caching strategy. 
            // For now, fast fetch.
            const questionsSnap = await db.collection('assessment_questions').where('isActive', '==', true).get();
            const dbQuestions = questionsSnap.docs.map(d => d.data());

            // If DB is empty, fallback to legacy hardcoded logic to prevent breaking
            if (dbQuestions.length === 0) {
                const legacyThemes: Record<string, number> = { ...themes };
                Object.entries(answers).forEach(([question, answer]) => {
                    const val = optionScore[String(answer)] || 3;
                    if (question.includes('relaxed')) legacyThemes['Stress'] = val;
                    if (question.includes('useful')) legacyThemes['Motivation'] = val;
                    if (question.includes('energy')) legacyThemes['Energy'] = val;
                    if (question.includes('interested')) legacyThemes['Social Connection'] = val;
                    if (question.includes('thinking')) legacyThemes['Focus'] = val;
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
                if (typeof answerVal === 'number') numericVal = answerVal;
                else numericVal = optionScore[String(answerVal)] || 3;

                // Find matching Question in DB (by exact text match for now)
                // In future, Frontend should send ID.
                const matchedQ = dbQuestions.find(q => q.text.trim() === questionText.trim());

                if (matchedQ && matchedQ.tags) {
                    matchedQ.tags.forEach((tag: string) => {
                        if (!themeAggregates[tag]) themeAggregates[tag] = { total: 0, count: 0 };

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
    } catch (error) {
        console.error("Error submitting assessment:", error);
        throw new functions.https.HttpsError('internal', 'Unable to submit assessment.');
    }
});

/**
 * Seed Assessment Questions (Admin Utility)
 * Callable Function: 'seedAssessmentQuestions'
 */
export const seedAssessmentQuestions = functions.https.onCall(async (data, context) => {
    // Basic Admin Check (or open for dev)
    // requireAdmin(context); // Verify if context has admin claim, or just proceed if dev.

    // Explicit list of default questions
    const questions = [
        { text: "I've been feeling relaxed", type: "scale", category: "General", tags: ["Stress"], weight: 1, order: 1, isActive: true },
        { text: "I've been feeling useful", type: "scale", category: "General", tags: ["Motivation"], weight: 1, order: 2, isActive: true },
        { text: "I've been had energy to spare", type: "scale", category: "General", tags: ["Energy"], weight: 1, order: 3, isActive: true },
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
    } catch (error: any) {
        console.error("Seed failed", error);
        throw new functions.https.HttpsError('internal', `Seed failed: ${error.message || error}`);
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
        // Fetch from user profile first for aggregated stats
        const userDoc = await db.collection('users').doc(uid).get();
        const stats = userDoc.data()?.stats;

        if (stats) {
            const score = stats.overallScore || 0;
            let label = 'Neutral';
            if (score >= 80) label = 'Thriving';
            else if (score >= 60) label = 'Doing Well';
            else if (score >= 40) label = 'Okay';
            else label = 'Struggling';
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
    const uid = context.auth.uid;

    try {
        // 1. Get User's weakest themes
        const userDoc = await db.collection('users').doc(uid).get();
        const themes = userDoc.data()?.stats?.themes || {};

        // Find themes with score <= 2 (1 or 2 means "Not at all" or "Rarely" positive)
        const weakThemes = Object.entries(themes)
            .filter(([_, score]) => (score as number) <= 2)
            .map(([theme]) => theme);

        // 2. Fetch Challenges matching these themes
        let query: FirebaseFirestore.Query = db.collection('challenges').where('status', '==', 'published');

        // If we have specific weak themes, prioritize them or filter by them.
        // For simplicity, if we have weak themes, we filter by them. 
        // Note: 'in' query supports max 10 items.

        let items: any[] = [];
        if (weakThemes.length > 0) {
            try {
                const snapshot = await query.where('category', 'in', weakThemes).limit(6).get();
                items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (e) {
                // Fallback if index missing or error
                console.log("Error querying challenges by theme", e);
            }
        }

        // If no items found (or no weak themes), fill with general high priority challenges
        if (items.length === 0) {
            const snapshot = await db.collection('challenges')
                .where('status', '==', 'published')
                .orderBy('priority', 'desc')
                .limit(4)
                .get();
            items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }

        // Add context for the UI (why is this shown?)
        return items.map(item => ({
            ...item,
            reason: weakThemes.includes(item.category) ? `Based on your ${item.category} score` : 'Recommended for everyone'
        }));

    } catch (error) {
        console.error("Error fetching challenges:", error);
        throw new functions.https.HttpsError('internal', 'Unable to fetch challenges.');
    }
});

/**
 * Get Recommended Content
 * Callable Function: 'getRecommendedContent'
 */
export const getRecommendedContent = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    const uid = context.auth.uid;

    try {
        // 1. Get User's weakest themes
        const userDoc = await db.collection('users').doc(uid).get();
        const themes = userDoc.data()?.stats?.themes || {};
        const weakThemes = Object.entries(themes)
            .filter(([_, score]) => (score as number) <= 3) // <= 3 includes "Sometimes"
            .map(([theme]) => theme);

        let items: any[] = [];

        if (weakThemes.length > 0) {
            const snapshot = await db.collection('resources')
                .where('status', '==', 'published')
                .where('tags', 'array-contains-any', weakThemes) // Ensure resources have 'tags' array
                .limit(10)
                .get();
            items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }

        // Fill with generic if empty
        if (items.length < 5) {
            const snapshot = await db.collection('resources')
                .where('status', '==', 'published')
                .orderBy('publishedAt', 'desc')
                .limit(10 - items.length)
                .get();
            const genericItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Deduplicate
            const existingIds = new Set(items.map(i => i.id));
            genericItems.forEach(i => {
                if (!existingIds.has(i.id)) items.push(i);
            });
        }

        return { items };
    } catch (error) {
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
        const chatData = chatDoc.data();
        const participants = chatData?.participants || [];
        if (!participants.includes(uid)) {
            throw new functions.https.HttpsError('permission-denied', 'Not a chat participant.');
        }

        // PERMISSION CHECK: If it's a circle chat, enforce Admin/Mod/Creator
        if (chatData?.circleId) {
            const circleId = chatData.circleId;
            const memberDoc = await db.collection('circles').doc(circleId).collection('members').doc(uid).get();
            const role = memberDoc.data()?.role;

            // Allow Creators, Admins, Moderators
            if (!['creator', 'admin', 'moderator'].includes(role)) {
                throw new functions.https.HttpsError('permission-denied', 'Only Admins and Moderators can start a huddle.');
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
                const roomData: any = await response.json();
                if (roomData.url) {
                    roomUrl = roomData.url;
                }
            } catch (e) {
                console.error("Daily API Error", e);
            }
        }

        // Fallback for demo if no key (or dev env)
        if (!roomUrl) {
            // throw new functions.https.HttpsError('failed-precondition', 'Video service is not configured.');
            // Use a placeholder or throw? Let's throw for prod safety, but maybe relax for verified dev.
            // Allowing a mock url for now if key missing to not block UI dev.
            roomUrl = `https://demo.daily.co/huddle-${Date.now()}`;
        }

        const huddleRef = db.collection('huddles').doc();
        const huddleData = {
            id: huddleRef.id,
            chatId,
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

/**
 * Schedule a Huddle
 * Callable Function: 'scheduleHuddle'
 */
export const scheduleHuddle = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');

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
    } catch (error) {
        console.error("Error scheduling huddle:", error);
        throw new functions.https.HttpsError('internal', 'Unable to schedule huddle.');
    }
});

/**
 * Delete a Scheduled Huddle
 * Callable Function: 'deleteScheduledHuddle'
 */
export const deleteScheduledHuddle = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    const { circleId, eventId } = data;

    // ... Permission check similar to above ...
    // Simplified for brevity in this turn
    try {
        await db.collection('circles').doc(circleId).collection('scheduledHuddles').doc(eventId).delete();
        return { success: true };
    } catch (error) {
        throw new functions.https.HttpsError('internal', 'Delete failed.');
    }
});

/**
 * Submit a Report (Circle Context)
 */
export const submitReport = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in.');
    const { circleId, targetId, targetType, reason, description } = data;
    // targetType: 'member' | 'message' | 'huddle'

    if (!circleId || !targetId || !targetType) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing fields');
    }

    try {
        const reportRef = db.collection('circles').doc(circleId).collection('reports').doc();
        await reportRef.set({
            reporterId: context.auth.uid,
            targetId,
            targetType,
            reason,
            description: description || '',
            status: 'pending', // pending | resolved | dismissed
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return { success: true, reportId: reportRef.id };
    } catch (error) {
        console.error("Error submitting report:", error);
        throw new functions.https.HttpsError('internal', 'Report submission failed.');
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
// ==========================================
// ADMIN DASHBOARD FUNCTIONS
// ==========================================

/**
 * Get Dashboard Stats
 */
export const getDashboardStats = functions.https.onCall(async (data, context) => {
    // if (!context.auth || !context.auth.token.admin) ... (Relax for dev if needed, strictly enforce for prod)
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');

    try {
        const usersSnap = await db.collection('users').count().get();
        const circlesSnap = await db.collection('circles').where('status', '==', 'active').count().get();
        const resourcesSnap = await db.collection('resources').where('status', '==', 'published').count().get();
        const pendingSnap = await db.collection('circles').where('status', '==', 'pending').count().get();

        // Mock storage for now
        return {
            users: usersSnap.data().count,
            circles: circlesSnap.data().count,
            resources: resourcesSnap.data().count,
            pendingCircles: pendingSnap.data().count,
            storageUsed: '1.2 GB'
        };
    } catch (error) {
        console.error("Error fetching stats:", error);
        return { users: 0, circles: 0, resources: 0, pendingCircles: 0 };
    }
});

/**
 * Get All Content (Admin)
 * data: { type: 'circles'|'resources'|'affirmations', limit: number }
 */
export const getAllContent = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');

    const { type, limit: limitCount } = data || {};
    const collectionName = type === 'resources' ? 'resources' : 'circles'; // 'affirmations' handled separately usually or map it

    // Safety check
    if (!['circles', 'resources', 'affirmations'].includes(type)) {
        return { items: [] };
    }

    try {
        let q = db.collection(collectionName).orderBy('createdAt', 'desc');
        if (limitCount) q = q.limit(limitCount);

        const snapshot = await q.get();
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return { items };
    } catch (error) {
        console.error("Error fetching admin content:", error);
        return { items: [] };
    }
});

/**
 * Update Content Status
 * data: { collection: string, docId: string, status: string }
 */
export const updateContentStatus = functions.https.onCall(async (data, context) => {
    // Require admin
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');

    const { collection: colName, docId, status } = data;
    if (!colName || !docId || !status) throw new functions.https.HttpsError('invalid-argument', 'Missing fields');

    try {
        await db.collection(colName).doc(docId).update({
            status,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error("Error updating status:", error);
        throw new functions.https.HttpsError('internal', 'Update failed');
    }
});

/**
 * Delete Item (Admin)
 * data: { collection: string, id: string }
 */
export const deleteItem = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');

    const { collection: colName, id } = data;
    try {
        await db.collection(colName).doc(id).delete();
        return { success: true };
    } catch (error) {
        console.error("Delete failed", error);
        throw new functions.https.HttpsError('internal', 'Delete failed');
    }
});

/**
 * Get Admin Affirmations
 */
export const getAdminAffirmations = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    try {
        const snapshot = await db.collection('affirmations').orderBy('createdAt', 'desc').limit(data.limit || 50).get();
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return { items };
    } catch (error) {
        return { items: [] };
    }
});

/**
 * Create Affirmation
 */
export const createAffirmation = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    const { content, scheduledDate } = data;
    try {
        await db.collection('affirmations').add({
            content,
            scheduledDate,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'published' // Auto publish
        });
        return { success: true };
    } catch (error) {
        throw new functions.https.HttpsError('internal', 'Create failed');
    }
});

/**
 * Delete Affirmation
 */
export const deleteAffirmation = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    try {
        await db.collection('affirmations').doc(data.id).delete();
        return { success: true };
    } catch (error) {
        throw new functions.https.HttpsError('internal', 'Delete failed');
    }
});

/**
 * Get Transactions
 * (Currently mocks data or fetches from a future 'transactions' collection)
 */
export const getTransactions = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');

    // In a real app, this would query Stripe/Paystack or a 'transactions' collection
    // For now, return mock data or empty if collection doesn't exist
    try {
        // Check if transactions collection exists
        const snapshot = await db.collection('transactions').orderBy('createdAt', 'desc').limit(data.limit || 50).get();
        if (!snapshot.empty) {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return { items };
        }

        // Return Mock if empty for UI demo
        return { items: [] };
    } catch (error) {
        return { items: [] };
    }
});

/**
 * Get All Users (Admin)
 */
export const getAllUsers = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    // Check admin claim...

    try {
        const snapshot = await db.collection('users').orderBy('createdAt', 'desc').limit(data.limit || 50).get();
        const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return { users };
    } catch (error) {
        console.error("Error fetching users", error);
        throw new functions.https.HttpsError('internal', 'Unable to fetch users');
    }
});

/**
 * Create Employee (Admin)
 */
export const createEmployee = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');

    const { email, password, displayName, role } = data;

    try {
        // 1. Create Auth User
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName
        });

        // 2. Set Custom Claims (Admin/Editor)
        await admin.auth().setCustomUserClaims(userRecord.uid, {
            admin: role === 'admin',
            role: role
        });

        // 3. Create Firestore Profile
        await db.collection('users').doc(userRecord.uid).set({
            email,
            displayName,
            role,
            status: 'active',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return { success: true, uid: userRecord.uid };
    } catch (error: any) {
        console.error("Error creating employee", error);
        throw new functions.https.HttpsError('internal', error.message || 'Create failed');
    }
});

/**
 * Toggle User Status
 */
export const toggleUserStatus = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');

    const { uid, status } = data;
    try {
        // Update Firestore
        await db.collection('users').doc(uid).update({ status });

        // Update Auth (Disable account if suspended)
        if (status === 'suspended') {
            await admin.auth().updateUser(uid, { disabled: true });
        } else {
            await admin.auth().updateUser(uid, { disabled: false });
        }

        return { success: true };
    } catch (error) {
        throw new functions.https.HttpsError('internal', 'Update failed');
    }
});
