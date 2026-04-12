import { requireAdmin } from "../_shared/admin.ts";
import { writeAuditLog } from "../_shared/audit.ts";
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
    const body = await parseBody(req);
    const action = String(body?.action || "list");

    if (action === "list") {
      await requireAdmin(req, { permission: "moderation.view", denialAction: "admin.moderation_list_denied" });
      const limit = Math.min(Math.max(Number(body?.limit || 100), 1), 300);
      const status = String(body?.status || "pending");
      const query = supabaseAdmin
        .from("moderation_reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      const { data, error } = status ? await query.eq("status", status) : await query;
      if (error) throw error;

      const items = (data || []).map((report) => ({
        id: report.id,
        reason: report.reason,
        details: report.details,
        status: report.status,
        reportedBy: report.reported_by || "",
        reportedUserId: report.reported_user_id || undefined,
        contentId: report.content_id || undefined,
        contentType: report.content_type || undefined,
        createdAt: report.created_at,
      }));
      return json({ items }, { headers: corsHeaders });
    }

    if (action === "resolve") {
      const admin = await requireAdmin(req, { permission: "moderation.resolve", denialAction: "admin.moderation_resolve_denied" });
      const reportId = String(body?.reportId || "");
      const resolutionAction = String(body?.resolutionAction || body?.actionType || body?.actionValue || body?.selectedAction || body?.doAction || body?.action || "");
      const requestedAction = String(body?.reportAction || "");
      const finalAction = resolutionAction && resolutionAction !== "resolve" ? resolutionAction : requestedAction;
      if (!reportId || !["dismiss", "suspend_user", "delete_content"].includes(finalAction)) {
        return errorResponse(400, "Invalid moderation resolution.", undefined, { headers: corsHeaders });
      }

      const { data: report, error: reportError } = await supabaseAdmin
        .from("moderation_reports")
        .select("*")
        .eq("id", reportId)
        .maybeSingle();
      if (reportError) throw reportError;
      if (!report) return errorResponse(404, "Report not found.", undefined, { headers: corsHeaders });

      if (finalAction === "suspend_user" && report.reported_user_id) {
        const { error: suspendError } = await supabaseAdmin.auth.admin.updateUserById(report.reported_user_id, {
          ban_duration: "876000h",
        });
        if (suspendError) throw suspendError;
      }

      if (finalAction === "delete_content" && report.content_type === "resources" && report.content_id) {
        await supabaseAdmin.from("resources").update({ status: "deleted" }).eq("id", report.content_id);
      }

      const { error } = await supabaseAdmin
        .from("moderation_reports")
        .update({
          status: "resolved",
          resolution_action: finalAction,
          resolved_by: admin.user.id,
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", reportId);
      if (error) throw error;

      await writeAuditLog({
        userId: admin.user.id,
        action: "admin.moderation.resolve",
        metadata: { targetId: reportId, targetCollection: "moderation_reports", resolutionAction: finalAction },
        ipAddress: admin.ipAddress,
        userAgent: admin.userAgent,
      });

      return json({ success: true }, { headers: corsHeaders });
    }

    return errorResponse(400, "Unsupported action.", undefined, { headers: corsHeaders });
  } catch (error) {
    if (error instanceof Response) return error;
    return errorResponse(500, error instanceof Error ? error.message : "Unable to manage moderation reports.", undefined, { headers: corsHeaders });
  }
});
