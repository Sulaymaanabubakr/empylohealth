import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

// Re-initialize if needed (though index.ts usually handles this)
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();
const regionalFunctions = functions.region('europe-west1');
const auth = admin.auth();
type AdminPermission =
    | 'dashboard.view'
    | 'users.view'
    | 'users.manage'
    | 'users.delete'
    | 'employees.manage'
    | 'content.view'
    | 'content.edit'
    | 'content.delete'
    | 'moderation.view'
    | 'moderation.resolve'
    | 'support.view'
    | 'support.manage'
    | 'finance.view'
    | 'audit.view';

const SUPER_ADMINS = ['sulaymaanabubakr@gmail.com', 'gcmusariri@gmail.com'];

const ROLE_PERMISSIONS: Record<string, AdminPermission[]> = {
    admin: [
        'dashboard.view',
        'users.view',
        'users.manage',
        'users.delete',
        'employees.manage',
        'content.view',
        'content.edit',
        'content.delete',
        'moderation.view',
        'moderation.resolve',
        'support.view',
        'support.manage',
        'finance.view',
        'audit.view'
    ],
    editor: ['dashboard.view', 'content.view', 'content.edit', 'moderation.view'],
    moderator: ['dashboard.view', 'users.view', 'content.view', 'moderation.view', 'moderation.resolve', 'support.view'],
    support: ['dashboard.view', 'users.view', 'support.view', 'support.manage', 'moderation.view'],
    finance: ['dashboard.view', 'finance.view'],
    viewer: ['dashboard.view', 'users.view', 'content.view', 'moderation.view', 'support.view', 'finance.view', 'audit.view']
};

const getActor = (context: functions.https.CallableContext) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be logged in.');
    }
    const uid = context.auth.uid;
    const email = String(context.auth.token.email || '').toLowerCase();
    const role = String(context.auth.token.role || 'admin').toLowerCase();
    const customPermissions = Array.isArray(context.auth.token.permissions)
        ? context.auth.token.permissions.map((p) => String(p))
        : [];
    const isAdminClaim = context.auth.token.admin === true;
    const isSuperAdmin = context.auth.token.superAdmin === true || SUPER_ADMINS.includes(email);
    if (!isAdminClaim && !isSuperAdmin) {
        throw new functions.https.HttpsError('permission-denied', 'Admin privileges required.');
    }
    return {
        uid,
        email,
        role: isSuperAdmin ? 'super_admin' : role,
        isSuperAdmin,
        permissions: customPermissions
    };
};

const requireAdmin = (context: functions.https.CallableContext, permission?: AdminPermission) => {
    const actor = getActor(context);
    if (!permission || actor.isSuperAdmin || actor.role === 'super_admin') return actor;

    const allowed = new Set<AdminPermission>([
        ...(ROLE_PERMISSIONS[actor.role] || []),
        ...(actor.permissions as AdminPermission[])
    ]);
    if (!allowed.has(permission)) {
        throw new functions.https.HttpsError('permission-denied', `Missing permission: ${permission}`);
    }
    return actor;
};

const toSerializable = (value: any): any => {
    if (!value || typeof value !== 'object') return value;
    if (value instanceof admin.firestore.Timestamp) return value.toDate().toISOString();
    if (Array.isArray(value)) return value.map((item) => toSerializable(item));
    const out: Record<string, any> = {};
    Object.entries(value).forEach(([key, item]) => {
        out[key] = toSerializable(item);
    });
    return out;
};

const writeAuditLog = async (params: {
    context: functions.https.CallableContext;
    action: string;
    targetCollection?: string;
    targetId?: string;
    before?: any;
    after?: any;
    metadata?: Record<string, any>;
}) => {
    try {
        const actor = getActor(params.context);
        const forwardedFor = String(params.context.rawRequest?.headers?.['x-forwarded-for'] || '');
        const ip = forwardedFor.split(',')[0]?.trim() || params.context.rawRequest?.ip || null;
        const userAgent = String(params.context.rawRequest?.headers?.['user-agent'] || '');
        await db.collection('adminAuditLogs').add({
            action: params.action,
            actorUid: actor.uid,
            actorEmail: actor.email,
            actorRole: actor.role,
            targetCollection: params.targetCollection || null,
            targetId: params.targetId || null,
            before: params.before ? toSerializable(params.before) : null,
            after: params.after ? toSerializable(params.after) : null,
            metadata: params.metadata || {},
            sourceIp: ip,
            userAgent,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Failed to write admin audit log', error);
    }
};

const softDeleteDocument = async (
    collection: string,
    id: string,
    context: functions.https.CallableContext,
    reason = 'admin_delete'
) => {
    const docRef = db.collection(collection).doc(id);
    const snap = await docRef.get();
    if (!snap.exists) {
        throw new functions.https.HttpsError('not-found', `Document not found in ${collection}: ${id}`);
    }
    const before = snap.data() || {};
    await docRef.set({
        isDeleted: true,
        status: 'deleted',
        deletedAt: admin.firestore.FieldValue.serverTimestamp(),
        deletedBy: context.auth?.uid || null,
        deletedReason: reason
    }, { merge: true });

    const afterSnap = await docRef.get();
    await writeAuditLog({
        context,
        action: 'soft_delete',
        targetCollection: collection,
        targetId: id,
        before,
        after: afterSnap.data() || {},
        metadata: { reason }
    });
};

/**
 * Get Dashboard Stats
 */
export const getDashboardStats = regionalFunctions.https.onCall(async (data, context) => {
    requireAdmin(context, 'dashboard.view');

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
    } catch (error) {
        console.error("Error fetching admin stats:", error);
        throw new functions.https.HttpsError('internal', 'Unable to fetch dashboard stats.');
    }
});

/**
 * Get All Users (Paginated)
 */
export const getAllUsers = regionalFunctions.https.onCall(async (data, context) => {
    requireAdmin(context, 'users.view');
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
    } catch (error) {
        console.error("Error fetching users:", error);
        throw new functions.https.HttpsError('internal', 'Unable to fetch users.');
    }
});

/**
 * Get Pending Circles/Content
 */
export const getPendingContent = regionalFunctions.https.onCall(async (data, context) => {
    requireAdmin(context, 'content.view');
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
    } catch (error) {
        console.error("Error fetching pending content:", error);
        throw new functions.https.HttpsError('internal', 'Unable to fetch pending content.');
    }
});

/**
 * Get All Content (Circles/Resources)
 */
export const getAllContent = regionalFunctions.https.onCall(async (data, context) => {
    requireAdmin(context, 'content.view');
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
        })).filter((item: any) => item.isDeleted !== true);

        return { items, lastId: items.length > 0 ? items[items.length - 1]?.id : null };
    } catch (error) {
        console.error("Error fetching content:", error);
        throw new functions.https.HttpsError('internal', 'Unable to fetch content.');
    }
});

/**
 * Approve or Reject Content
 */
export const updateContentStatus = regionalFunctions.https.onCall(async (data, context) => {
    requireAdmin(context, 'content.edit');
    const { collection, docId, status } = data; // status: 'active' | 'rejected' | 'suspended'

    if (!['circles', 'resources'].includes(collection)) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid collection type.');
    }

    try {
        const docRef = db.collection(collection).doc(docId);
        const beforeSnap = await docRef.get();
        const before = beforeSnap.data() || null;
        await db.collection(collection).doc(docId).update({
            status: status,
            reviewedBy: context.auth!.uid,
            reviewedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        const afterSnap = await docRef.get();
        await writeAuditLog({
            context,
            action: 'update_content_status',
            targetCollection: collection,
            targetId: docId,
            before,
            after: afterSnap.data() || null,
            metadata: { status }
        });
        return { success: true };
    } catch (error) {
        console.error("Error updating status:", error);
        throw new functions.https.HttpsError('internal', 'Unable to update status.');
    }
});

/**
 * Edit Content Item (Circles / Resources / Affirmations)
 */
export const updateContentItem = regionalFunctions.https.onCall(async (data, context) => {
    requireAdmin(context, 'content.edit');
    const { collection, id, updates } = data || {};

    if (!collection || !id || !updates || typeof updates !== 'object') {
        throw new functions.https.HttpsError('invalid-argument', 'Missing collection, id, or updates.');
    }

    const allowedCollections = ['circles', 'resources', 'affirmations'];
    if (!allowedCollections.includes(collection)) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid collection type.');
    }

    const editableFields: Record<string, string[]> = {
        circles: ['name', 'description', 'image', 'type', 'category', 'status'],
        resources: ['title', 'description', 'content', 'image', 'category', 'tag', 'time', 'status'],
        affirmations: ['content', 'scheduledDate', 'status']
    };

    const allowed = editableFields[collection] || [];
    const sanitizedUpdates: Record<string, any> = {};

    for (const [key, value] of Object.entries(updates)) {
        if (!allowed.includes(key)) continue;
        if (typeof value === 'string') {
            sanitizedUpdates[key] = value.trim();
        } else {
            sanitizedUpdates[key] = value;
        }
    }

    if (Object.keys(sanitizedUpdates).length === 0) {
        throw new functions.https.HttpsError('invalid-argument', 'No editable fields provided.');
    }

    sanitizedUpdates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    sanitizedUpdates.updatedBy = context.auth!.uid;

    try {
        const docRef = db.collection(collection).doc(id);
        const beforeSnap = await docRef.get();
        const before = beforeSnap.data() || null;
        await docRef.update(sanitizedUpdates);
        const afterSnap = await docRef.get();
        await writeAuditLog({
            context,
            action: 'update_content_item',
            targetCollection: collection,
            targetId: id,
            before,
            after: afterSnap.data() || null
        });
        return { success: true };
    } catch (error) {
        console.error('Error editing content item:', error);
        throw new functions.https.HttpsError('internal', 'Unable to update content item.');
    }
});

/**
 * Suspend/Activate User
 */
export const toggleUserStatus = regionalFunctions.https.onCall(async (data, context) => {
    requireAdmin(context, 'users.manage');
    const { uid, status } = data; // 'active' | 'suspended'

    if (!uid || !status) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing uid or status.');
    }

    try {
        const userRef = db.collection('users').doc(uid);
        const beforeSnap = await userRef.get();
        const before = beforeSnap.data() || null;
        // Toggle Firestore status
        await userRef.update({ status });

        // Toggle Auth status
        await auth.updateUser(uid, { disabled: status === 'suspended' });
        const afterSnap = await userRef.get();
        await writeAuditLog({
            context,
            action: 'toggle_user_status',
            targetCollection: 'users',
            targetId: uid,
            before,
            after: afterSnap.data() || null,
            metadata: { status }
        });

        return { success: true };
    } catch (error) {
        console.error("Error toggling user status:", error);
        throw new functions.https.HttpsError('internal', 'Unable to toggle user status.');
    }
});

/**
 * Delete Item (User, Circle, Resource)
 */
export const deleteItem = regionalFunctions.https.onCall(async (data, context) => {
    const { collection, id } = data || {};

    if (!collection || !id) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing collection or id.');
    }
    const allowedCollections = ['users', 'circles', 'resources', 'affirmations', 'challenges'];
    if (!allowedCollections.includes(collection)) {
        throw new functions.https.HttpsError('invalid-argument', 'Unsupported collection.');
    }
    requireAdmin(context, collection === 'users' ? 'users.delete' : 'content.delete');

    try {
        if (collection === 'users') {
            const beforeSnap = await db.collection('users').doc(id).get();
            const before = beforeSnap.data() || null;
            await auth.deleteUser(id);
            await db.collection('users').doc(id).delete();
            await writeAuditLog({
                context,
                action: 'delete_user',
                targetCollection: 'users',
                targetId: id,
                before,
                after: null
            });
        } else {
            await softDeleteDocument(collection, id, context, 'admin_delete');
        }
        return { success: true };
    } catch (error) {
        console.error("Error deleting item:", error);
        throw new functions.https.HttpsError('internal', 'Unable to delete item.');
    }
});

/**
 * Get Admin Affirmations
 */
export const getAdminAffirmations = regionalFunctions.https.onCall(async (data, context) => {
    requireAdmin(context, 'content.view');
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
        })).filter((item: any) => item.isDeleted !== true);

        return { items, lastId: items.length > 0 ? items[items.length - 1]?.id : null };
    } catch (error) {
        console.error("Error fetching affirmations:", error);
        throw new functions.https.HttpsError('internal', 'Unable to fetch affirmations.');
    }
});

/**
 * Create Admin Affirmation
 */
export const createAffirmation = regionalFunctions.https.onCall(async (data, context) => {
    requireAdmin(context, 'content.edit');
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
            createdBy: context.auth!.uid,
            isNew: true
        });
        const afterSnap = await ref.get();
        await writeAuditLog({
            context,
            action: 'create_affirmation',
            targetCollection: 'affirmations',
            targetId: ref.id,
            after: afterSnap.data() || null
        });

        return { success: true, id: ref.id };
    } catch (error) {
        console.error("Error creating affirmation:", error);
        throw new functions.https.HttpsError('internal', 'Unable to create affirmation.');
    }
});

/**
 * Delete Admin Affirmation
 */
export const deleteAffirmation = regionalFunctions.https.onCall(async (data, context) => {
    requireAdmin(context, 'content.delete');
    const { id } = data || {};

    if (!id) {
        throw new functions.https.HttpsError('invalid-argument', 'Affirmation id is required.');
    }

    try {
        await softDeleteDocument('affirmations', id, context, 'admin_delete');
        return { success: true };
    } catch (error) {
        console.error("Error deleting affirmation:", error);
        throw new functions.https.HttpsError('internal', 'Unable to delete affirmation.');
    }
});

/**
 * Get Transactions (Admin)
 */
export const getTransactions = regionalFunctions.https.onCall(async (data, context) => {
    requireAdmin(context, 'finance.view');
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
    } catch (error) {
        console.error("Error fetching transactions:", error);
        throw new functions.https.HttpsError('internal', 'Unable to fetch transactions.');
    }
});

/**
 * Get Reports (Moderation)
 */
export const getReports = regionalFunctions.https.onCall(async (data, context) => {
    requireAdmin(context, 'moderation.view');
    const { limit = 50, startAfterId, status } = data; // status: 'pending' | 'resolved'

    try {
        let query = db.collection('reports').orderBy('createdAt', 'desc').limit(limit);

        if (status) {
            query = db.collection('reports').where('status', '==', status).orderBy('createdAt', 'desc').limit(limit);
        }

        if (startAfterId) {
            const lastDoc = await db.collection('reports').doc(startAfterId).get();
            if (lastDoc.exists) query = query.startAfter(lastDoc);
        }

        const snapshot = await query.get();
        const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate().toISOString()
        }));

        return { items, lastId: items.length > 0 ? items[items.length - 1]?.id : null };
    } catch (error) {
        console.error("Error fetching reports:", error);
        throw new functions.https.HttpsError('internal', 'Unable to fetch reports.');
    }
});

/**
 * Resolve Report
 */
export const resolveReport = regionalFunctions.https.onCall(async (data, context) => {
    requireAdmin(context, 'moderation.resolve');
    const { reportId, action, notes } = data;
    // action: 'dismiss' | 'warning' | 'suspend_user' | 'delete_content'

    if (!reportId || !action) throw new functions.https.HttpsError('invalid-argument', 'Missing fields');

    try {
        const reportRef = db.collection('reports').doc(reportId);
        const reportDoc = await reportRef.get();
        const reportData = reportDoc.data();
        const beforeReport = reportData || null;

        const batch = db.batch();

        // 1. Update Report Status
        batch.update(reportRef, {
            status: 'resolved',
            resolutionAction: action,
            resolutionNotes: notes || '',
            resolvedBy: context.auth!.uid,
            resolvedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // 2. Perform Action
        if (action === 'suspend_user' && reportData?.reportedUserId) {
            const userRef = db.collection('users').doc(reportData.reportedUserId);
            batch.update(userRef, { status: 'suspended' });
            await auth.updateUser(reportData.reportedUserId, { disabled: true });
        } else if (action === 'delete_content' && reportData?.contentId && reportData?.contentType) {
            const deletableCollections = ['circles', 'resources', 'users', 'challenges', 'affirmations'];
            if (deletableCollections.includes(reportData.contentType)) {
                if (reportData.contentType === 'users') {
                    const contentRef = db.collection(reportData.contentType).doc(reportData.contentId);
                    batch.delete(contentRef);
                } else {
                    await softDeleteDocument(reportData.contentType, reportData.contentId, context, 'report_resolution');
                }
            }
        }

        await batch.commit();
        const afterReport = (await reportRef.get()).data() || null;
        await writeAuditLog({
            context,
            action: 'resolve_report',
            targetCollection: 'reports',
            targetId: reportId,
            before: beforeReport,
            after: afterReport,
            metadata: { action, notes: notes || '' }
        });
        return { success: true };
    } catch (error) {
        console.error("Report resolution failed", error);
        throw new functions.https.HttpsError('internal', 'Resolution failed');
    }
});

/**
 * Get Support Tickets
 */
export const getSupportTickets = regionalFunctions.https.onCall(async (data, context) => {
    requireAdmin(context, 'support.view');
    const { limit = 50, startAfterId, status } = data;

    try {
        let query = db.collection('support_tickets').orderBy('createdAt', 'desc').limit(limit);

        if (status) {
            query = db.collection('support_tickets').where('status', '==', status).orderBy('createdAt', 'desc').limit(limit);
        }

        if (startAfterId) {
            const lastDoc = await db.collection('support_tickets').doc(startAfterId).get();
            if (lastDoc.exists) query = query.startAfter(lastDoc);
        }

        const snapshot = await query.get();
        const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate().toISOString()
        }));

        return { items, lastId: items.length > 0 ? items[items.length - 1]?.id : null };
    } catch (error) {
        console.error("Error fetching tickets:", error);
        throw new functions.https.HttpsError('internal', 'Unable to fetch tickets.');
    }
});

/**
 * Update Ticket Status
 */
export const updateTicketStatus = regionalFunctions.https.onCall(async (data, context) => {
    requireAdmin(context, 'support.manage');
    const { ticketId, status, reply } = data; // status: 'open' | 'resolved' | 'pending'

    try {
        const ticketRef = db.collection('support_tickets').doc(ticketId);
        const beforeSnap = await ticketRef.get();
        const before = beforeSnap.data() || null;
        await ticketRef.update({
            status,
            lastReply: reply || null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: context.auth!.uid
        });
        const afterSnap = await ticketRef.get();
        await writeAuditLog({
            context,
            action: 'update_ticket_status',
            targetCollection: 'support_tickets',
            targetId: ticketId,
            before,
            after: afterSnap.data() || null,
            metadata: { status }
        });
        return { success: true };
    } catch (error) {
        throw new functions.https.HttpsError('internal', 'Update failed');
    }
});

/**
 * Bulk Content Action (status update / soft delete)
 */
export const bulkUpdateContent = regionalFunctions.https.onCall(async (data, context) => {
    requireAdmin(context, 'content.edit');
    const { collection, ids, action, status } = data || {};

    if (!['circles', 'resources', 'affirmations'].includes(collection)) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid collection.');
    }
    if (!Array.isArray(ids) || ids.length === 0) {
        throw new functions.https.HttpsError('invalid-argument', 'No ids provided.');
    }
    if (!['set_status', 'soft_delete'].includes(action)) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid action.');
    }
    if (action === 'set_status' && !status) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing status for set_status action.');
    }

    const safeIds = ids.map((id: any) => String(id)).filter(Boolean).slice(0, 100);
    const updated: string[] = [];

    if (action === 'set_status') {
        const batch = db.batch();
        const beforeById: Record<string, any> = {};
        for (const id of safeIds) {
            const ref = db.collection(collection).doc(id);
            const snap = await ref.get();
            if (!snap.exists) continue;
            beforeById[id] = snap.data() || null;
            batch.update(ref, {
                status,
                reviewedBy: context.auth!.uid,
                reviewedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            updated.push(id);
        }
        await batch.commit();

        for (const id of updated) {
            const afterSnap = await db.collection(collection).doc(id).get();
            await writeAuditLog({
                context,
                action: 'bulk_set_status',
                targetCollection: collection,
                targetId: id,
                before: beforeById[id] || null,
                after: afterSnap.data() || null,
                metadata: { status, bulkSize: updated.length }
            });
        }
    } else {
        for (const id of safeIds) {
            await softDeleteDocument(collection, id, context, 'bulk_admin_delete');
            updated.push(id);
        }
    }

    return { success: true, updatedCount: updated.length, ids: updated };
});

/**
 * Immutable admin audit trail fetch
 */
export const getAdminAuditLogs = regionalFunctions.https.onCall(async (data, context) => {
    requireAdmin(context, 'audit.view');
    const { limit = 100, actorEmail, action, startAfterId } = data || {};

    try {
        let query: FirebaseFirestore.Query = db.collection('adminAuditLogs').orderBy('createdAt', 'desc').limit(Math.min(limit, 250));

        if (actorEmail) {
            query = db.collection('adminAuditLogs')
                .where('actorEmail', '==', String(actorEmail).toLowerCase())
                .orderBy('createdAt', 'desc')
                .limit(Math.min(limit, 250));
        } else if (action) {
            query = db.collection('adminAuditLogs')
                .where('action', '==', String(action))
                .orderBy('createdAt', 'desc')
                .limit(Math.min(limit, 250));
        }

        if (startAfterId) {
            const lastDoc = await db.collection('adminAuditLogs').doc(startAfterId).get();
            if (lastDoc.exists) query = query.startAfter(lastDoc);
        }

        const snapshot = await query.get();
        const items = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate().toISOString()
        }));
        return { items, lastId: items.length > 0 ? items[items.length - 1]?.id : null };
    } catch (error) {
        console.error('Failed to fetch audit logs', error);
        throw new functions.https.HttpsError('internal', 'Unable to fetch audit logs.');
    }
});

/**
 * Backfill userCircles index from circles.members arrays
 * Callable Function: 'backfillUserCircles'
 */
export const backfillUserCircles = regionalFunctions.https.onCall(async (data, context) => {
    requireAdmin(context, 'content.edit');
    const { limit = 100, startAfterId = null } = data || {};

    try {
        let query = db.collection('circles').orderBy('createdAt', 'desc').limit(limit);
        if (startAfterId) {
            const lastDoc = await db.collection('circles').doc(startAfterId).get();
            if (lastDoc.exists) query = query.startAfter(lastDoc);
        }

        const snap = await query.get();
        if (snap.empty) return { success: true, processed: 0, nextPage: null };

        const batch = db.batch();
        snap.docs.forEach((docSnap) => {
            const circle = docSnap.data() || {};
            const circleId = docSnap.id;
            const members = Array.isArray(circle.members) ? circle.members : [];
            members.forEach((uid: string) => {
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
    } catch (error) {
        console.error('Backfill userCircles error', error);
        throw new functions.https.HttpsError('internal', 'Backfill failed.');
    }
});
