import { writeAuditLog } from "../_shared/audit.ts";
import {
  hashOtp,
  hashValue,
  isOtpExpired,
  isOtpLocked,
  normalizeEmail,
  safeEquals,
  signVerificationToken,
} from "../_shared/otp.ts";
import { getIpAddress, getUserAgent, readJson } from "../_shared/request.ts";
import { errorResponse, json } from "../_shared/response.ts";
import { supabaseAdmin } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") return errorResponse(405, "Method not allowed.");

  try {
    const body = await readJson<{ email?: string; purpose?: string; code?: string }>(req);
    const email = normalizeEmail(String(body.email || ""));
    const purpose = String(body.purpose || "").trim().toUpperCase();
    const code = String(body.code || "").trim();

    if (!email || !purpose || !/^\d{6}$/.test(code)) {
      return errorResponse(400, "Valid email, purpose, and 6-digit code are required.");
    }

    const ipAddress = getIpAddress(req);
    const userAgent = getUserAgent(req);

    const { data: rows, error } = await supabaseAdmin
      .from("otp_requests")
      .select("*")
      .eq("email", email)
      .eq("purpose", purpose)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) throw error;
    const row = rows?.[0];
    if (!row) return errorResponse(403, "OTP is invalid.");
    if (row.consumed_at) return errorResponse(403, "OTP has already been used.");
    if (isOtpExpired(row.expires_at)) return errorResponse(403, "OTP has expired.");
    if (isOtpLocked(Number(row.attempt_count || 0), Number(row.max_attempts || 5))) {
      return errorResponse(403, "OTP attempt limit reached.");
    }

    const candidateHash = await hashOtp(code, row.salt);
    if (!safeEquals(candidateHash, row.otp_hash)) {
      const nextAttempts = Number(row.attempt_count || 0) + 1;
      await supabaseAdmin.from("otp_requests").update({ attempt_count: nextAttempts }).eq("id", row.id);
      return errorResponse(403, "OTP is invalid.", {
        attemptsLeft: Math.max(0, Number(row.max_attempts || 5) - nextAttempts),
      });
    }

    await supabaseAdmin.from("otp_requests").update({ consumed_at: new Date().toISOString() }).eq("id", row.id);

    const verificationToken = await signVerificationToken({ email, purpose }, 900);
    const tokenHash = await hashValue(verificationToken, "otp-session");
    await supabaseAdmin.from("otp_sessions").insert({
      email,
      purpose,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + 900_000).toISOString(),
    });

    await writeAuditLog({
      action: "otp.verified",
      metadata: { email, purpose },
      ipAddress,
      userAgent,
    });

    return json({ verified: true, verificationToken });
  } catch (error) {
    if (error instanceof Response) return error;
    return errorResponse(500, error instanceof Error ? error.message : "Unable to verify OTP.");
  }
});
