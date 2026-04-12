import { requireAdmin } from "../_shared/admin.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { errorResponse, json } from "../_shared/response.ts";
import { supabaseAdmin } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  if (req.method !== "POST") return errorResponse(405, "Method not allowed.", undefined, { headers: corsHeaders });

  try {
    await requireAdmin(req, { permission: "audit.view", denialAction: "admin.dashboard_denied" });

    const [
      { count: usersCount, error: usersError },
      { count: circlesCount, error: circlesError },
      { count: resourcesCount, error: resourcesError },
      { count: pendingReportsCount, error: reportsError },
      { count: pendingTicketsCount, error: ticketsError },
      { count: completedTransactionsCount, error: txError },
    ] = await Promise.all([
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("chats").select("id", { count: "exact", head: true }).not("circle_id", "is", null),
      supabaseAdmin.from("resources").select("id", { count: "exact", head: true }).neq("status", "deleted"),
      supabaseAdmin.from("moderation_reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabaseAdmin.from("support_tickets").select("id", { count: "exact", head: true }).in("status", ["open", "pending"]),
      supabaseAdmin.from("transactions").select("id", { count: "exact", head: true }).eq("status", "completed"),
    ]);

    if (usersError || circlesError || resourcesError || reportsError || ticketsError || txError) {
      throw new Error("Unable to load dashboard stats.");
    }

    return json({
      users: usersCount || 0,
      circles: circlesCount || 0,
      resources: resourcesCount || 0,
      pendingCircles: pendingReportsCount || 0,
      storageUsed: completedTransactionsCount ? `${completedTransactionsCount} completed payments` : null,
      pendingSupport: pendingTicketsCount || 0,
    }, { headers: corsHeaders });
  } catch (error) {
    if (error instanceof Response) return error;
    return errorResponse(500, error instanceof Error ? error.message : "Unable to load dashboard.", undefined, { headers: corsHeaders });
  }
});
