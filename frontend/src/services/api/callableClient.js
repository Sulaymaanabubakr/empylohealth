import { auth, app, FIREBASE_ENV_INFO } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

const waitForAuthUser = async (timeoutMs = 10000) => {
  if (auth.currentUser) return auth.currentUser;
  await new Promise((resolve) => {
    let done = false;
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      unsub();
      resolve();
    }, timeoutMs);
    const unsub = onAuthStateChanged(auth, () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      unsub();
      resolve();
    });
  });
  return auth.currentUser || null;
};

const ensureToken = async (forceRefresh = false) => {
  const user = await waitForAuthUser();
  if (!user) {
    throw new Error('Authentication is not ready. Please wait and try again.');
  }
  const token = await user.getIdToken(forceRefresh).catch(() => null);
  if (!token) {
    throw new Error('Your session expired. Please sign in again.');
  }
  return { user, token };
};

const getCallableUrl = (functionName) => {
  const projectId = app?.options?.projectId;
  const region = FIREBASE_ENV_INFO?.functionsRegion || 'europe-west1';
  if (!projectId) {
    throw new Error('Firebase project configuration is missing.');
  }
  return `https://${region}-${projectId}.cloudfunctions.net/${functionName}`;
};

const asCallableError = (errorPayload, fallbackMessage) => {
  const status = String(errorPayload?.status || '').toLowerCase();
  const message = errorPayload?.message || fallbackMessage || 'Callable request failed.';
  const err = new Error(message);
  err.code = status ? `functions/${status}` : 'functions/internal';
  err.details = errorPayload?.details;
  return err;
};

const postCallable = async (functionName, payload, token) => {
  const response = await fetch(getCallableUrl(functionName), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ data: payload || {} })
  });

  const raw = await response.text();
  let json = null;
  try {
    json = raw ? JSON.parse(raw) : {};
  } catch {
    json = null;
  }

  if (!response.ok) {
    throw asCallableError(json?.error, `Callable ${functionName} failed (${response.status}).`);
  }
  if (json?.error) {
    throw asCallableError(json.error, `Callable ${functionName} returned an error.`);
  }
  return json?.result;
};

export const callableClient = {
  invokeWithAuth: async (functionName, payload) => {
    const { token } = await ensureToken(false);
    try {
      return await postCallable(functionName, payload, token);
    } catch (error) {
      const code = String(error?.code || '');
      const message = String(error?.message || '').toLowerCase();
      const isAuthError = code.includes('unauthenticated') || message.includes('unauthenticated');
      if (!isAuthError) throw error;

      // Retry once with forced token refresh.
      const refreshed = await ensureToken(true);
      return postCallable(functionName, payload, refreshed.token);
    }
  }
};

