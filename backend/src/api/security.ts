import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { createHash, randomBytes, randomInt } from 'crypto';
import { mailTemplates, sendTemplateEmail } from '../services/brevoEmail';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();
const regionalFunctions = functions.region('europe-west1');

const OTP_TTL_MINUTES = 10;
const OTP_SESSION_TTL_MINUTES = 20;
const OTP_MAX_ATTEMPTS = 5;
const OTP_COOLDOWN_SECONDS = 60;
const OTP_WINDOW_LIMIT = 8;
const OTP_WINDOW_MINUTES = 60;
const OTP_LOCKOUT_MINUTES = 15;
const LOGIN_DEVICE_LOOKBACK_DAYS = 90;

const OTP_PURPOSES = {
  SIGNUP_VERIFY: 'SIGNUP_VERIFY',
  EMAIL_VERIFY: 'EMAIL_VERIFY',
  RESET_PASSWORD: 'RESET_PASSWORD',
  CHANGE_PASSWORD: 'CHANGE_PASSWORD',
  CHANGE_EMAIL: 'CHANGE_EMAIL',
  OTHER: 'OTHER'
} as const;

type OtpPurpose = typeof OTP_PURPOSES[keyof typeof OTP_PURPOSES];

type RequestOtpData = {
  email?: string;
  purpose?: OtpPurpose;
  metadata?: Record<string, unknown>;
};

type VerifyOtpData = {
  email?: string;
  purpose?: OtpPurpose;
  code?: string;
};

const normalizeEmail = (email: string) => String(email || '').trim().toLowerCase();
const normalizePurpose = (purpose: string): OtpPurpose => {
  const value = String(purpose || '').trim().toUpperCase();
  if (Object.values(OTP_PURPOSES).includes(value as OtpPurpose)) {
    return value as OtpPurpose;
  }
  throw new functions.https.HttpsError('invalid-argument', 'Invalid OTP purpose.');
};

const hashString = (value: string) => createHash('sha256').update(value).digest('hex');
const nowTs = () => admin.firestore.Timestamp.now();
const tsFromMillis = (ms: number) => admin.firestore.Timestamp.fromMillis(ms);
const secondsBetween = (futureMs: number, nowMs: number) => Math.max(0, Math.ceil((futureMs - nowMs) / 1000));

const getPepper = () => {
  const pepper = String(process.env.OTP_PEPPER || '').trim();
  if (!pepper) {
    throw new functions.https.HttpsError('failed-precondition', 'OTP security is not configured.');
  }
  return pepper;
};
const otpHash = (code: string, salt: string) => hashString(`${code}:${salt}:${getPepper()}`);

const maskEmail = (email: string) => {
  const [local, domain] = String(email || '').split('@');
  if (!local || !domain) return '***';
  if (local.length <= 2) return `${local[0] || '*'}***@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
};

const validatePassword = (password: string) => {
  const raw = String(password || '');
  if (raw.length < 8) {
    throw new functions.https.HttpsError('invalid-argument', 'Password must be at least 8 characters.');
  }
};

const purposeLabel = (purpose: OtpPurpose): string => {
  switch (purpose) {
    case OTP_PURPOSES.SIGNUP_VERIFY:
      return 'Sign up';
    case OTP_PURPOSES.EMAIL_VERIFY:
      return 'Email verification';
    case OTP_PURPOSES.RESET_PASSWORD:
      return 'Password reset';
    case OTP_PURPOSES.CHANGE_PASSWORD:
      return 'Password change';
    case OTP_PURPOSES.CHANGE_EMAIL:
      return 'Email change';
    default:
      return 'Verification';
  }
};

const getRequestIdentity = (context: functions.https.CallableContext, metadata: Record<string, unknown> = {}) => {
  const ipRaw = String((context.rawRequest?.headers['x-forwarded-for'] as string) || context.rawRequest?.ip || '').split(',')[0]?.trim() || 'unknown';
  const deviceId = String(metadata.deviceId || metadata.installationId || '').trim() || 'unknown';
  return {
    ipHash: hashString(ipRaw),
    deviceHash: hashString(deviceId),
    userAgent: String(context.rawRequest?.headers['user-agent'] || ''),
    platform: String(metadata.platform || ''),
    model: String(metadata.model || ''),
    appVersion: String(metadata.appVersion || '')
  };
};

const purposeNeedsAuth = (purpose: OtpPurpose) => (
  purpose === OTP_PURPOSES.CHANGE_PASSWORD ||
  purpose === OTP_PURPOSES.CHANGE_EMAIL ||
  purpose === OTP_PURPOSES.EMAIL_VERIFY
);

const buildOtpDocId = (email: string, purpose: OtpPurpose) => `${purpose}:${hashString(email)}`;

const logOtpAudit = async (payload: Record<string, unknown>) => {
  await db.collection('otpAudit').add({
    ...payload,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
};

const createOtpSession = async (params: {
  email: string;
  purpose: OtpPurpose;
  uid?: string;
  metadata?: Record<string, unknown>;
}) => {
  const token = randomBytes(24).toString('hex');
  const tokenHash = hashString(`${token}:${getPepper()}`);
  const expiresAtMs = Date.now() + (OTP_SESSION_TTL_MINUTES * 60 * 1000);

  await db.collection('otpSessions').doc(tokenHash).set({
    tokenHash,
    purpose: params.purpose,
    email: params.email,
    uid: params.uid || null,
    metadata: params.metadata || {},
    consumed: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: tsFromMillis(expiresAtMs)
  });

  return {
    token,
    expiresInSeconds: OTP_SESSION_TTL_MINUTES * 60
  };
};

const consumeOtpSession = async (params: {
  token: string;
  purpose: OtpPurpose;
  email?: string;
  uid?: string;
}) => {
  const tokenHash = hashString(`${String(params.token || '')}:${getPepper()}`);
  const docRef = db.collection('otpSessions').doc(tokenHash);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(docRef);
    if (!snap.exists) {
      throw new functions.https.HttpsError('permission-denied', 'OTP session is invalid.');
    }

    const session = snap.data() || {};
    const now = Date.now();
    const expiresAt = session.expiresAt?.toMillis?.() || 0;

    if (session.consumed) {
      throw new functions.https.HttpsError('permission-denied', 'OTP session already used.');
    }

    if (expiresAt <= now) {
      throw new functions.https.HttpsError('deadline-exceeded', 'OTP session expired.');
    }

    if (session.purpose !== params.purpose) {
      throw new functions.https.HttpsError('permission-denied', 'OTP purpose mismatch.');
    }

    if (params.email && normalizeEmail(String(session.email || '')) !== normalizeEmail(params.email)) {
      throw new functions.https.HttpsError('permission-denied', 'OTP email mismatch.');
    }

    if (params.uid && String(session.uid || '') !== params.uid) {
      throw new functions.https.HttpsError('permission-denied', 'OTP user mismatch.');
    }

    tx.update(docRef, {
      consumed: true,
      consumedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return session;
  });
};

const sendOtpEmail = async (email: string, purpose: OtpPurpose, code: string) => {
  const template = mailTemplates.otp({
    purposeLabel: purposeLabel(purpose),
    code,
    expiresInMinutes: OTP_TTL_MINUTES
  });
  await sendTemplateEmail({
    to: [{ email }],
    template,
    tags: ['otp', String(purpose).toLowerCase()]
  });
};

export const requestOtp = regionalFunctions.https.onCall(async (data: RequestOtpData, context) => {
  const purpose = normalizePurpose(String(data?.purpose || ''));
  let email = normalizeEmail(String(data?.email || ''));
  const metadata = (data?.metadata && typeof data.metadata === 'object') ? data.metadata : {};

  if (purposeNeedsAuth(purpose)) {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required for this OTP purpose.');
    }
    if (purpose === OTP_PURPOSES.CHANGE_PASSWORD || purpose === OTP_PURPOSES.EMAIL_VERIFY) {
      email = normalizeEmail(String(context.auth.token.email || email));
    }
  }

  if (purpose === OTP_PURPOSES.CHANGE_EMAIL) {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required to change email.');
    }
    const newEmail = normalizeEmail(String(metadata.newEmail || email));
    if (!newEmail) {
      throw new functions.https.HttpsError('invalid-argument', 'A valid new email is required.');
    }
    email = newEmail;
  }

  if (!email || !email.includes('@')) {
    throw new functions.https.HttpsError('invalid-argument', 'A valid email is required.');
  }

  const id = buildOtpDocId(email, purpose);
  const docRef = db.collection('otpRequests').doc(id);
  const nowMs = Date.now();
  const identity = getRequestIdentity(context, metadata);
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  const salt = randomBytes(16).toString('hex');
  const codeHash = otpHash(code, salt);
  const expiresAtMs = nowMs + (OTP_TTL_MINUTES * 60 * 1000);
  const lockoutUntilMs = nowMs + (OTP_LOCKOUT_MINUTES * 60 * 1000);

  let shouldSend = true;
  let cooldownSeconds = OTP_COOLDOWN_SECONDS;
  let requestCountInWindow = 1;

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(docRef);
    const prev = snap.data() || {};

    const lockedUntilMs = prev.lockedUntil?.toMillis?.() || 0;
    if (lockedUntilMs > nowMs) {
      throw new functions.https.HttpsError('resource-exhausted', `Too many attempts. Try again in ${secondsBetween(lockedUntilMs, nowMs)}s.`);
    }

    const lastSentMs = prev.lastSentAt?.toMillis?.() || 0;
    const cooldownEndMs = lastSentMs + (OTP_COOLDOWN_SECONDS * 1000);
    if (lastSentMs && cooldownEndMs > nowMs) {
      shouldSend = false;
      cooldownSeconds = secondsBetween(cooldownEndMs, nowMs);
      return;
    }

    const windowStartMs = prev.windowStartAt?.toMillis?.() || nowMs;
    const windowEndMs = windowStartMs + (OTP_WINDOW_MINUTES * 60 * 1000);
    requestCountInWindow = windowEndMs > nowMs
      ? Number(prev.requestCountInWindow || 0) + 1
      : 1;

    if (requestCountInWindow > OTP_WINDOW_LIMIT) {
      tx.set(docRef, {
        lockedUntil: tsFromMillis(lockoutUntilMs),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      throw new functions.https.HttpsError('resource-exhausted', `Too many OTP requests. Try again in ${OTP_LOCKOUT_MINUTES} minutes.`);
    }

    tx.set(docRef, {
      email,
      emailHash: hashString(email),
      purpose,
      codeHash,
      salt,
      attempts: 0,
      maxAttempts: OTP_MAX_ATTEMPTS,
      used: false,
      requestedByUid: context.auth?.uid || null,
      metadata,
      identity,
      windowStartAt: windowEndMs > nowMs ? tsFromMillis(windowStartMs) : tsFromMillis(nowMs),
      requestCountInWindow,
      lastSentAt: tsFromMillis(nowMs),
      expiresAt: tsFromMillis(expiresAtMs),
      lockedUntil: null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: prev.createdAt || admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  });

  if (shouldSend) {
    await sendOtpEmail(email, purpose, code);
  }

  await logOtpAudit({
    type: 'request',
    purpose,
    email: maskEmail(email),
    emailHash: hashString(email),
    uid: context.auth?.uid || null,
    shouldSend,
    cooldownSeconds,
    requestCountInWindow,
    ipHash: identity.ipHash,
    deviceHash: identity.deviceHash
  });

  if (purpose === OTP_PURPOSES.RESET_PASSWORD && shouldSend) {
    await sendTemplateEmail({
      to: [{ email }],
      template: mailTemplates.passwordResetRequested(),
      tags: ['security', 'password-reset-requested']
    });
  }

  return {
    success: true,
    cooldownSeconds
  };
});

export const verifyOtp = regionalFunctions.https.onCall(async (data: VerifyOtpData, context) => {
  const purpose = normalizePurpose(String(data?.purpose || ''));
  let email = normalizeEmail(String(data?.email || ''));
  const code = String(data?.code || '').trim();

  if (!code || !/^\d{6}$/.test(code)) {
    throw new functions.https.HttpsError('invalid-argument', 'Enter a valid 6-digit OTP code.');
  }

  if (purposeNeedsAuth(purpose)) {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required for this OTP purpose.');
    }
    if (purpose === OTP_PURPOSES.CHANGE_PASSWORD || purpose === OTP_PURPOSES.EMAIL_VERIFY) {
      email = normalizeEmail(String(context.auth.token.email || email));
    }
  }

  if (!email) {
    throw new functions.https.HttpsError('invalid-argument', 'Email is required.');
  }

  const docId = buildOtpDocId(email, purpose);
  const docRef = db.collection('otpRequests').doc(docId);
  const nowMs = Date.now();

  let verified = false;
  let attemptsLeft = OTP_MAX_ATTEMPTS;
  let failureReason = '';

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(docRef);
    if (!snap.exists) {
      failureReason = 'not_found';
      return;
    }

    const otpDoc = snap.data() || {};
    const expiresAtMs = otpDoc.expiresAt?.toMillis?.() || 0;
    const lockedUntilMs = otpDoc.lockedUntil?.toMillis?.() || 0;
    const attempts = Number(otpDoc.attempts || 0);
    const maxAttempts = Number(otpDoc.maxAttempts || OTP_MAX_ATTEMPTS);
    attemptsLeft = Math.max(0, maxAttempts - attempts);

    if (otpDoc.used) {
      failureReason = 'used';
      return;
    }

    if (lockedUntilMs > nowMs) {
      failureReason = 'locked';
      return;
    }

    if (expiresAtMs <= nowMs) {
      failureReason = 'expired';
      return;
    }

    const expectedHash = String(otpDoc.codeHash || '');
    const salt = String(otpDoc.salt || '');
    const incomingHash = otpHash(code, salt);

    if (incomingHash !== expectedHash) {
      const nextAttempts = attempts + 1;
      const exceeded = nextAttempts >= maxAttempts;
      attemptsLeft = Math.max(0, maxAttempts - nextAttempts);
      tx.update(docRef, {
        attempts: nextAttempts,
        lockedUntil: exceeded ? tsFromMillis(nowMs + (OTP_LOCKOUT_MINUTES * 60 * 1000)) : null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      failureReason = exceeded ? 'max_attempts' : 'invalid_code';
      return;
    }

    verified = true;
    tx.update(docRef, {
      used: true,
      usedAt: admin.firestore.FieldValue.serverTimestamp(),
      attempts,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });

  if (!verified) {
    await logOtpAudit({
      type: 'verify_failed',
      purpose,
      email: maskEmail(email),
      emailHash: hashString(email),
      uid: context.auth?.uid || null,
      reason: failureReason,
      attemptsLeft
    });

    return {
      verified: false,
      reason: failureReason,
      attemptsLeft
    };
  }

  const sessionPayload: {
    email: string;
    purpose: OtpPurpose;
    uid?: string;
    metadata: Record<string, unknown>;
  } = {
    email,
    purpose,
    metadata: {
      issuedToUid: context.auth?.uid || null,
      issuedAtMs: nowMs
    }
  };
  if (context.auth?.uid) {
    sessionPayload.uid = context.auth.uid;
  }

  const session = await createOtpSession(sessionPayload);

  await logOtpAudit({
    type: 'verify_success',
    purpose,
    email: maskEmail(email),
    emailHash: hashString(email),
    uid: context.auth?.uid || null
  });

  return {
    verified: true,
    verificationToken: session.token,
    expiresInSeconds: session.expiresInSeconds
  };
});

export const registerWithOtp = regionalFunctions.https.onCall(async (data, context) => {
  const email = normalizeEmail(String(data?.email || ''));
  const password = String(data?.password || '');
  const name = String(data?.name || '').trim() || 'New User';
  const verificationToken = String(data?.verificationToken || '').trim();

  if (context.auth?.uid) {
    throw new functions.https.HttpsError('failed-precondition', 'Already authenticated.');
  }
  if (!email || !verificationToken) {
    throw new functions.https.HttpsError('invalid-argument', 'Email and verification token are required.');
  }
  validatePassword(password);

  await consumeOtpSession({ token: verificationToken, purpose: OTP_PURPOSES.SIGNUP_VERIFY, email });

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
      emailVerified: true
    });

    return {
      success: true,
      uid: userRecord.uid
    };
  } catch (error: any) {
    if (error?.code === 'auth/email-already-exists') {
      throw new functions.https.HttpsError('already-exists', 'An account with this email already exists.');
    }
    console.error('registerWithOtp failed', error);
    throw new functions.https.HttpsError('internal', 'Unable to create account.');
  }
});

export const resetPasswordWithOtp = regionalFunctions.https.onCall(async (data, context) => {
  if (context.auth?.uid) {
    throw new functions.https.HttpsError('failed-precondition', 'Sign out to use this flow.');
  }

  const email = normalizeEmail(String(data?.email || ''));
  const newPassword = String(data?.newPassword || '');
  const verificationToken = String(data?.verificationToken || '').trim();

  if (!email || !verificationToken) {
    throw new functions.https.HttpsError('invalid-argument', 'Email and verification token are required.');
  }

  validatePassword(newPassword);
  await consumeOtpSession({ token: verificationToken, purpose: OTP_PURPOSES.RESET_PASSWORD, email });

  const user = await admin.auth().getUserByEmail(email).catch(() => null);
  if (!user) {
    throw new functions.https.HttpsError('not-found', 'Account not found.');
  }

  await admin.auth().updateUser(user.uid, { password: newPassword });

  await sendTemplateEmail({
    to: [{ email }],
    template: mailTemplates.passwordChanged(),
    tags: ['security', 'password-changed']
  });

  return { success: true };
});

export const changePasswordWithOtp = regionalFunctions.https.onCall(async (data, context) => {
  if (!context.auth?.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }

  const uid = context.auth.uid;
  const email = normalizeEmail(String(context.auth.token.email || ''));
  const newPassword = String(data?.newPassword || '');
  const verificationToken = String(data?.verificationToken || '').trim();

  if (!verificationToken) {
    throw new functions.https.HttpsError('invalid-argument', 'Verification token is required.');
  }

  validatePassword(newPassword);
  await consumeOtpSession({ token: verificationToken, purpose: OTP_PURPOSES.CHANGE_PASSWORD, email, uid });

  await admin.auth().updateUser(uid, { password: newPassword });
  await sendTemplateEmail({
    to: [{ email }],
    template: mailTemplates.passwordChanged(),
    tags: ['security', 'password-changed']
  });

  return { success: true };
});

export const completeEmailVerificationWithOtp = regionalFunctions.https.onCall(async (data, context) => {
  if (!context.auth?.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }

  const uid = context.auth.uid;
  const email = normalizeEmail(String(context.auth.token.email || ''));
  const verificationToken = String(data?.verificationToken || '').trim();
  if (!verificationToken) {
    throw new functions.https.HttpsError('invalid-argument', 'Verification token is required.');
  }

  await consumeOtpSession({ token: verificationToken, purpose: OTP_PURPOSES.EMAIL_VERIFY, email, uid });

  await admin.auth().updateUser(uid, { emailVerified: true });
  await db.collection('users').doc(uid).set({ emailVerified: true, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });

  return { success: true };
});

export const changeEmailWithOtp = regionalFunctions.https.onCall(async (data, context) => {
  if (!context.auth?.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }

  const uid = context.auth.uid;
  const currentEmail = normalizeEmail(String(context.auth.token.email || ''));
  const newEmail = normalizeEmail(String(data?.newEmail || ''));
  const verificationToken = String(data?.verificationToken || '').trim();

  if (!newEmail || !newEmail.includes('@')) {
    throw new functions.https.HttpsError('invalid-argument', 'A valid new email is required.');
  }
  if (!verificationToken) {
    throw new functions.https.HttpsError('invalid-argument', 'Verification token is required.');
  }
  if (currentEmail === newEmail) {
    throw new functions.https.HttpsError('invalid-argument', 'New email must be different from current email.');
  }

  const session = await consumeOtpSession({ token: verificationToken, purpose: OTP_PURPOSES.CHANGE_EMAIL, email: newEmail, uid });
  const sessionCurrentEmail = normalizeEmail(String(session?.metadata?.currentEmail || ''));
  if (sessionCurrentEmail && sessionCurrentEmail !== currentEmail) {
    throw new functions.https.HttpsError('permission-denied', 'Current email mismatch.');
  }

  await admin.auth().updateUser(uid, {
    email: newEmail,
    emailVerified: true
  });

  await db.collection('users').doc(uid).set({
    email: newEmail,
    emailVerified: true,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  return { success: true, email: newEmail };
});

export const recordLoginDevice = regionalFunctions.https.onCall(async (data, context) => {
  if (!context.auth?.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }

  const uid = context.auth.uid;
  const email = normalizeEmail(String(context.auth.token.email || ''));
  const metadata = (data && typeof data === 'object') ? data : {};
  const identity = getRequestIdentity(context, metadata as Record<string, unknown>);

  const deviceLabel = [
    String((metadata as Record<string, unknown>).platform || ''),
    String((metadata as Record<string, unknown>).model || ''),
    String((metadata as Record<string, unknown>).osVersion || '')
  ].filter(Boolean).join(' • ') || 'Unknown device';

  const providedDeviceId = String((metadata as Record<string, unknown>).deviceId || '').trim() || `${identity.deviceHash}:${identity.ipHash}`;
  const deviceDocId = hashString(`${uid}:${providedDeviceId}`);
  const deviceRef = db.collection('users').doc(uid).collection('devices').doc(deviceDocId);
  const snap = await deviceRef.get();
  const isNewDevice = !snap.exists;

  await deviceRef.set({
    uid,
    email,
    deviceIdHash: hashString(providedDeviceId),
    ipHash: identity.ipHash,
    userAgent: identity.userAgent,
    platform: String((metadata as Record<string, unknown>).platform || ''),
    model: String((metadata as Record<string, unknown>).model || ''),
    osVersion: String((metadata as Record<string, unknown>).osVersion || ''),
    appVersion: String((metadata as Record<string, unknown>).appVersion || ''),
    locale: String((metadata as Record<string, unknown>).locale || ''),
    pushTokenHash: hashString(String((metadata as Record<string, unknown>).pushToken || '')),
    firstSeenAt: snap.exists ? (snap.data()?.firstSeenAt || admin.firestore.FieldValue.serverTimestamp()) : admin.firestore.FieldValue.serverTimestamp(),
    lastSeenAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  // Cleanup stale device entries
  const cutoffMs = Date.now() - (LOGIN_DEVICE_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  const staleSnap = await db.collection('users').doc(uid).collection('devices')
    .where('lastSeenAt', '<', tsFromMillis(cutoffMs))
    .limit(50)
    .get();
  if (!staleSnap.empty) {
    const batch = db.batch();
    staleSnap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }

  if (isNewDevice && email) {
    await sendTemplateEmail({
      to: [{ email }],
      template: mailTemplates.newLogin({
        deviceLabel,
        signedInAtIso: new Date().toISOString(),
        locationText: 'Approximate location unavailable',
        secureUrl: `${process.env.APP_WEB_URL || 'https://www.empylo.com'}/security`
      }),
      tags: ['security', 'new-login']
    });
  }

  return {
    success: true,
    isNewDevice
  };
});

export const sendAccountDeletedEmail = async (params: { email: string }) => {
  const email = normalizeEmail(params.email);
  if (!email) return;
  await sendTemplateEmail({
    to: [{ email }],
    template: mailTemplates.accountDeleted(),
    tags: ['account', 'deleted']
  });
};

export const sendCircleDeletedEmails = async (params: { circleName: string; memberEmails: string[] }) => {
  const uniqueEmails = Array.from(new Set((params.memberEmails || []).map((e) => normalizeEmail(e)).filter(Boolean)));
  if (!uniqueEmails.length) return;

  const template = mailTemplates.circleDeleted({ circleName: params.circleName || 'Circle' });
  const chunkSize = 60;
  for (let i = 0; i < uniqueEmails.length; i += chunkSize) {
    const chunk = uniqueEmails.slice(i, i + chunkSize).map((email) => ({ email }));
    await sendTemplateEmail({
      to: chunk,
      template,
      tags: ['circle', 'deleted']
    });
  }
};
