import { requireUser } from "../_shared/auth.ts";
import { writeAuditLog } from "../_shared/audit.ts";
import { hashValue, normalizeEmail, verifyVerificationToken } from "../_shared/otp.ts";
import { getIpAddress, getUserAgent, readJson } from "../_shared/request.ts";
import { errorResponse, json } from "../_shared/response.ts";
import { supabaseAdmin } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") return errorResponse(405, "Method not allowed.");

  try {
    const { user } = await requireUser(req);
    const body = await readJson<{ newEmail?: string; verificationToken?: string }>(req);
    const newEmail = normalizeEmail(String(body.newEmail || ""));
    const verificationToken = String(body.verificationToken || "");
    if (!newEmail || !verificationToken) return errorResponse(400, "Missing email change fields.");

    const payload = await verifyVerificationToken(verificationToken);
    if (payload.email !== newEmail || payload.purpose !== "CHANGE_EMAIL") {
      return errorResponse(403, "Verification token is invalid for email change.");
    }

    const tokenHash = await hashValue(verificationToken, "otp-session");
    const { data: sessionRows } = await supabaseAdmin
      .from("otp_sessions")
      .select("*")
      .eq("token_hash", tokenHash)
      .eq("email", newEmail)
      .eq("purpose", "CHANGE_EMAIL")
      .is("consumed_at", null)
      .limit(1);

    const session = sessionRows?.[0];
    if (!session || new Date(session.expires_at).getTime() <= Date.now()) {
      return errorResponse(403, "Verification session expired.");
    }

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      email: newEmail,
      email_confirm: true,
    });
    if (authError) throw authError;

    const { error: profileError } = await supabaseAdmin.from("profiles").update({ email: newEmail }).eq("id", user.id);
    if (profileError) throw profileError;

    await supabaseAdmin.from("otp_sessions").update({ consumed_at: new Date().toISOString() }).eq("id", session.id);
    await writeAuditLog({
      userId: user.id,
      action: "auth.email_changed",
      metadata: { newEmail },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
    });

    return json({ success: true });
  } catch (error) {
    if (error instanceof Response) return error;
    return errorResponse(500, error instanceof Error ? error.message : "Unable to change email.");
  }
});
