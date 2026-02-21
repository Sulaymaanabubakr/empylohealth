import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

// Ensure Admin SDK is ready
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();
const regionalFunctions = functions.region('europe-west1');

const ALLOWED_EMPLOYEE_ROLES = ['admin', 'editor', 'viewer', 'moderator', 'support', 'finance'];

/**
 * Create Employee Account
 * Creates a new user in Firebase Auth and sets admin claims.
 */
export const createEmployee = regionalFunctions.https.onCall(async (data, context) => {
    // 1. Auth Check: Must be logged in
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }

    // 2. Super Admin Check: claims-based only (no hardcoded email bypass).
    const isSuperAdmin = context.auth.token.superAdmin === true;

    if (!isSuperAdmin) {
        throw new functions.https.HttpsError('permission-denied', 'Only Super Admins can add employees.');
    }

    const { email, password, displayName, role } = data;
    const normalizedRole = String(role || 'editor').toLowerCase();

    // 3. Validation
    if (!email || !password || !displayName) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields.');
    }
    if (!ALLOWED_EMPLOYEE_ROLES.includes(normalizedRole)) {
        throw new functions.https.HttpsError('invalid-argument', `Invalid role. Allowed: ${ALLOWED_EMPLOYEE_ROLES.join(', ')}`);
    }

    try {
        // 4. Create Authentication User
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName,
            emailVerified: true // Auto-verify since admin created it
        });

        // 5. Set Custom Claims (Admin access)
        await admin.auth().setCustomUserClaims(userRecord.uid, {
            admin: true,
            role: normalizedRole // 'admin', 'editor', 'viewer', 'moderator', 'support', 'finance'
        });

        // 6. Create Firestore Document (for listing in dashboard)
        await db.collection('users').doc(userRecord.uid).set({
            email,
            displayName,
            photoURL: null,
            role: normalizedRole,
            isAdmin: true,
            createdBy: context.auth.uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        await db.collection('userCircles').doc(userRecord.uid).set({
            circleIds: []
        }, { merge: true });

        return { success: true, uid: userRecord.uid };

    } catch (error: any) {
        console.error("Error creating employee:", error);
        // Handle "email already exists" specifically if needed
        if (error.code === 'auth/email-already-exists') {
            throw new functions.https.HttpsError('already-exists', 'A user with this email already exists.');
        }
        throw new functions.https.HttpsError('internal', 'Failed to create employee account.');
    }
});
