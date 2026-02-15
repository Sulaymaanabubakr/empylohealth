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
exports.backfillUserCircles = exports.updateTicketStatus = exports.getSupportTickets = exports.resolveReport = exports.getReports = exports.getTransactions = exports.deleteAffirmation = exports.createAffirmation = exports.getAdminAffirmations = exports.deleteItem = exports.toggleUserStatus = exports.updateContentStatus = exports.getAllContent = exports.getPendingContent = exports.getAllUsers = exports.getDashboardStats = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
// Re-initialize if needed (though index.ts usually handles this)
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();
const regionalFunctions = functions.region('europe-west1');
const auth = admin.auth();
// Helper to enforce admin permissions
const requireAdmin = (context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be logged in.');
    }
    // Check custom claim 'admin' or hardcoded super admins
    const SUPER_ADMINS = ['sulaymaanabubakr@gmail.com', 'gcmusariri@gmail.com'];
    const userEmail = (context.auth.token.email || '').toLowerCase();
    if (context.auth.token.admin !== true && !SUPER_ADMINS.includes(userEmail)) {
        throw new functions.https.HttpsError('permission-denied', 'Admin privileges required.');
    }
};
/**
 * Get Dashboard Stats
 */
exports.getDashboardStats = regionalFunctions.https.onCall(async (data, context) => {
    requireAdmin(context);
    try {
        const usersCount = (await db.collection('users').count().get()).data().count;
        const circlesCount = (await db.collection('circles').count().get()).data().count;
        const resourcesCount = (await db.collection('resources').count().get()).data().count;
        const pendingCircles = (await db.collection('circles').where('status', '==', 'pending').count().get()).data().count;
        return {
            users: usersCount,
            circles: circlesCount,
            resources: resourcesCount,
            pendingCircles: pendingCircles,
            storageUsed: null
        };
    }
    catch (error) {
        console.error("Error fetching admin stats:", error);
        throw new functions.https.HttpsError('internal', 'Unable to fetch dashboard stats.');
    }
});
/**
 * Get All Users (Paginated)
 */
exports.getAllUsers = regionalFunctions.https.onCall(async (data, context) => {
    requireAdmin(context);
    const { limit = 20, startAfterId, roles } = data; // roles: string[]
    try {
        let query = db.collection('users').orderBy('createdAt', 'desc').limit(limit);
        if (roles && Array.isArray(roles) && roles.length > 0) {
            query = db.collection('users').where('role', 'in', roles).orderBy('createdAt', 'desc').limit(limit);
        }
        if (startAfterId) {
            const lastDoc = await db.collection('users').doc(startAfterId).get();
            if (lastDoc.exists) {
                query = query.startAfter(lastDoc);
            }
        }
        const snapshot = await query.get();
        const users = snapshot.docs.map(doc => {
            const d = doc.data();
            return {
                id: doc.id,
                email: d.email,
                displayName: d.displayName || 'No Name',
                photoURL: d.photoURL,
                role: d.role || 'user',
                status: d.status || 'active', // 'active' | 'suspended'
                lastLoginAt: d.lastLoginAt?.toDate().toISOString(),
                createdAt: d.createdAt?.toDate().toISOString()
            };
        });
        return { users, lastId: users.length > 0 ? users[users.length - 1]?.id : null };
    }
    catch (error) {
        console.error("Error fetching users:", error);
        throw new functions.https.HttpsError('internal', 'Unable to fetch users.');
    }
});
/**
 * Get Pending Circles/Content
 */
exports.getPendingContent = regionalFunctions.https.onCall(async (data, context) => {
    requireAdmin(context);
    try {
        const circlesSnap = await db.collection('circles')
            .where('status', '==', 'pending')
            .orderBy('createdAt', 'desc')
            .get();
        const circles = circlesSnap.docs.map(doc => ({
            id: doc.id,
            type: 'circle',
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate().toISOString()
        }));
        return { items: circles };
    }
    catch (error) {
        console.error("Error fetching pending content:", error);
        throw new functions.https.HttpsError('internal', 'Unable to fetch pending content.');
    }
});
/**
 * Get All Content (Circles/Resources)
 */
exports.getAllContent = regionalFunctions.https.onCall(async (data, context) => {
    requireAdmin(context);
    const { type = 'circles', limit = 20, startAfterId } = data;
    if (!['circles', 'resources'].includes(type)) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid content type.');
    }
    try {
        let query = db.collection(type).orderBy('createdAt', 'desc').limit(limit);
        if (startAfterId) {
            const lastDoc = await db.collection(type).doc(startAfterId).get();
            if (lastDoc.exists) {
                query = query.startAfter(lastDoc);
            }
        }
        const snapshot = await query.get();
        const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate().toISOString()
        }));
        return { items, lastId: items.length > 0 ? items[items.length - 1]?.id : null };
    }
    catch (error) {
        console.error("Error fetching content:", error);
        throw new functions.https.HttpsError('internal', 'Unable to fetch content.');
    }
});
/**
 * Approve or Reject Content
 */
exports.updateContentStatus = regionalFunctions.https.onCall(async (data, context) => {
    requireAdmin(context);
    const { collection, docId, status } = data; // status: 'active' | 'rejected' | 'suspended'
    if (!['circles', 'resources'].includes(collection)) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid collection type.');
    }
    try {
        await db.collection(collection).doc(docId).update({
            status: status,
            reviewedBy: context.auth.uid,
            reviewedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return { success: true };
    }
    catch (error) {
        console.error("Error updating status:", error);
        throw new functions.https.HttpsError('internal', 'Unable to update status.');
    }
});
/**
 * Suspend/Activate User
 */
exports.toggleUserStatus = regionalFunctions.https.onCall(async (data, context) => {
    requireAdmin(context);
    const { uid, status } = data; // 'active' | 'suspended'
    if (!uid || !status) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing uid or status.');
    }
    try {
        // Toggle Firestore status
        await db.collection('users').doc(uid).update({ status });
        // Toggle Auth status
        await auth.updateUser(uid, { disabled: status === 'suspended' });
        return { success: true };
    }
    catch (error) {
        console.error("Error toggling user status:", error);
        throw new functions.https.HttpsError('internal', 'Unable to toggle user status.');
    }
});
/**
 * Delete Item (User, Circle, Resource)
 */
exports.deleteItem = regionalFunctions.https.onCall(async (data, context) => {
    requireAdmin(context);
    const { collection, id } = data;
    if (!collection || !id) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing collection or id.');
    }
    try {
        if (collection === 'users') {
            await auth.deleteUser(id);
            await db.collection('users').doc(id).delete();
        }
        else {
            // For content
            await db.collection(collection).doc(id).delete();
        }
        return { success: true };
    }
    catch (error) {
        console.error("Error deleting item:", error);
        throw new functions.https.HttpsError('internal', 'Unable to delete item.');
    }
});
/**
 * Get Admin Affirmations
 */
exports.getAdminAffirmations = regionalFunctions.https.onCall(async (data, context) => {
    requireAdmin(context);
    const { limit = 50, startAfterId } = data || {};
    try {
        // Use publishedAt for stable ordering (always present in seeded + created items)
        let query = db.collection('affirmations').orderBy('publishedAt', 'desc').limit(limit);
        if (startAfterId) {
            const lastDoc = await db.collection('affirmations').doc(startAfterId).get();
            if (lastDoc.exists) {
                query = query.startAfter(lastDoc);
            }
        }
        const snapshot = await query.get();
        const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate().toISOString() || doc.data().publishedAt?.toDate().toISOString()
        }));
        return { items, lastId: items.length > 0 ? items[items.length - 1]?.id : null };
    }
    catch (error) {
        console.error("Error fetching affirmations:", error);
        throw new functions.https.HttpsError('internal', 'Unable to fetch affirmations.');
    }
});
/**
 * Create Admin Affirmation
 */
exports.createAffirmation = regionalFunctions.https.onCall(async (data, context) => {
    requireAdmin(context);
    const { content, scheduledDate } = data || {};
    if (!content) {
        throw new functions.https.HttpsError('invalid-argument', 'Affirmation content is required.');
    }
    try {
        const ref = await db.collection('affirmations').add({
            content,
            scheduledDate: scheduledDate || null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            publishedAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: context.auth.uid,
            isNew: true
        });
        return { success: true, id: ref.id };
    }
    catch (error) {
        console.error("Error creating affirmation:", error);
        throw new functions.https.HttpsError('internal', 'Unable to create affirmation.');
    }
});
/**
 * Delete Admin Affirmation
 */
exports.deleteAffirmation = regionalFunctions.https.onCall(async (data, context) => {
    requireAdmin(context);
    const { id } = data || {};
    if (!id) {
        throw new functions.https.HttpsError('invalid-argument', 'Affirmation id is required.');
    }
    try {
        await db.collection('affirmations').doc(id).delete();
        return { success: true };
    }
    catch (error) {
        console.error("Error deleting affirmation:", error);
        throw new functions.https.HttpsError('internal', 'Unable to delete affirmation.');
    }
});
/**
 * Get Transactions (Admin)
 */
exports.getTransactions = regionalFunctions.https.onCall(async (data, context) => {
    requireAdmin(context);
    const { limit = 50, startAfterId } = data || {};
    try {
        let query = db.collection('transactions').orderBy('createdAt', 'desc').limit(limit);
        if (startAfterId) {
            const lastDoc = await db.collection('transactions').doc(startAfterId).get();
            if (lastDoc.exists) {
                query = query.startAfter(lastDoc);
            }
        }
        const snapshot = await query.get();
        const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate().toISOString()
        }));
        return { items, lastId: items.length > 0 ? items[items.length - 1]?.id : null };
    }
    catch (error) {
        console.error("Error fetching transactions:", error);
        throw new functions.https.HttpsError('internal', 'Unable to fetch transactions.');
    }
});
/**
 * Get Reports (Moderation)
 */
exports.getReports = regionalFunctions.https.onCall(async (data, context) => {
    requireAdmin(context);
    const { limit = 50, startAfterId, status } = data; // status: 'pending' | 'resolved'
    try {
        let query = db.collection('reports').orderBy('createdAt', 'desc').limit(limit);
        if (status) {
            query = db.collection('reports').where('status', '==', status).orderBy('createdAt', 'desc').limit(limit);
        }
        if (startAfterId) {
            const lastDoc = await db.collection('reports').doc(startAfterId).get();
            if (lastDoc.exists)
                query = query.startAfter(lastDoc);
        }
        const snapshot = await query.get();
        const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate().toISOString()
        }));
        return { items, lastId: items.length > 0 ? items[items.length - 1]?.id : null };
    }
    catch (error) {
        console.error("Error fetching reports:", error);
        throw new functions.https.HttpsError('internal', 'Unable to fetch reports.');
    }
});
/**
 * Resolve Report
 */
exports.resolveReport = regionalFunctions.https.onCall(async (data, context) => {
    requireAdmin(context);
    const { reportId, action, notes } = data;
    // action: 'dismiss' | 'warning' | 'suspend_user' | 'delete_content'
    if (!reportId || !action)
        throw new functions.https.HttpsError('invalid-argument', 'Missing fields');
    try {
        const reportRef = db.collection('reports').doc(reportId);
        const reportDoc = await reportRef.get();
        const reportData = reportDoc.data();
        const batch = db.batch();
        // 1. Update Report Status
        batch.update(reportRef, {
            status: 'resolved',
            resolutionAction: action,
            resolutionNotes: notes || '',
            resolvedBy: context.auth.uid,
            resolvedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // 2. Perform Action
        if (action === 'suspend_user' && reportData?.reportedUserId) {
            const userRef = db.collection('users').doc(reportData.reportedUserId);
            batch.update(userRef, { status: 'suspended' });
            await auth.updateUser(reportData.reportedUserId, { disabled: true });
        }
        else if (action === 'delete_content' && reportData?.contentId && reportData?.contentType) {
            const deletableCollections = ['circles', 'resources', 'users', 'challenges', 'affirmations'];
            if (deletableCollections.includes(reportData.contentType)) {
                const contentRef = db.collection(reportData.contentType).doc(reportData.contentId);
                batch.delete(contentRef);
            }
        }
        await batch.commit();
        return { success: true };
    }
    catch (error) {
        console.error("Report resolution failed", error);
        throw new functions.https.HttpsError('internal', 'Resolution failed');
    }
});
/**
 * Get Support Tickets
 */
exports.getSupportTickets = regionalFunctions.https.onCall(async (data, context) => {
    requireAdmin(context);
    const { limit = 50, startAfterId, status } = data;
    try {
        let query = db.collection('support_tickets').orderBy('createdAt', 'desc').limit(limit);
        if (status) {
            query = db.collection('support_tickets').where('status', '==', status).orderBy('createdAt', 'desc').limit(limit);
        }
        if (startAfterId) {
            const lastDoc = await db.collection('support_tickets').doc(startAfterId).get();
            if (lastDoc.exists)
                query = query.startAfter(lastDoc);
        }
        const snapshot = await query.get();
        const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate().toISOString()
        }));
        return { items, lastId: items.length > 0 ? items[items.length - 1]?.id : null };
    }
    catch (error) {
        console.error("Error fetching tickets:", error);
        throw new functions.https.HttpsError('internal', 'Unable to fetch tickets.');
    }
});
/**
 * Update Ticket Status
 */
exports.updateTicketStatus = regionalFunctions.https.onCall(async (data, context) => {
    requireAdmin(context);
    const { ticketId, status, reply } = data; // status: 'open' | 'resolved' | 'pending'
    try {
        await db.collection('support_tickets').doc(ticketId).update({
            status,
            lastReply: reply || null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: context.auth.uid
        });
        return { success: true };
    }
    catch (error) {
        throw new functions.https.HttpsError('internal', 'Update failed');
    }
});
/**
 * Backfill userCircles index from circles.members arrays
 * Callable Function: 'backfillUserCircles'
 */
exports.backfillUserCircles = regionalFunctions.https.onCall(async (data, context) => {
    requireAdmin(context);
    const { limit = 100, startAfterId = null } = data || {};
    try {
        let query = db.collection('circles').orderBy('createdAt', 'desc').limit(limit);
        if (startAfterId) {
            const lastDoc = await db.collection('circles').doc(startAfterId).get();
            if (lastDoc.exists)
                query = query.startAfter(lastDoc);
        }
        const snap = await query.get();
        if (snap.empty)
            return { success: true, processed: 0, nextPage: null };
        const batch = db.batch();
        snap.docs.forEach((docSnap) => {
            const circle = docSnap.data() || {};
            const circleId = docSnap.id;
            const members = Array.isArray(circle.members) ? circle.members : [];
            members.forEach((uid) => {
                const userCirclesRef = db.collection('userCircles').doc(uid);
                batch.set(userCirclesRef, {
                    circleIds: admin.firestore.FieldValue.arrayUnion(circleId)
                }, { merge: true });
                batch.set(userCirclesRef.collection('circles').doc(circleId), {
                    circleId,
                    role: uid === circle.adminId ? 'creator' : 'member',
                    status: 'member',
                    joinedAt: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            });
        });
        await batch.commit();
        const last = snap.docs[snap.docs.length - 1];
        return { success: true, processed: snap.size, nextPage: last?.id || null };
    }
    catch (error) {
        console.error('Backfill userCircles error', error);
        throw new functions.https.HttpsError('internal', 'Backfill failed.');
    }
});
//# sourceMappingURL=admin.js.map