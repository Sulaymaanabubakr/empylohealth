import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth.ts";
import { writeAuditLog } from "../_shared/audit.ts";
import { getIpAddress, getUserAgent } from "../_shared/request.ts";
import { errorResponse, json } from "../_shared/response.ts";
import { supabaseAdmin } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  if (req.method !== "POST") return errorResponse(405, "Method not allowed.");

  try {
    const { user } = await requireUser(req);
    const { data: rows, error } = await supabaseAdmin
      .from("staff_roles")
      .select("role, permissions, is_active")
      .eq("user_id", user.id)
      .limit(1);

    if (error) throw error;
    const staffRole = rows?.[0];

    const ipAddress = getIpAddress(req);
    const userAgent = getUserAgent(req);

    if (!staffRole || !staffRole.is_active) {
      await writeAuditLog({
        userId: user.id,
        action: "admin.bootstrap_denied",
        metadata: {},
        ipAddress,
        userAgent,
      });
      return errorResponse(403, "Admin access denied.", undefined, { headers: corsHeaders });
    }

    const permissions = Array.isArray(staffRole.permissions) ? staffRole.permissions : [];

    await writeAuditLog({
      userId: user.id,
      action: "admin.bootstrap",
      metadata: { role: staffRole.role },
      ipAddress,
      userAgent,
    });

    return json(
      {
        isAdmin: true,
        role: String(staffRole.role || "viewer"),
        permissions,
      },
      { headers: corsHeaders },
    );
  } catch (error) {
    if (error instanceof Response) return error;
    return errorResponse(
      500,
      error instanceof Error ? error.message : "Unable to bootstrap admin session.",
      undefined,
      { headers: corsHeaders },
    );
  }
});
