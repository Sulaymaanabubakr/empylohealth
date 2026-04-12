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
    const body = await readJson<{ verificationToken?: string }>(req);
    const verificationToken = String(body.verificationToken || "");
    if (!verificationToken) return errorResponse(400, "Verification token is required.");

    const payload = await verifyVerificationToken(verificationToken);
    if (payload.email !== user.email || payload.purpose !== "EMAIL_VERIFY") {
      return errorResponse(403, "Verification token is invalid for email verification.");
    }

    const tokenHash = await hashValue(verificationToken, "otp-session");
    const { data: sessionRows } = await supabaseAdmin
      .from("otp_sessions")
      .select("*")
      .eq("token_hash", tokenHash)
      .eq("email", user.email || "")
      .eq("purpose", "EMAIL_VERIFY")
      .is("consumed_at", null)
      .limit(1);

    const session = sessionRows?.[0];
    if (!session || new Date(session.expires_at).getTime() <= Date.now()) {
      return errorResponse(403, "Verification session expired.");
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, { email_confirm: true });
    if (error) throw error;

    await supabaseAdmin.from("otp_sessions").update({ consumed_at: new Date().toISOString() }).eq("id", session.id);
    await writeAuditLog({
      userId: user.id,
      action: "auth.email_verified",
      metadata: { email: user.email || "" },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
    });

    return json({ success: true });
  } catch (error) {
    if (error instanceof Response) return error;
    return errorResponse(500, error instanceof Error ? error.message : "Unable to verify email.");
  }
});
