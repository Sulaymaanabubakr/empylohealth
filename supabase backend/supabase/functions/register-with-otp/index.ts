import { writeAuditLog } from "../_shared/audit.ts";
import { hashValue, normalizeEmail, verifyVerificationToken } from "../_shared/otp.ts";
import { getIpAddress, getUserAgent, readJson } from "../_shared/request.ts";
import { errorResponse, json } from "../_shared/response.ts";
import { supabaseAdmin } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") return errorResponse(405, "Method not allowed.");

  try {
    const body = await readJson<{ email?: string; password?: string; name?: string; verificationToken?: string }>(req);
    const email = normalizeEmail(String(body.email || ""));
    const password = String(body.password || "");
    const name = String(body.name || "").trim();
    const verificationToken = String(body.verificationToken || "");
    const ipAddress = getIpAddress(req);
    const userAgent = getUserAgent(req);

    if (!email || !password || !verificationToken) return errorResponse(400, "Missing registration fields.");

    const tokenPayload = await verifyVerificationToken(verificationToken);
    if (tokenPayload.email !== email || tokenPayload.purpose !== "SIGNUP_VERIFY") {
      return errorResponse(403, "Verification token is invalid for registration.");
    }

    const tokenHash = await hashValue(verificationToken, "otp-session");
    const { data: sessionRows, error: sessionError } = await supabaseAdmin
      .from("otp_sessions")
      .select("*")
      .eq("token_hash", tokenHash)
      .eq("email", email)
      .eq("purpose", "SIGNUP_VERIFY")
      .is("consumed_at", null)
      .limit(1);

    if (sessionError) throw sessionError;
    const session = sessionRows?.[0];
    if (!session || new Date(session.expires_at).getTime() <= Date.now()) {
      return errorResponse(403, "Verification session expired.");
    }

    const { data: createdUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

    if (authError || !createdUser.user) {
      return errorResponse(400, authError?.message || "Unable to create account.");
    }

    const userId = createdUser.user.id;
    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: userId,
      email,
      name,
      role: "personal",
      onboarding_completed: false,
      photo_url: "",
    });

    if (profileError) {
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (deleteError) {
        await writeAuditLog({
          userId,
          action: "auth.register_cleanup_failed",
          metadata: { email, reason: profileError.message, cleanupError: deleteError.message },
          ipAddress,
          userAgent,
        });
      }
      return errorResponse(500, "Unable to finalize account setup.");
    }

    await supabaseAdmin.from("otp_sessions").update({ consumed_at: new Date().toISOString() }).eq("id", session.id);
    await writeAuditLog({
      userId,
      action: "auth.registered",
      metadata: { email },
      ipAddress,
      userAgent,
    });

    return json({ success: true, userId });
  } catch (error) {
    if (error instanceof Response) return error;
    return errorResponse(500, error instanceof Error ? error.message : "Unable to register with OTP.");
  }
});
