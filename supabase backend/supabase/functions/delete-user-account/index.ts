import { requireUser } from "../_shared/auth.ts";
import { writeAuditLog } from "../_shared/audit.ts";
import { getIpAddress, getUserAgent } from "../_shared/request.ts";
import { errorResponse, json } from "../_shared/response.ts";
import { supabaseAdmin } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") return errorResponse(405, "Method not allowed.");

  try {
    const { user } = await requireUser(req);
    const userId = user.id;

    await supabaseAdmin.from("user_devices").delete().eq("user_id", userId);
    await supabaseAdmin.from("otp_sessions").delete().eq("email", user.email || "");
    await supabaseAdmin.from("otp_requests").delete().eq("email", user.email || "");
    await supabaseAdmin.from("audit_logs").update({
      user_id: null,
      metadata: { anonymized: true, previousUserId: userId },
    }).eq("user_id", userId);
    await supabaseAdmin.from("profiles").delete().eq("id", userId);

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteError && !deleteError.message.toLowerCase().includes("not found")) {
      console.warn("[delete-user-account] auth deletion warning", deleteError.message);
    }

    await writeAuditLog({
      action: "auth.account_deleted",
      metadata: { userId },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
    });

    return json({ success: true });
  } catch (error) {
    if (error instanceof Response) return error;
    return errorResponse(500, error instanceof Error ? error.message : "Unable to delete account.");
  }
});
