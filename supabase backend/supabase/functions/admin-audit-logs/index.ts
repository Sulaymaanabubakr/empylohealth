import { requireAdmin } from "../_shared/admin.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { errorResponse, json } from "../_shared/response.ts";
import { supabaseAdmin } from "../_shared/supabase.ts";

const parseBody = async (req: Request) => {
  try {
    return await req.json();
  } catch {
    return {};
  }
};

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  if (req.method !== "POST") return errorResponse(405, "Method not allowed.", undefined, { headers: corsHeaders });

  try {
    const admin = await requireAdmin(req, { permission: "audit.view", denialAction: "admin.audit_logs_denied" });
    const body = await parseBody(req);
    const limit = Math.min(Math.max(Number(body?.limit || 150), 1), 500);

    const { data: logs, error } = await supabaseAdmin
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;

    const userIds = [...new Set((logs || []).map((item) => item.user_id).filter(Boolean))];
    const [{ data: profiles }, { data: staffRoles }] = await Promise.all([
      userIds.length
        ? supabaseAdmin.from("profiles").select("id, email, name").in("id", userIds)
        : Promise.resolve({ data: [] }),
      userIds.length
        ? supabaseAdmin.from("staff_roles").select("user_id, role").in("user_id", userIds)
        : Promise.resolve({ data: [] }),
    ]);

    const profileMap = new Map((profiles || []).map((item) => [item.id, item]));
    const roleMap = new Map((staffRoles || []).map((item) => [item.user_id, item.role]));

    const items = (logs || []).map((log) => {
      const profile = profileMap.get(log.user_id);
      return {
        id: log.id,
        action: log.action,
        actorEmail: profile?.email || "",
        actorRole: roleMap.get(log.user_id) || "",
        targetCollection: log.metadata?.targetCollection || null,
        targetId: log.metadata?.targetId || null,
        metadata: log.metadata || {},
        createdAt: log.created_at,
      };
    });

    return json({ items }, { headers: corsHeaders });
  } catch (error) {
    if (error instanceof Response) return error;
    return errorResponse(500, error instanceof Error ? error.message : "Unable to load audit logs.", undefined, { headers: corsHeaders });
  }
});
