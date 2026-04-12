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
      await requireAdmin(req, { permission: "support.view", denialAction: "admin.support_list_denied" });
      const limit = Math.min(Math.max(Number(body?.limit || 50), 1), 200);
      const { data, error } = await supabaseAdmin
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      const items = (data || []).map((ticket) => ({
        id: ticket.id,
        email: ticket.email,
        subject: ticket.subject,
        message: ticket.message,
        status: ticket.status,
        createdAt: ticket.created_at,
        updatedAt: ticket.updated_at,
        lastReply: ticket.last_reply,
      }));
      return json({ items }, { headers: corsHeaders });
    }

    if (action === "update") {
      const admin = await requireAdmin(req, { permission: "support.manage", denialAction: "admin.support_update_denied" });
      const ticketId = String(body?.ticketId || "");
      const status = String(body?.status || "");
      const reply = body?.reply ? String(body.reply) : null;
      if (!ticketId || !["open", "resolved", "pending"].includes(status)) {
        return errorResponse(400, "Invalid ticket update.", undefined, { headers: corsHeaders });
      }

      const { error } = await supabaseAdmin
        .from("support_tickets")
        .update({
          status,
          last_reply: reply,
          updated_at: new Date().toISOString(),
        })
        .eq("id", ticketId);
      if (error) throw error;

      await writeAuditLog({
        userId: admin.user.id,
        action: "admin.support.update",
        metadata: { targetId: ticketId, targetCollection: "support_tickets", status },
        ipAddress: admin.ipAddress,
        userAgent: admin.userAgent,
      });

      return json({ success: true }, { headers: corsHeaders });
    }

    return errorResponse(400, "Unsupported action.", undefined, { headers: corsHeaders });
  } catch (error) {
    if (error instanceof Response) return error;
    return errorResponse(500, error instanceof Error ? error.message : "Unable to manage support tickets.", undefined, { headers: corsHeaders });
  }
});
