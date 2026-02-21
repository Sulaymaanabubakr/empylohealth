import * as admin from 'firebase-admin';

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
  const getArg = (flag: string, fallback: string) => {
    const idx = args.indexOf(flag);
    if (idx >= 0 && args[idx + 1]) return String(args[idx + 1]).trim();
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

const upsertReviewerAccount = async (email: string, password: string, name: string) => {
  let userRecord: admin.auth.UserRecord | null = null;
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
  } catch (error: any) {
    const code = String(error?.code || '');
    if (!code.includes('user-not-found')) throw error;
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
  if (!email || !email.includes('@')) throw new Error('Invalid reviewer email.');
  if (!password || password.length < 8) throw new Error('Reviewer password must be at least 8 characters.');
  if (!name) throw new Error('Reviewer display name is required.');

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
