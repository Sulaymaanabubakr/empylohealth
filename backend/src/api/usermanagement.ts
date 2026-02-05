import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

// Ensure Admin SDK is ready
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();

// Super Admins allowed to create employees
const SUPER_ADMINS = [
    'sulaymaanabubakr@gmail.com',
    'gcmusariri@gmail.com'
];

/**
 * Create Employee Account
 * Creates a new user in Firebase Auth and sets admin claims.
 */
export const createEmployee = functions.https.onCall(async (data, context) => {
    // 1. Auth Check: Must be logged in
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }

    // 2. Super Admin Check: Only specific emails or a super-admin claim can do this
    const requestorEmail = context.auth.token.email || '';
    const isSuperAdmin = SUPER_ADMINS.includes(requestorEmail) || context.auth.token.superAdmin === true;

    if (!isSuperAdmin) {
        throw new functions.https.HttpsError('permission-denied', 'Only Super Admins can add employees.');
    }

    const { email, password, displayName, role } = data;

    // 3. Validation
    if (!email || !password || !displayName) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields.');
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
            role: role || 'editor' // 'admin', 'editor', 'viewer'
        });

        // 6. Create Firestore Document (for listing in dashboard)
        await db.collection('users').doc(userRecord.uid).set({
            email,
            displayName,
            photoURL: null,
            role: role || 'editor',
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
