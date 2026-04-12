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

const toQuestionResponse = (item: Record<string, unknown>) => ({
  id: String(item.id || ""),
  text: String(item.text || ""),
  type: String(item.type || "scale"),
  category: String(item.category || "General"),
  tags: Array.isArray(item.tags) ? item.tags : [],
  weight: Number(item.weight || 1),
  order: Number(item.sort_order || 0),
  isActive: item.is_active !== false,
});

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  if (req.method !== "POST") return errorResponse(405, "Method not allowed.", undefined, { headers: corsHeaders });

  try {
    const body = await parseBody(req);
    const action = String(body?.action || "");

    if (action === "list") {
      await requireAdmin(req, { permission: "content.view", denialAction: "admin.assessment_questions_list_denied" });
      const { data, error } = await supabaseAdmin
        .from("assessment_questions")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return json({ items: (data || []).map((item) => toQuestionResponse(item)) }, { headers: corsHeaders });
    }

    if (action === "upsert") {
      const admin = await requireAdmin(req, { permission: "content.edit", denialAction: "admin.assessment_questions_upsert_denied" });
      const payload = body?.payload || {};
      const id = String(payload.id || "");
      const dbPayload = {
        text: String(payload.text || "").trim(),
        type: String(payload.type || "scale"),
        category: String(payload.category || "General"),
        tags: Array.isArray(payload.tags) ? payload.tags : [],
        weight: Number(payload.weight || 1),
        sort_order: Number(payload.order || 0),
        is_active: payload.isActive !== false,
      };

      let data;
      let error;
      if (id) {
        ({ data, error } = await supabaseAdmin
          .from("assessment_questions")
          .update(dbPayload)
          .eq("id", id)
          .select("*")
          .single());
      } else {
        ({ data, error } = await supabaseAdmin
          .from("assessment_questions")
          .insert(dbPayload)
          .select("*")
          .single());
      }
      if (error) throw error;

      await writeAuditLog({
        userId: admin.user.id,
        action: id ? "admin.assessment_question.update" : "admin.assessment_question.create",
        metadata: { id: data.id },
        ipAddress: admin.ipAddress,
        userAgent: admin.userAgent,
      });

      return json({ item: toQuestionResponse(data) }, { headers: corsHeaders });
    }

    if (action === "delete") {
      const admin = await requireAdmin(req, { permission: "content.delete", denialAction: "admin.assessment_questions_delete_denied" });
      const id = String(body?.id || "");
      if (!id) return errorResponse(400, "Missing question id.", undefined, { headers: corsHeaders });

      const { error } = await supabaseAdmin.from("assessment_questions").delete().eq("id", id);
      if (error) throw error;

      await writeAuditLog({
        userId: admin.user.id,
        action: "admin.assessment_question.delete",
        metadata: { id },
        ipAddress: admin.ipAddress,
        userAgent: admin.userAgent,
      });

      return json({ success: true }, { headers: corsHeaders });
    }

    return errorResponse(400, "Unsupported action.", undefined, { headers: corsHeaders });
  } catch (error) {
    if (error instanceof Response) return error;
    return errorResponse(
      500,
      error instanceof Error ? error.message : "Unable to manage assessment questions.",
      undefined,
      { headers: corsHeaders },
    );
  }
});
