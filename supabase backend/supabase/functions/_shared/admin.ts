import { requireUser } from "./auth.ts";
import { writeAuditLog } from "./audit.ts";
import { corsHeaders } from "./cors.ts";
import { getIpAddress, getUserAgent } from "./request.ts";
import { errorResponse } from "./response.ts";
import { supabaseAdmin } from "./supabase.ts";

type AdminCheckOptions = {
  permission?: string;
  denialAction?: string;
};

export const requireAdmin = async (req: Request, options: AdminCheckOptions = {}) => {
  const { user, token } = await requireUser(req);
  const { data: rows, error } = await supabaseAdmin
    .from("staff_roles")
    .select("role, permissions, is_active")
    .eq("user_id", user.id)
    .limit(1);

  if (error) {
    throw errorResponse(500, "Unable to load admin role.", undefined, { headers: corsHeaders });
  }

  const staffRole = rows?.[0];
  const ipAddress = getIpAddress(req);
  const userAgent = getUserAgent(req);

  if (!staffRole || !staffRole.is_active) {
    await writeAuditLog({
      userId: user.id,
      action: options.denialAction || "admin.access_denied",
      metadata: { reason: "inactive_or_missing_role" },
      ipAddress,
      userAgent,
    });
    throw errorResponse(403, "Admin access denied.", undefined, { headers: corsHeaders });
  }

  const role = String(staffRole.role || "viewer").toLowerCase();
  const permissions = Array.isArray(staffRole.permissions)
    ? staffRole.permissions.map((item) => String(item))
    : [];
  const permission = options.permission ? String(options.permission) : null;
  const isElevatedRole = role === "admin" || role === "super_admin";

  if (permission && !isElevatedRole && !permissions.includes(permission)) {
    await writeAuditLog({
      userId: user.id,
      action: options.denialAction || "admin.permission_denied",
      metadata: { permission, role },
      ipAddress,
      userAgent,
    });
    throw errorResponse(403, "Missing required permission.", undefined, { headers: corsHeaders });
  }

  return {
    token,
    user,
    role,
    permissions,
    ipAddress,
    userAgent,
  };
};
