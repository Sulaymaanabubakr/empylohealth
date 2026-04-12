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

const toResourceResponse = (item: Record<string, unknown>) => ({
  id: String(item.id || ""),
  title: String(item.title || ""),
  description: String(item.description || ""),
  content: String(item.content || ""),
  image: String(item.image || ""),
  category: String(item.category || ""),
  tag: String(item.tag || ""),
  time: String(item.time || ""),
  status: String(item.status || ""),
  contentFormat: String(item.content_format || "html"),
  access: item.access || {},
  createdAt: item.created_at || null,
});

const toAffirmationResponse = (item: Record<string, unknown>) => ({
  id: String(item.id || ""),
  content: String(item.content || ""),
  image: String(item.image || ""),
  status: String(item.status || ""),
  scheduledDate: item.scheduled_date || null,
  createdAt: item.created_at || null,
  isNew: false,
});

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  if (req.method !== "POST") return errorResponse(405, "Method not allowed.", undefined, { headers: corsHeaders });

  try {
    const body = await parseBody(req);
    const action = String(body?.action || "");
    const type = String(body?.type || "");
    const limit = Math.min(Math.max(Number(body?.limit || 50), 1), 200);

    if (!["resources", "affirmations", "circles"].includes(type)) {
      return errorResponse(400, "Unsupported content type.", undefined, { headers: corsHeaders });
    }

    if (action === "list") {
      await requireAdmin(req, { permission: "content.view", denialAction: "admin.content_list_denied" });

      const query = type === "circles"
        ? supabaseAdmin
          .from("circles")
          .select("*")
          .neq("status", "deleted")
          .order("created_at", { ascending: false })
          .limit(limit)
        : supabaseAdmin
          .from(type)
          .select("*")
          .neq("status", "deleted")
          .order(type === "affirmations" ? "published_at" : "created_at", { ascending: false })
          .limit(limit);

      const { data, error } = await query;
      if (error) throw error;

      const items = (data || []).map((item) =>
        type === "resources"
          ? toResourceResponse(item as Record<string, unknown>)
          : type === "affirmations"
            ? toAffirmationResponse(item as Record<string, unknown>)
            : {
              id: String(item.id || ""),
              name: String(item.name || ""),
              description: String(item.description || ""),
              image: String(item.image || ""),
              type: String(item.type || "public"),
              category: String(item.category || ""),
              status: String(item.status || ""),
              createdAt: item.created_at || null,
            }
      );
      return json({ items }, { headers: corsHeaders });
    }

    if (action === "create") {
      const admin = await requireAdmin(req, { permission: "content.edit", denialAction: "admin.content_create_denied" });
      const payload = body?.payload || {};

      if (type === "circles") {
        return errorResponse(400, "Circle creation is managed in-app.", undefined, { headers: corsHeaders });
      }

      const insertPayload = type === "resources"
        ? {
          title: String(payload.title || "").trim(),
          description: String(payload.description || ""),
          content: String(payload.content || ""),
          content_format: String(payload.contentFormat || "html"),
          image: String(payload.image || ""),
          category: String(payload.category || ""),
          tag: String(payload.tag || ""),
          time: String(payload.time || ""),
          status: String(payload.status || "active"),
          access: payload.access || {},
        }
        : {
          content: String(payload.content || "").trim(),
          image: String(payload.image || ""),
          status: String(payload.status || "active"),
          scheduled_date: payload.scheduledDate || null,
          is_active: String(payload.status || "active") !== "deleted",
        };

      const { data, error } = await supabaseAdmin
        .from(type)
        .insert(insertPayload)
        .select("*")
        .single();
      if (error) throw error;

      await writeAuditLog({
        userId: admin.user.id,
        action: `admin.${type}.create`,
        metadata: { id: data.id },
        ipAddress: admin.ipAddress,
        userAgent: admin.userAgent,
      });

      return json({ item: type === "resources" ? toResourceResponse(data) : toAffirmationResponse(data) }, { headers: corsHeaders });
    }

    if (action === "update") {
      const admin = await requireAdmin(req, { permission: "content.edit", denialAction: "admin.content_update_denied" });
      const id = String(body?.id || "");
      const updates = body?.updates || {};
      if (!id) return errorResponse(400, "Missing content id.", undefined, { headers: corsHeaders });

      const updatePayload = type === "resources"
        ? {
          title: updates.title,
          description: updates.description,
          content: updates.content,
          content_format: updates.contentFormat || "html",
          image: updates.image,
          category: updates.category,
          tag: updates.tag,
          time: updates.time,
          status: updates.status,
          access: updates.access,
        }
        : {
          ...(type === "affirmations"
            ? {
              content: updates.content,
              status: updates.status,
              scheduled_date: updates.scheduledDate || null,
              is_active: String(updates.status || "active") !== "deleted",
            }
            : {
              name: updates.name,
              description: updates.description,
              image: updates.image,
              type: updates.type,
              category: updates.category,
              status: updates.status,
            }),
        };

      const { data, error } = await supabaseAdmin
        .from(type)
        .update(updatePayload)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;

      await writeAuditLog({
        userId: admin.user.id,
        action: `admin.${type}.update`,
        metadata: { id },
        ipAddress: admin.ipAddress,
        userAgent: admin.userAgent,
      });

      return json({
        item: type === "resources"
          ? toResourceResponse(data)
          : type === "affirmations"
            ? toAffirmationResponse(data)
            : {
              id: String(data.id || ""),
              name: String(data.name || ""),
              description: String(data.description || ""),
              image: String(data.image || ""),
              type: String(data.type || "public"),
              category: String(data.category || ""),
              status: String(data.status || ""),
              createdAt: data.created_at || null,
            },
      }, { headers: corsHeaders });
    }

    if (action === "delete") {
      const admin = await requireAdmin(req, { permission: "content.delete", denialAction: "admin.content_delete_denied" });
      const id = String(body?.id || "");
      if (!id) return errorResponse(400, "Missing content id.", undefined, { headers: corsHeaders });

      const { error } = await supabaseAdmin
        .from(type)
        .update(type === "resources"
          ? { status: "deleted" }
          : type === "affirmations"
            ? { status: "deleted", is_active: false }
            : { status: "deleted" })
        .eq("id", id);
      if (error) throw error;

      await writeAuditLog({
        userId: admin.user.id,
        action: `admin.${type}.delete`,
        metadata: { id },
        ipAddress: admin.ipAddress,
        userAgent: admin.userAgent,
      });

      return json({ success: true }, { headers: corsHeaders });
    }

    if (action === "bulkUpdate") {
      const admin = await requireAdmin(req, {
        permission: String(body?.bulkAction || "") === "soft_delete" ? "content.delete" : "content.edit",
        denialAction: "admin.content_bulk_denied",
      });
      const ids = Array.isArray(body?.ids) ? body.ids.map((item: unknown) => String(item)).filter(Boolean) : [];
      if (ids.length === 0) return errorResponse(400, "Missing content ids.", undefined, { headers: corsHeaders });

      const bulkAction = String(body?.bulkAction || "");
      let payload: Record<string, unknown>;
      if (bulkAction === "soft_delete") {
        payload = type === "resources"
          ? { status: "deleted" }
          : type === "affirmations"
            ? { status: "deleted", is_active: false }
            : { status: "deleted" };
      } else if (bulkAction === "set_status") {
        const status = String(body?.status || "active");
        payload = type === "resources"
          ? { status }
          : type === "affirmations"
            ? { status, is_active: status !== "deleted" }
            : { status };
      } else {
        return errorResponse(400, "Unsupported bulk action.", undefined, { headers: corsHeaders });
      }

      const { error } = await supabaseAdmin.from(type).update(payload).in("id", ids);
      if (error) throw error;

      await writeAuditLog({
        userId: admin.user.id,
        action: `admin.${type}.bulk_update`,
        metadata: { count: ids.length, bulkAction, status: body?.status || null },
        ipAddress: admin.ipAddress,
        userAgent: admin.userAgent,
      });

      return json({ success: true }, { headers: corsHeaders });
    }

    return errorResponse(400, "Unsupported action.", undefined, { headers: corsHeaders });
  } catch (error) {
    if (error instanceof Response) return error;
    return errorResponse(500, error instanceof Error ? error.message : "Unable to manage content.", undefined, { headers: corsHeaders });
  }
});
