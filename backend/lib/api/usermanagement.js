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
exports.createEmployee = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
// Ensure Admin SDK is ready
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();
const regionalFunctions = functions.region('europe-west1');
// Super Admins allowed to create employees
const SUPER_ADMINS = [
    'sulaymaanabubakr@gmail.com',
    'gcmusariri@gmail.com'
];
const ALLOWED_EMPLOYEE_ROLES = ['admin', 'editor', 'viewer', 'moderator', 'support', 'finance'];
/**
 * Create Employee Account
 * Creates a new user in Firebase Auth and sets admin claims.
 */
exports.createEmployee = regionalFunctions.https.onCall(async (data, context) => {
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
    }
    catch (error) {
        console.error("Error creating employee:", error);
        // Handle "email already exists" specifically if needed
        if (error.code === 'auth/email-already-exists') {
            throw new functions.https.HttpsError('already-exists', 'A user with this email already exists.');
        }
        throw new functions.https.HttpsError('internal', 'Failed to create employee account.');
    }
});
//# sourceMappingURL=usermanagement.js.map