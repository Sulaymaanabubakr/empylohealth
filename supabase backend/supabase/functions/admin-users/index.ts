import { requireAdmin } from "../_shared/admin.ts";
import { writeAuditLog } from "../_shared/audit.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { errorResponse, json } from "../_shared/response.ts";
import { defaultPermissionsForRole, isEmployeeRole } from "../_shared/staff.ts";
import { supabaseAdmin } from "../_shared/supabase.ts";

const parseBody = async (req: Request) => {
  try {
    return await req.json();
  } catch {
    return {};
  }
};

const isCurrentlyBanned = (bannedUntil: string | null | undefined) => {
  if (!bannedUntil) return false;
  const timestamp = Date.parse(bannedUntil);
  return Number.isFinite(timestamp) && timestamp > Date.now();
};

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  if (req.method !== "POST") return errorResponse(405, "Method not allowed.", undefined, { headers: corsHeaders });

  try {
    const body = await parseBody(req);
    const action = String(body?.action || "");

    if (action === "list") {
      await requireAdmin(req, { permission: "users.view", denialAction: "admin.users_list_denied" });
      const limit = Math.min(Math.max(Number(body?.limit || 100), 1), 500);
      const roles = Array.isArray(body?.roles) ? body.roles.map((item: unknown) => String(item)) : [];

      const { data: authResult, error: authError } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: limit,
      });
      if (authError) throw authError;

      const users = authResult?.users || [];
      const userIds = users.map((user) => user.id);
      const [{ data: profiles }, { data: staffRoles }] = await Promise.all([
        userIds.length
          ? supabaseAdmin.from("profiles").select("id, email, name, photo_url, role").in("id", userIds)
          : Promise.resolve({ data: [] }),
        userIds.length
          ? supabaseAdmin.from("staff_roles").select("user_id, role, is_active").in("user_id", userIds)
          : Promise.resolve({ data: [] }),
      ]);

      const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]));
      const staffMap = new Map((staffRoles || []).filter((role) => role.is_active).map((role) => [role.user_id, role]));

      const items = users
        .map((user) => {
          const profile = profileMap.get(user.id);
          const staffRole = staffMap.get(user.id);
          const role = staffRole?.role || profile?.role || "user";
          return {
            id: user.id,
            email: user.email || profile?.email || "",
            displayName: profile?.name || String(user.user_metadata?.name || user.email || "User"),
            role,
            createdAt: user.created_at,
            status: isCurrentlyBanned(user.banned_until) ? "suspended" : "active",
            photoURL: profile?.photo_url || String(user.user_metadata?.avatar_url || ""),
          };
        })
        .filter((item) => roles.length === 0 || roles.includes(item.role));

      return json({ users: items }, { headers: corsHeaders });
    }

    if (action === "toggleStatus") {
      const admin = await requireAdmin(req, { permission: "users.manage", denialAction: "admin.users_toggle_denied" });
      const uid = String(body?.uid || "");
      const status = String(body?.status || "");
      if (!uid || !["active", "suspended"].includes(status)) {
        return errorResponse(400, "Invalid user status request.", undefined, { headers: corsHeaders });
      }

      const { error } = await supabaseAdmin.auth.admin.updateUserById(uid, {
        ban_duration: status === "suspended" ? "876000h" : "none",
      });
      if (error) throw error;

      await writeAuditLog({
        userId: admin.user.id,
        action: "admin.users.toggle_status",
        metadata: { targetId: uid, nextStatus: status, targetCollection: "users" },
        ipAddress: admin.ipAddress,
        userAgent: admin.userAgent,
      });

      return json({ success: true }, { headers: corsHeaders });
    }

    if (action === "createEmployee") {
      const admin = await requireAdmin(req, { permission: "employees.manage", denialAction: "admin.employees_create_denied" });
      const displayName = String(body?.displayName || "").trim();
      const email = String(body?.email || "").trim().toLowerCase();
      const password = String(body?.password || "");
      const role = String(body?.role || "editor").trim().toLowerCase();

      if (!displayName || !email || !password || !isEmployeeRole(role)) {
        return errorResponse(400, "Invalid employee details.", undefined, { headers: corsHeaders });
      }

      const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name: displayName },
      });
      if (createError || !createdUser?.user) throw createError || new Error("Unable to create employee.");

      const newUserId = createdUser.user.id;
      try {
        const permissions = defaultPermissionsForRole(role);
        const [{ error: profileError }, { error: roleError }] = await Promise.all([
          supabaseAdmin.from("profiles").insert({
            id: newUserId,
            email,
            name: displayName,
            role,
            onboarding_completed: true,
          }),
          supabaseAdmin.from("staff_roles").upsert({
            user_id: newUserId,
            role,
            permissions,
            is_active: true,
          }),
        ]);

        if (profileError || roleError) {
          throw profileError || roleError;
        }
      } catch (error) {
        await supabaseAdmin.auth.admin.deleteUser(newUserId, true);
        throw error;
      }

      await writeAuditLog({
        userId: admin.user.id,
        action: "admin.employees.create",
        metadata: { targetId: newUserId, targetCollection: "users", role },
        ipAddress: admin.ipAddress,
        userAgent: admin.userAgent,
      });

      return json({ success: true, userId: newUserId }, { headers: corsHeaders });
    }

    if (action === "delete") {
      const admin = await requireAdmin(req, { permission: "users.delete", denialAction: "admin.users_delete_denied" });
      const uid = String(body?.uid || "");
      if (!uid) return errorResponse(400, "Missing user id.", undefined, { headers: corsHeaders });

      await supabaseAdmin.from("user_devices").delete().eq("user_id", uid);
      await supabaseAdmin.from("profiles").delete().eq("id", uid);

      const { error } = await supabaseAdmin.auth.admin.deleteUser(uid, true);
      if (error) throw error;

      await writeAuditLog({
        userId: admin.user.id,
        action: "admin.users.delete",
        metadata: { targetId: uid, targetCollection: "users" },
        ipAddress: admin.ipAddress,
        userAgent: admin.userAgent,
      });

      return json({ success: true }, { headers: corsHeaders });
    }

    return errorResponse(400, "Unsupported action.", undefined, { headers: corsHeaders });
  } catch (error) {
    if (error instanceof Response) return error;
    return errorResponse(500, error instanceof Error ? error.message : "Unable to manage users.", undefined, { headers: corsHeaders });
  }
});
