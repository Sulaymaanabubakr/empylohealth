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
const admin = __importStar(require("firebase-admin"));
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();
const DEFAULTS = {
    email: 'reviewer@empylo.com',
    password: 'Review@12345',
    name: 'App Reviewer'
};
const parseArgs = () => {
    const args = process.argv.slice(2);
    const getArg = (flag, fallback) => {
        const idx = args.indexOf(flag);
        if (idx >= 0 && args[idx + 1])
            return String(args[idx + 1]).trim();
        return fallback;
    };
    return {
        email: getArg('--email', DEFAULTS.email).toLowerCase(),
        password: getArg('--password', DEFAULTS.password),
        name: getArg('--name', DEFAULTS.name)
    };
};
const buildDefaultSettings = () => ({
    notifications: true,
    biometrics: false,
    securityNotifications: true,
    msgShow: true,
    msgSound: true,
    groupShow: true,
    groupSound: true,
    showPreview: true,
    dailyReminders: true,
    weeklyReviewEmail: false,
    communityInvites: true,
    enhancedPrivacyMode: false
});
const upsertReviewerAccount = async (email, password, name) => {
    let userRecord = null;
    try {
        userRecord = await admin.auth().getUserByEmail(email);
        userRecord = await admin.auth().updateUser(userRecord.uid, {
            email,
            password,
            displayName: name,
            emailVerified: true,
            disabled: false
        });
        console.log(`[reviewer-seed] Updated existing auth user: ${email}`);
    }
    catch (error) {
        const code = String(error?.code || '');
        if (!code.includes('user-not-found'))
            throw error;
        userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: name,
            emailVerified: true,
            disabled: false
        });
        console.log(`[reviewer-seed] Created auth user: ${email}`);
    }
    const uid = userRecord.uid;
    await admin.auth().setCustomUserClaims(uid, {
        reviewer: true,
        role: 'personal'
    });
    const now = admin.firestore.FieldValue.serverTimestamp();
    await db.collection('users').doc(uid).set({
        uid,
        email,
        name,
        role: 'personal',
        photoURL: userRecord.photoURL || '',
        emailVerified: true,
        onboardingCompleted: true,
        dob: '1990-01-01',
        gender: 'Prefer not to say',
        location: 'United Kingdom',
        timezone: 'Europe/London',
        wellbeingScore: 78,
        wellbeingLabel: 'Doing Well',
        streak: 7,
        settings: buildDefaultSettings(),
        createdAt: now,
        updatedAt: now
    }, { merge: true });
    await db.collection('userCircles').doc(uid).set({
        circleIds: [],
        updatedAt: now
    }, { merge: true });
    return { uid, email };
};
const main = async () => {
    const { email, password, name } = parseArgs();
    if (!email || !email.includes('@'))
        throw new Error('Invalid reviewer email.');
    if (!password || password.length < 8)
        throw new Error('Reviewer password must be at least 8 characters.');
    if (!name)
        throw new Error('Reviewer display name is required.');
    const result = await upsertReviewerAccount(email, password, name);
    console.log('[reviewer-seed] Completed.');
    console.log(`[reviewer-seed] uid=${result.uid}`);
    console.log(`[reviewer-seed] email=${email}`);
};
main()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error('[reviewer-seed] Failed:', error);
    process.exit(1);
});
//# sourceMappingURL=seed-reviewer-account.js.map