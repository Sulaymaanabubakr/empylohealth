import { writeAuditLog } from "../_shared/audit.ts";
import { hashValue, normalizeEmail, verifyVerificationToken } from "../_shared/otp.ts";
import { getIpAddress, getUserAgent, readJson } from "../_shared/request.ts";
import { errorResponse, json } from "../_shared/response.ts";
import { supabaseAdmin } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") return errorResponse(405, "Method not allowed.");

  try {
    const body = await readJson<{ email?: string; newPassword?: string; verificationToken?: string }>(req);
    const email = normalizeEmail(String(body.email || ""));
    const newPassword = String(body.newPassword || "");
    const verificationToken = String(body.verificationToken || "");

    if (!email || !newPassword || !verificationToken) return errorResponse(400, "Missing password reset fields.");

    const payload = await verifyVerificationToken(verificationToken);
    if (payload.email !== email || payload.purpose !== "RESET_PASSWORD") {
      return errorResponse(403, "Verification token is invalid for password reset.");
    }

    const tokenHash = await hashValue(verificationToken, "otp-session");
    const { data: sessionRows } = await supabaseAdmin
      .from("otp_sessions")
      .select("*")
      .eq("token_hash", tokenHash)
      .eq("email", email)
      .eq("purpose", "RESET_PASSWORD")
      .is("consumed_at", null)
      .limit(1);

    const session = sessionRows?.[0];
    if (!session || new Date(session.expires_at).getTime() <= Date.now()) {
      return errorResponse(403, "Verification session expired.");
    }

    const { data: userRows, error: userError } = await supabaseAdmin
      .schema("auth")
      .from("users")
      .select("id, email")
      .eq("email", email)
      .limit(1);

    if (userError) throw userError;
    const userId = userRows?.[0]?.id;
    if (!userId) return errorResponse(404, "Account not found.");

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });
    if (updateError) throw updateError;

    await supabaseAdmin.from("otp_sessions").update({ consumed_at: new Date().toISOString() }).eq("id", session.id);
    await writeAuditLog({
      userId,
      action: "auth.password_reset",
      metadata: { email },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
    });

    return json({ success: true });
  } catch (error) {
    if (error instanceof Response) return error;
    return errorResponse(500, error instanceof Error ? error.message : "Unable to reset password.");
  }
});
