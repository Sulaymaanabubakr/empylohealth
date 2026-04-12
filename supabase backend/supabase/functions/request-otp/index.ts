import { writeAuditLog } from "../_shared/audit.ts";
import { sendOtpEmail } from "../_shared/brevo.ts";
import { createSalt, generateOtpCode, hashOtp, normalizeEmail, otpConfig } from "../_shared/otp.ts";
import { getIpAddress, getUserAgent, readJson } from "../_shared/request.ts";
import { errorResponse, json } from "../_shared/response.ts";
import { supabaseAdmin } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") return errorResponse(405, "Method not allowed.");

  try {
    const body = await readJson<{ email?: string; purpose?: string; metadata?: Record<string, unknown> }>(req);
    const email = normalizeEmail(String(body.email || ""));
    const purpose = String(body.purpose || "").trim().toUpperCase();

    if (!email || !email.includes("@")) return errorResponse(400, "A valid email is required.");
    if (!purpose) return errorResponse(400, "OTP purpose is required.");

    const ipAddress = getIpAddress(req);
    const userAgent = getUserAgent(req);

    const cooldownThreshold = new Date(Date.now() - 30_000).toISOString();
    const hourThreshold = new Date(Date.now() - 3_600_000).toISOString();

    const { data: recentRows, error: recentError } = await supabaseAdmin
      .from("otp_requests")
      .select("id, created_at")
      .eq("email", email)
      .gte("created_at", cooldownThreshold)
      .order("created_at", { ascending: false })
      .limit(1);

    if (recentError) throw recentError;
    if ((recentRows || []).length > 0) {
      return errorResponse(429, "Please wait before requesting another code.", { cooldownSeconds: 30 });
    }

    const { count, error: countError } = await supabaseAdmin
      .from("otp_requests")
      .select("id", { count: "exact", head: true })
      .eq("email", email)
      .gte("created_at", hourThreshold);

    if (countError) throw countError;
    if ((count || 0) >= otpConfig.hourlyCap) {
      return errorResponse(429, "Too many codes requested. Try again later.", { hourlyCap: otpConfig.hourlyCap });
    }

    const code = generateOtpCode();
    const salt = createSalt();
    const otpHash = await hashOtp(code, salt);
    const expiresAt = new Date(Date.now() + otpConfig.ttlSeconds * 1000).toISOString();

    const { error: insertError } = await supabaseAdmin.from("otp_requests").insert({
      email,
      purpose,
      otp_hash: otpHash,
      salt,
      expires_at: expiresAt,
      attempt_count: 0,
      max_attempts: otpConfig.maxAttempts,
      requested_ip: ipAddress,
      user_agent: userAgent,
      metadata: body.metadata || {},
    });

    if (insertError) throw insertError;

    await sendOtpEmail(email, purpose, code);
    await writeAuditLog({
      action: "otp.requested",
      metadata: { email, purpose },
      ipAddress,
      userAgent,
    });

    return json({ success: true, cooldownSeconds: 30 });
  } catch (error) {
    if (error instanceof Response) return error;
    return errorResponse(500, error instanceof Error ? error.message : "Unable to request OTP.");
  }
});
