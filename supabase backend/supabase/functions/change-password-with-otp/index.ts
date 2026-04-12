import { requireUser } from "../_shared/auth.ts";
import { writeAuditLog } from "../_shared/audit.ts";
import { hashValue, verifyVerificationToken } from "../_shared/otp.ts";
import { getIpAddress, getUserAgent, readJson } from "../_shared/request.ts";
import { errorResponse, json } from "../_shared/response.ts";
import { supabaseAdmin } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") return errorResponse(405, "Method not allowed.");

  try {
    const { user } = await requireUser(req);
    const body = await readJson<{ newPassword?: string; verificationToken?: string }>(req);
    const verificationToken = String(body.verificationToken || "");
    const newPassword = String(body.newPassword || "");
    if (!verificationToken || !newPassword) return errorResponse(400, "Missing password change fields.");

    const payload = await verifyVerificationToken(verificationToken);
    if (payload.email !== user.email || payload.purpose !== "CHANGE_PASSWORD") {
      return errorResponse(403, "Verification token is invalid for password change.");
    }

    const tokenHash = await hashValue(verificationToken, "otp-session");
    const { data: sessionRows } = await supabaseAdmin
      .from("otp_sessions")
      .select("*")
      .eq("token_hash", tokenHash)
      .eq("email", user.email || "")
      .eq("purpose", "CHANGE_PASSWORD")
      .is("consumed_at", null)
      .limit(1);

    const session = sessionRows?.[0];
    if (!session || new Date(session.expires_at).getTime() <= Date.now()) {
      return errorResponse(403, "Verification session expired.");
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, { password: newPassword });
    if (error) throw error;

    await supabaseAdmin.from("otp_sessions").update({ consumed_at: new Date().toISOString() }).eq("id", session.id);
    await writeAuditLog({
      userId: user.id,
      action: "auth.password_changed",
      metadata: {},
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
    });

    return json({ success: true });
  } catch (error) {
    if (error instanceof Response) return error;
    return errorResponse(500, error instanceof Error ? error.message : "Unable to change password.");
  }
});
