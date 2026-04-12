const encoder = new TextEncoder();

const OTP_TTL_SECONDS = Math.max(
  300,
  Math.min(600, Number(Deno.env.get("OTP_TTL_SECONDS") || "600")),
);
const OTP_HOURLY_CAP = Math.max(1, Number(Deno.env.get("OTP_HOURLY_CAP") || "5"));
const OTP_HMAC_SECRET = Deno.env.get("OTP_HMAC_SECRET") || "";
const OTP_SESSION_SECRET = Deno.env.get("OTP_SESSION_SECRET") || "";

const toBase64Url = (value: ArrayBuffer | Uint8Array | string) => {
  const bytes = typeof value === "string" ? encoder.encode(value) : new Uint8Array(value);
  let str = "";
  for (const byte of bytes) str += String.fromCharCode(byte);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const fromBase64Url = (value: string) => {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  const raw = atob(padded);
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
};

const signHmac = async (secret: string, message: string) => {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toBase64Url(await crypto.subtle.sign("HMAC", key, encoder.encode(message)));
};

export const otpConfig = {
  ttlSeconds: OTP_TTL_SECONDS,
  hourlyCap: OTP_HOURLY_CAP,
  maxAttempts: 5,
};

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const generateOtpCode = () => String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");

export const createSalt = () => crypto.randomUUID().replace(/-/g, "");

export const hashOtp = async (code: string, salt: string) => {
  if (!OTP_HMAC_SECRET) throw new Error("OTP_HMAC_SECRET is not configured.");
  return await signHmac(OTP_HMAC_SECRET, `${salt}:${code}`);
};

export const hashValue = async (value: string, salt = "shared") => {
  if (!OTP_HMAC_SECRET) throw new Error("OTP_HMAC_SECRET is not configured.");
  return await signHmac(OTP_HMAC_SECRET, `${salt}:${value}`);
};

export const safeEquals = (left: string, right: string) => {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return result === 0;
};

export const isOtpExpired = (expiresAt: string | Date) => new Date(expiresAt).getTime() <= Date.now();

export const isOtpLocked = (attemptCount: number, maxAttempts: number) => attemptCount >= maxAttempts;

export const signVerificationToken = async (
  payload: Record<string, unknown>,
  expiresInSeconds = 900,
) => {
  if (!OTP_SESSION_SECRET) throw new Error("OTP_SESSION_SECRET is not configured.");
  const body = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  };
  const json = JSON.stringify(body);
  const signature = await signHmac(OTP_SESSION_SECRET, json);
  return `${toBase64Url(json)}.${signature}`;
};

export const verifyVerificationToken = async (token: string) => {
  if (!OTP_SESSION_SECRET) throw new Error("OTP_SESSION_SECRET is not configured.");
  const [payloadPart, signature] = String(token || "").split(".");
  if (!payloadPart || !signature) {
    throw new Error("Verification token is invalid.");
  }
  const payloadJson = new TextDecoder().decode(fromBase64Url(payloadPart));
  const expectedSignature = await signHmac(OTP_SESSION_SECRET, payloadJson);
  if (!safeEquals(signature, expectedSignature)) {
    throw new Error("Verification token signature mismatch.");
  }
  const payload = JSON.parse(payloadJson);
  if (!payload?.exp || Number(payload.exp) <= Math.floor(Date.now() / 1000)) {
    throw new Error("Verification token expired.");
  }
  return payload;
};
