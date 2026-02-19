import { auth, app, functions, FIREBASE_ENV_INFO } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';

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
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn(`[CallableClient] ${functionName} HTTP ${response.status}`, json?.error || raw);
    }
    throw asCallableError(json?.error, `Callable ${functionName} failed (${response.status}).`);
  }
  if (json?.error) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn(`[CallableClient] ${functionName} returned callable error`, json.error);
    }
    throw asCallableError(json.error, `Callable ${functionName} returned an error.`);
  }
  return json?.result;
};

const invokeViaSdk = async (functionName, payload) => {
  const callable = httpsCallable(functions, functionName);
  const response = await callable(payload || {});
  return response?.data;
};

export const callableClient = {
  invokePublic: async (functionName, payload) => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log(`[CallableClient] invoking public ${functionName}`);
    }
    return invokeViaSdk(functionName, payload);
  },

  invokeWithAuth: async (functionName, payload) => {
    const { user, token } = await ensureToken(false);
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log(`[CallableClient] invoking ${functionName}`, {
        uid: user?.uid || null,
        hasToken: Boolean(token)
      });
    }

    let firstError = null;
    try {
      return await postCallable(functionName, payload, token);
    } catch (error) {
      firstError = error;
      const code = String(error?.code || '');
      const message = String(error?.message || '').toLowerCase();
      const isAuthError =
        code.includes('unauthenticated') ||
        message.includes('unauthenticated') ||
        message.includes('401');
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn(`[CallableClient] ${functionName} failed`, { code: error?.code, message: error?.message });
      }
      if (!isAuthError) {
        // Use SDK callable as a compatibility fallback for callable protocol edge cases.
        try {
          if (typeof __DEV__ !== 'undefined' && __DEV__) {
            console.log(`[CallableClient] falling back to SDK callable for ${functionName}`);
          }
          return await invokeViaSdk(functionName, payload);
        } catch {
          throw error;
        }
      }

      // Retry once with forced token refresh.
      const refreshed = await ensureToken(true);
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.log(`[CallableClient] retrying ${functionName} with refreshed token`);
      }
      try {
        return await postCallable(functionName, payload, refreshed.token);
      } catch (secondError) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn(`[CallableClient] refreshed-token retry failed for ${functionName}`, {
            code: secondError?.code,
            message: secondError?.message
          });
          console.log(`[CallableClient] falling back to SDK callable for ${functionName}`);
        }
        try {
          return await invokeViaSdk(functionName, payload);
        } catch {
          throw secondError || firstError;
        }
      }
    }
  }
};
