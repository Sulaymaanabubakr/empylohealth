import { SignJWT, importPKCS8 } from "npm:jose@5.9.6";

const APPLE_SERVER_API_PRODUCTION_BASE = "https://api.storekit.itunes.apple.com";
const APPLE_SERVER_API_SANDBOX_BASE = "https://api.storekit-sandbox.itunes.apple.com";
const APPLE_SERVER_API_AUDIENCE = "appstoreconnect-v1";
const ANDROID_PACKAGE_NAME = String(Deno.env.get("ANDROID_PACKAGE_NAME") || "com.empylo.circlesapp").trim();
const IOS_BUNDLE_ID = String(Deno.env.get("IOS_BUNDLE_ID") || "com.empylo.circlesapp").trim();

const getEnvMultiline = (plainKey: string, base64Key: string) => {
  const inline = String(Deno.env.get(plainKey) || "").trim();
  if (inline) return inline.replace(/\\n/g, "\n");
  const encoded = String(Deno.env.get(base64Key) || "").trim();
  if (!encoded) return "";
  try {
    return new TextDecoder().decode(Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0))).trim();
  } catch {
    return "";
  }
};

const decodeJwtSegment = (segment: string) => {
  const normalized = String(segment || "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return JSON.parse(atob(padded));
};

const getJwtPayload = (token: string) => {
  const parts = String(token || "").split(".");
  if (parts.length < 2) throw new Error("Invalid signed transaction format.");
  return decodeJwtSegment(parts[1] || "");
};

const getAppleServerApiCredentials = () => ({
  issuerId: String(Deno.env.get("APPLE_IN_APP_PURCHASE_ISSUER_ID") || "").trim(),
  keyId: String(Deno.env.get("APPLE_IN_APP_PURCHASE_KEY_ID") || "").trim(),
  privateKey: getEnvMultiline("APPLE_IN_APP_PURCHASE_KEY_P8", "APPLE_IN_APP_PURCHASE_KEY_P8_BASE64"),
});

const createAppleServerApiToken = async () => {
  const credentials = getAppleServerApiCredentials();
  if (!credentials.issuerId || !credentials.keyId || !credentials.privateKey || !IOS_BUNDLE_ID) {
    throw new Error(
      "Apple App Store Server API credentials are not configured. Set APPLE_IN_APP_PURCHASE_ISSUER_ID, APPLE_IN_APP_PURCHASE_KEY_ID, APPLE_IN_APP_PURCHASE_KEY_P8_BASE64, and IOS_BUNDLE_ID."
    );
  }

  const algorithm = await importPKCS8(credentials.privateKey, "ES256");
  return new SignJWT({ bid: IOS_BUNDLE_ID })
    .setProtectedHeader({ alg: "ES256", kid: credentials.keyId, typ: "JWT" })
    .setIssuer(credentials.issuerId)
    .setAudience(APPLE_SERVER_API_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(algorithm);
};

const fetchAppleJson = async (path: string, sandbox = false) => {
  const token = await createAppleServerApiToken();
  const baseUrl = sandbox ? APPLE_SERVER_API_SANDBOX_BASE : APPLE_SERVER_API_PRODUCTION_BASE;
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const error = new Error(`Apple verification failed (${response.status}).`);
    (error as Error & { status?: number; payload?: unknown }).status = response.status;
    (error as Error & { status?: number; payload?: unknown }).payload = payload;
    throw error;
  }
  return payload;
};

const fetchAppleJsonWithFallback = async (path: string) => {
  try {
    return await fetchAppleJson(path, false);
  } catch (error) {
    const status = Number((error as { status?: number })?.status || 0);
    if (status === 400 || status === 404) {
      return fetchAppleJson(path, true);
    }
    throw error;
  }
};

const normalizeAppleEntitlement = (transaction: Record<string, unknown>, renewalInfo: Record<string, unknown> = {}) => {
  const expiresAtMs = Number(transaction?.expiresDate || transaction?.expiresDateMs || 0);
  const startsAtMs = Number(transaction?.purchaseDate || transaction?.purchaseDateMs || 0);
  const autoRenewStatus = String(renewalInfo?.autoRenewStatus ?? renewalInfo?.autoRenewPreference ?? "1");
  return {
    planId: String(transaction?.productId || "").includes("premium") ? "premium" : "pro",
    status: expiresAtMs > Date.now() ? "active" : "expired",
    productId: String(transaction?.productId || ""),
    platform: "ios",
    billingCadence: String(transaction?.productId || "").includes("annual") ? "annual" : "monthly",
    originalTransactionId: String(transaction?.originalTransactionId || transaction?.transactionId || ""),
    transactionId: String(transaction?.transactionId || ""),
    purchaseToken: String(transaction?.transactionId || transaction?.originalTransactionId || ""),
    startsAt: startsAtMs > 0 ? new Date(startsAtMs).toISOString() : null,
    expiresAt: expiresAtMs > 0 ? new Date(expiresAtMs).toISOString() : null,
    renewalState: autoRenewStatus === "0" ? "auto_renew_off" : "auto_renew_on",
    raw: { transaction, renewalInfo },
  };
};

const selectLatestAppleSubscription = (payload: Record<string, unknown>, productId: string) => {
  const groups = Array.isArray(payload?.data) ? payload.data : [];
  const candidates = groups
    .flatMap((group) => Array.isArray(group?.lastTransactions) ? group.lastTransactions : [])
    .map((entry) => ({
      transaction: entry?.signedTransactionInfo ? getJwtPayload(String(entry.signedTransactionInfo)) : null,
      renewalInfo: entry?.signedRenewalInfo ? getJwtPayload(String(entry.signedRenewalInfo)) : null,
    }))
    .filter((entry) => entry.transaction)
    .filter((entry) => !productId || String(entry.transaction?.productId || "") === productId)
    .sort((a, b) => Number(b.transaction?.expiresDate || b.transaction?.expiresDateMs || 0) - Number(a.transaction?.expiresDate || a.transaction?.expiresDateMs || 0));
  return candidates[0] || null;
};

export const verifyAppleSubscriptionTransaction = async ({
  productId,
  transactionId,
  originalTransactionId,
  signedTransactionInfo,
}: {
  productId: string;
  transactionId?: string;
  originalTransactionId?: string;
  signedTransactionInfo?: string;
}) => {
  const normalizedProductId = String(productId || "").trim();
  let normalizedOriginalTransactionId = String(originalTransactionId || "").trim();
  const normalizedTransactionId = String(transactionId || "").trim();
  const normalizedSignedTransactionInfo = String(signedTransactionInfo || "").trim();

  if (!normalizedOriginalTransactionId && normalizedSignedTransactionInfo) {
    const payload = getJwtPayload(normalizedSignedTransactionInfo);
    normalizedOriginalTransactionId = String(payload?.originalTransactionId || payload?.transactionId || "").trim();
  }

  if (!normalizedOriginalTransactionId && normalizedTransactionId) {
    const transactionLookup = await fetchAppleJsonWithFallback(`/inApps/v1/transactions/${encodeURIComponent(normalizedTransactionId)}`);
    const transaction = transactionLookup?.signedTransactionInfo ? getJwtPayload(String(transactionLookup.signedTransactionInfo)) : {};
    normalizedOriginalTransactionId = String(transaction?.originalTransactionId || transaction?.transactionId || "").trim();
  }

  if (!normalizedOriginalTransactionId && !normalizedTransactionId && !normalizedSignedTransactionInfo) {
    throw new Error("Apple validation requires transactionId, originalTransactionId, or signedTransactionInfo.");
  }

  if (normalizedOriginalTransactionId) {
    const payload = await fetchAppleJsonWithFallback(`/inApps/v1/subscriptions/${encodeURIComponent(normalizedOriginalTransactionId)}`);
    const latest = selectLatestAppleSubscription(payload, normalizedProductId);
    if (latest?.transaction) {
      return normalizeAppleEntitlement(latest.transaction, latest.renewalInfo || {});
    }
  }

  if (normalizedTransactionId) {
    const payload = await fetchAppleJsonWithFallback(`/inApps/v1/transactions/${encodeURIComponent(normalizedTransactionId)}`);
    if (!payload?.signedTransactionInfo) {
      throw new Error("Apple transaction lookup did not return signed transaction info.");
    }
    const transaction = getJwtPayload(String(payload.signedTransactionInfo));
    if (normalizedProductId && String(transaction?.productId || "") !== normalizedProductId) {
      throw new Error("Apple transaction does not match the requested product.");
    }
    return normalizeAppleEntitlement(transaction);
  }

  const transaction = getJwtPayload(normalizedSignedTransactionInfo);
  if (normalizedProductId && String(transaction?.productId || "") !== normalizedProductId) {
    throw new Error("Apple signed transaction does not match the requested product.");
  }
  return normalizeAppleEntitlement(transaction);
};

const getGoogleServiceAccount = () => {
  const rawJson = String(Deno.env.get("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON") || "").trim();
  if (rawJson) return JSON.parse(rawJson);
  const encoded = String(Deno.env.get("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_BASE64") || "").trim();
  if (encoded) return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0))));

  const clientEmail = String(Deno.env.get("GOOGLE_PLAY_CLIENT_EMAIL") || "").trim();
  const privateKey = getEnvMultiline("GOOGLE_PLAY_PRIVATE_KEY", "GOOGLE_PLAY_PRIVATE_KEY_BASE64");
  if (clientEmail && privateKey) {
    return {
      client_email: clientEmail,
      private_key: privateKey,
      token_uri: "https://oauth2.googleapis.com/token",
    };
  }
  throw new Error(
    "Google Play credentials are not configured. Set GOOGLE_PLAY_SERVICE_ACCOUNT_JSON or GOOGLE_PLAY_CLIENT_EMAIL and GOOGLE_PLAY_PRIVATE_KEY."
  );
};

const getGoogleAccessToken = async () => {
  const serviceAccount = getGoogleServiceAccount();
  const privateKey = await importPKCS8(String(serviceAccount.private_key || "").replace(/\\n/g, "\n"), "RS256");
  const assertion = await new SignJWT({ scope: "https://www.googleapis.com/auth/androidpublisher" })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(String(serviceAccount.client_email || ""))
    .setSubject(String(serviceAccount.client_email || ""))
    .setAudience(String(serviceAccount.token_uri || "https://oauth2.googleapis.com/token"))
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(privateKey);

  const response = await fetch(String(serviceAccount.token_uri || "https://oauth2.googleapis.com/token"), {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.access_token) {
    throw new Error(`Unable to authenticate with Google Play: ${payload?.error_description || payload?.error || response.status}`);
  }
  return String(payload.access_token);
};

export const verifyGoogleSubscriptionPurchase = async ({
  purchaseToken,
  productId,
}: {
  purchaseToken: string;
  productId: string;
}) => {
  const token = await getGoogleAccessToken();
  const response = await fetch(
    `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(ANDROID_PACKAGE_NAME)}/purchases/subscriptions/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Google purchase validation failed (${response.status}): ${payload?.error?.message || response.statusText}`);
  }

  const expiryTimeMillis = Number(payload?.expiryTimeMillis || 0);
  const startTimeMillis = Number(payload?.startTimeMillis || 0);
  const normalizedProductId = String(productId || "").trim();
  return {
    planId: normalizedProductId.includes("premium") ? "premium" : "pro",
    status: expiryTimeMillis > Date.now() ? "active" : "expired",
    productId: normalizedProductId,
    platform: "android",
    billingCadence: normalizedProductId.includes("annual") ? "annual" : "monthly",
    originalTransactionId: String(payload?.orderId || purchaseToken),
    transactionId: String(payload?.orderId || purchaseToken),
    purchaseToken,
    startsAt: startTimeMillis > 0 ? new Date(startTimeMillis).toISOString() : null,
    expiresAt: expiryTimeMillis > 0 ? new Date(expiryTimeMillis).toISOString() : null,
    renewalState: payload?.autoRenewing === false ? "auto_renew_off" : "auto_renew_on",
    raw: payload,
  };
};

export const verifyAppleProductPurchase = async ({
  productId,
  transactionId,
  signedTransactionInfo,
}: {
  productId: string;
  transactionId?: string;
  signedTransactionInfo?: string;
}) => {
  const normalizedProductId = String(productId || "").trim();
  const normalizedTransactionId = String(transactionId || "").trim();
  const normalizedSignedTransactionInfo = String(signedTransactionInfo || "").trim();

  let transaction: Record<string, unknown> | null = null;

  if (normalizedTransactionId) {
    const payload = await fetchAppleJsonWithFallback(`/inApps/v1/transactions/${encodeURIComponent(normalizedTransactionId)}`);
    if (!payload?.signedTransactionInfo) {
      throw new Error("Apple transaction lookup did not return signed transaction info.");
    }
    transaction = getJwtPayload(String(payload.signedTransactionInfo));
  } else if (normalizedSignedTransactionInfo) {
    transaction = getJwtPayload(normalizedSignedTransactionInfo);
  } else {
    throw new Error("Apple boost validation requires transactionId or signedTransactionInfo.");
  }

  if (normalizedProductId && String(transaction?.productId || "") !== normalizedProductId) {
    throw new Error("Apple transaction does not match the requested product.");
  }

  const purchaseDateMs = Number(transaction?.purchaseDate || transaction?.purchaseDateMs || 0);
  return {
    productId: String(transaction?.productId || normalizedProductId),
    platform: "ios",
    transactionId: String(transaction?.transactionId || normalizedTransactionId),
    originalTransactionId: String(transaction?.originalTransactionId || transaction?.transactionId || normalizedTransactionId),
    purchaseToken: String(transaction?.transactionId || normalizedTransactionId),
    startsAt: purchaseDateMs > 0 ? new Date(purchaseDateMs).toISOString() : null,
    raw: transaction,
  };
};

export const verifyGoogleProductPurchase = async ({
  purchaseToken,
  productId,
}: {
  purchaseToken: string;
  productId: string;
}) => {
  const token = await getGoogleAccessToken();
  const response = await fetch(
    `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(ANDROID_PACKAGE_NAME)}/purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Google boost validation failed (${response.status}): ${payload?.error?.message || response.statusText}`);
  }
  if (Number(payload?.purchaseState ?? 0) !== 0) {
    throw new Error("Google product purchase is not in a purchased state.");
  }

  const purchaseTimeMillis = Number(payload?.purchaseTimeMillis || 0);
  return {
    productId: String(productId || "").trim(),
    platform: "android",
    transactionId: String(payload?.orderId || purchaseToken),
    originalTransactionId: String(payload?.orderId || purchaseToken),
    purchaseToken,
    startsAt: purchaseTimeMillis > 0 ? new Date(purchaseTimeMillis).toISOString() : null,
    raw: payload,
  };
};
