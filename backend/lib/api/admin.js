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
exports.deleteItem = exports.toggleUserStatus = exports.updateContentStatus = exports.getAllContent = exports.getPendingContent = exports.getAllUsers = exports.getDashboardStats = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
// Re-initialize if needed (though index.ts usually handles this)
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();
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
exports.getDashboardStats = functions.https.onCall(async (data, context) => {
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
            storageUsed: '29.1 GB'
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
exports.getAllUsers = functions.https.onCall(async (data, context) => {
    requireAdmin(context);
    const { limit = 20, startAfterId } = data;
    try {
        let query = db.collection('users').orderBy('createdAt', 'desc').limit(limit);
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
exports.getPendingContent = functions.https.onCall(async (data, context) => {
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
exports.getAllContent = functions.https.onCall(async (data, context) => {
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
exports.updateContentStatus = functions.https.onCall(async (data, context) => {
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
exports.toggleUserStatus = functions.https.onCall(async (data, context) => {
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
exports.deleteItem = functions.https.onCall(async (data, context) => {
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
//# sourceMappingURL=admin.js.map