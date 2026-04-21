import { requireUser } from "../_shared/auth.ts";
import { writeAuditLog } from "../_shared/audit.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { errorResponse, json } from "../_shared/response.ts";
import { createRlsClient, supabaseAdmin } from "../_shared/supabase.ts";
import { getIpAddress, getUserAgent } from "../_shared/request.ts";

const parseBody = async (req: Request) => {
  try {
    return await req.json();
  } catch {
    return {};
  }
};

const encoder = new TextEncoder();
const ACTIVE_MEMBER_ROLES = new Set(["creator", "admin", "moderator", "member"]);

const hashValue = async (value: string) => {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

const randomToken = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes).map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

const normalizeCircle = (circle: Record<string, unknown> | null | undefined) => {
  if (!circle) return null;
  return {
    id: String(circle.id || ""),
    chatId: circle.chat_id || null,
    name: String(circle.name || ""),
    description: String(circle.description || ""),
    category: String(circle.category || "General"),
    type: String(circle.type || "public"),
    visibility: String(circle.visibility || "visible"),
    image: String(circle.image || ""),
    location: String(circle.location || ""),
    tags: Array.isArray(circle.tags) ? circle.tags : [],
    status: String(circle.status || "active"),
    billingTier: String(circle.billing_tier || "free"),
    creatorId: circle.creator_id || null,
    adminId: circle.admin_id || null,
    members: Array.isArray(circle.members) ? circle.members : [],
    activeHuddle: circle.active_huddle || null,
    createdAt: circle.created_at || null,
    updatedAt: circle.updated_at || null,
  };
};

const getCircleChatId = async (circleId: string) => {
  const { data, error } = await supabaseAdmin
    .from("chats")
    .select("id")
    .eq("circle_id", circleId)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return String(data?.id || "");
};

const upsertCircleChatParticipant = async (chatId: string, userId: string, role = "member") => {
  if (!chatId || !userId) return;
  const { error } = await supabaseAdmin
    .from("chat_participants")
    .upsert({
      chat_id: chatId,
      user_id: userId,
      role,
      joined_at: new Date().toISOString(),
      left_at: null,
    });
  if (error) throw error;
};

const removeCircleChatParticipant = async (chatId: string, userId: string) => {
  if (!chatId || !userId) return;
  const { error } = await supabaseAdmin
    .from("chat_participants")
    .delete()
    .eq("chat_id", chatId)
    .eq("user_id", userId);
  if (error) throw error;
};

const requireCircleRole = async (circleId: string, userId: string) => {
  const { data, error } = await supabaseAdmin
    .from("circle_members")
    .select("role, status")
    .eq("circle_id", circleId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  const role = String(data?.role || "");
  const status = String(data?.status || "");
  if (!ACTIVE_MEMBER_ROLES.has(role) || status !== "active") {
    throw errorResponse(403, "Circle access denied.", undefined, { headers: corsHeaders });
  }
  return role;
};

const canModerate = (role: string) => ["creator", "admin", "moderator"].includes(role);
const canAdmin = (role: string) => ["creator", "admin"].includes(role);

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  if (req.method !== "POST") return errorResponse(405, "Method not allowed.", undefined, { headers: corsHeaders });

  try {
    const body = await parseBody(req);
    const action = String(body?.action || "");
    const authOptional = new Set(["resolveInviteToken", "resolveAppInvite"]);
    const auth = authOptional.has(action) ? null : await requireUser(req);
    const user = auth?.user || null;
    const token = auth?.token || "";
    const rls = token ? createRlsClient(token) : null;
    const ipAddress = getIpAddress(req);
    const userAgent = getUserAgent(req);

    if (action === "createCircle") {
      if (!user) return errorResponse(401, "Authentication required.", undefined, { headers: corsHeaders });
      const payload = {
        name: String(body?.name || "").trim(),
        description: String(body?.description || ""),
        category: String(body?.category || "General"),
        type: String(body?.type || "public"),
        visibility: String(body?.visibility || "visible"),
        image: String(body?.image || ""),
        location: String(body?.location || ""),
        tags: Array.isArray(body?.tags) ? body.tags.map((item: unknown) => String(item)) : [],
      };
      if (!payload.name) return errorResponse(400, "Circle name is required.", undefined, { headers: corsHeaders });

      const { data: circle, error: circleError } = await supabaseAdmin
        .from("circles")
        .insert({
          ...payload,
          creator_id: user.id,
          admin_id: user.id,
          status: "active",
          billing_tier: "free",
        })
        .select("*")
        .single();
      if (circleError) throw circleError;

      const { data: chat, error: chatError } = await supabaseAdmin
        .from("chats")
        .insert({
          type: "group",
          name: payload.name,
          avatar: payload.image || "",
          circle_id: circle.id,
          created_by: user.id,
          is_active: true,
        })
        .select("id")
        .single();
      if (chatError) throw chatError;

      const { error: memberError } = await supabaseAdmin
        .from("circle_members")
        .insert({
          circle_id: circle.id,
          user_id: user.id,
          role: "creator",
          status: "active",
        });
      if (memberError) throw memberError;

      await upsertCircleChatParticipant(chat.id, user.id, "admin");

      await writeAuditLog({
        userId: user.id,
        action: "circle.create",
        metadata: { circleId: circle.id },
        ipAddress,
        userAgent,
      });

      return json({ ...normalizeCircle(circle), chatId: chat.id }, { headers: corsHeaders });
    }

    if (action === "updateCircle") {
      if (!user) return errorResponse(401, "Authentication required.", undefined, { headers: corsHeaders });
      const circleId = String(body?.circleId || "");
      const role = await requireCircleRole(circleId, user.id);
      if (!canModerate(role)) return errorResponse(403, "Only moderators can edit circles.", undefined, { headers: corsHeaders });

      const updates = ["name", "description", "category", "type", "visibility", "image", "location", "tags"]
        .reduce((acc: Record<string, unknown>, key) => {
          if (body?.[key] !== undefined) acc[key] = body[key];
          return acc;
        }, {});

      const { data, error } = await supabaseAdmin
        .from("circles")
        .update(updates)
        .eq("id", circleId)
        .select("*")
        .single();
      if (error) throw error;

      const chatUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) chatUpdates.name = String(updates.name || "");
      if (updates.image !== undefined) chatUpdates.avatar = String(updates.image || "");
      if (Object.keys(chatUpdates).length > 0) {
        await supabaseAdmin
          .from("chats")
          .update(chatUpdates)
          .eq("circle_id", circleId);
      }

      return json(normalizeCircle(data), { headers: corsHeaders });
    }

    if (action === "setCircleBillingTier") {
      if (!user) return errorResponse(401, "Authentication required.", undefined, { headers: corsHeaders });
      const circleId = String(body?.circleId || "");
      const role = await requireCircleRole(circleId, user.id);
      if (!canAdmin(role)) return errorResponse(403, "Only admins can change circle tier.", undefined, { headers: corsHeaders });

      const billingTier = String(body?.billingTier || "free").toLowerCase() === "pro" ? "pro" : "free";
      const { data, error } = await supabaseAdmin
        .from("circles")
        .update({ billing_tier: billingTier })
        .eq("id", circleId)
        .select("*")
        .single();
      if (error) throw error;
      return json({ success: true, circle: normalizeCircle(data) }, { headers: corsHeaders });
    }

    if (action === "joinCircle") {
      if (!user) return errorResponse(401, "Authentication required.", undefined, { headers: corsHeaders });
      const circleId = String(body?.circleId || "");
      const { data: circle, error: circleError } = await supabaseAdmin
        .from("circles")
        .select("id, type, status")
        .eq("id", circleId)
        .maybeSingle();
      if (circleError) throw circleError;
      if (!circle || String(circle.status || "") === "deleted") {
        return errorResponse(404, "Circle not found.", undefined, { headers: corsHeaders });
      }

      if (String(circle.type || "public") === "private") {
        await supabaseAdmin.from("circle_join_requests").upsert({
          circle_id: circleId,
          user_id: user.id,
          status: "pending",
        });
        return json({ success: true, status: "pending" }, { headers: corsHeaders });
      }

      await supabaseAdmin.from("circle_members").upsert({
        circle_id: circleId,
        user_id: user.id,
        role: "member",
        status: "active",
      });
      await upsertCircleChatParticipant(await getCircleChatId(circleId), user.id, "member");
      return json({ success: true, status: "joined" }, { headers: corsHeaders });
    }

    if (action === "leaveCircle") {
      if (!user) return errorResponse(401, "Authentication required.", undefined, { headers: corsHeaders });
      const circleId = String(body?.circleId || "");
      const chatId = await getCircleChatId(circleId);
      await supabaseAdmin.from("circle_members").delete().eq("circle_id", circleId).eq("user_id", user.id);
      await removeCircleChatParticipant(chatId, user.id);
      return json({ success: true }, { headers: corsHeaders });
    }

    if (action === "deleteCircle") {
      if (!user) return errorResponse(401, "Authentication required.", undefined, { headers: corsHeaders });
      const circleId = String(body?.circleId || "");
      const role = await requireCircleRole(circleId, user.id);
      if (!canAdmin(role)) return errorResponse(403, "Only admins can delete circles.", undefined, { headers: corsHeaders });
      const { error } = await supabaseAdmin.from("circles").update({ status: "deleted" }).eq("id", circleId);
      if (error) throw error;
      return json({ success: true }, { headers: corsHeaders });
    }

    if (action === "createCircleInvite") {
      if (!user) return errorResponse(401, "Authentication required.", undefined, { headers: corsHeaders });
      const circleId = String(body?.circleId || "");
      const role = await requireCircleRole(circleId, user.id);
      if (!canModerate(role)) return errorResponse(403, "Only moderators can create invites.", undefined, { headers: corsHeaders });

      const tokenValue = randomToken();
      const tokenHash = await hashValue(tokenValue);
      const expiresInHours = Math.max(Number(body?.expiresInHours || 72), 1);
      const maxUses = Math.max(Number(body?.maxUses || 10), 1);

      const { data, error } = await supabaseAdmin
        .from("circle_invites")
        .insert({
          circle_id: circleId,
          created_by: user.id,
          token_hash: tokenHash,
          expires_at: new Date(Date.now() + expiresInHours * 3600 * 1000).toISOString(),
          max_uses: maxUses,
        })
        .select("id, circle_id, expires_at, max_uses, use_count")
        .single();
      if (error) throw error;

      return json({
        id: data.id,
        token: tokenValue,
        circleId: data.circle_id,
        expiresAt: data.expires_at,
        maxUses: data.max_uses,
        useCount: data.use_count,
      }, { headers: corsHeaders });
    }

    if (action === "createAppInvite") {
      if (!user) return errorResponse(401, "Authentication required.", undefined, { headers: corsHeaders });
      const tokenValue = randomToken();
      const tokenHash = await hashValue(tokenValue);
      const expiresInHours = Math.max(Number(body?.expiresInHours || 72), 1);
      const maxUses = Math.max(Number(body?.maxUses || 10), 1);

      const { data, error } = await supabaseAdmin
        .from("app_invites")
        .insert({
          created_by: user.id,
          token_hash: tokenHash,
          expires_at: new Date(Date.now() + expiresInHours * 3600 * 1000).toISOString(),
          max_uses: maxUses,
        })
        .select("id, expires_at, max_uses, use_count")
        .single();
      if (error) throw error;

      return json({
        id: data.id,
        token: tokenValue,
        expiresAt: data.expires_at,
        maxUses: data.max_uses,
        useCount: data.use_count,
      }, { headers: corsHeaders });
    }

    if (action === "listUserInvitations") {
      if (!user) return errorResponse(401, "Authentication required.", undefined, { headers: corsHeaders });
      const [{ data: circleInvites }, { data: appInvites }] = await Promise.all([
        supabaseAdmin.from("circle_invites").select("id, circle_id, expires_at, max_uses, use_count, is_revoked, created_at").eq("created_by", user.id).order("created_at", { ascending: false }),
        supabaseAdmin.from("app_invites").select("id, expires_at, max_uses, use_count, is_revoked, created_at").eq("created_by", user.id).order("created_at", { ascending: false }),
      ]);
      return json({ circleInvites: circleInvites || [], appInvites: appInvites || [] }, { headers: corsHeaders });
    }

    if (action === "resolveInviteToken") {
      const tokenValue = String(body?.token || "");
      const tokenHash = await hashValue(tokenValue);
      const { data, error } = await supabaseAdmin
        .from("circle_invites")
        .select("circle_id, expires_at, max_uses, use_count, is_revoked")
        .eq("token_hash", tokenHash)
        .maybeSingle();
      if (error) throw error;
      if (!data || data.is_revoked || Number(data.use_count || 0) >= Number(data.max_uses || 0) || Date.parse(String(data.expires_at || "")) < Date.now()) {
        return errorResponse(404, "Invite is invalid or expired.", undefined, { headers: corsHeaders });
      }
      const { data: circle } = await supabaseAdmin.from("circles").select("*").eq("id", data.circle_id).maybeSingle();
      return json({ circle: normalizeCircle(circle as Record<string, unknown> | null) }, { headers: corsHeaders });
    }

    if (action === "joinCircleWithInvite") {
      if (!user) return errorResponse(401, "Authentication required.", undefined, { headers: corsHeaders });
      const tokenValue = String(body?.token || "");
      const tokenHash = await hashValue(tokenValue);
      const { data, error } = await supabaseAdmin
        .from("circle_invites")
        .select("*")
        .eq("token_hash", tokenHash)
        .maybeSingle();
      if (error) throw error;
      if (!data || data.is_revoked || Number(data.use_count || 0) >= Number(data.max_uses || 0) || Date.parse(String(data.expires_at || "")) < Date.now()) {
        return errorResponse(404, "Invite is invalid or expired.", undefined, { headers: corsHeaders });
      }

      await supabaseAdmin.from("circle_members").upsert({
        circle_id: data.circle_id,
        user_id: user.id,
        role: "member",
        status: "active",
      });
      await upsertCircleChatParticipant(await getCircleChatId(String(data.circle_id)), user.id, "member");
      await supabaseAdmin.from("circle_invites").update({ use_count: Number(data.use_count || 0) + 1 }).eq("id", data.id);
      return json({ success: true, circleId: data.circle_id }, { headers: corsHeaders });
    }

    if (action === "ensureCircleChat") {
      if (!user) return errorResponse(401, "Authentication required.", undefined, { headers: corsHeaders });
      const circleId = String(body?.circleId || "");
      await requireCircleRole(circleId, user.id);

      const { data: circle, error: circleError } = await supabaseAdmin
        .from("circles")
        .select("id, name, image, creator_id")
        .eq("id", circleId)
        .maybeSingle();
      if (circleError) throw circleError;
      if (!circle) return errorResponse(404, "Circle not found.", undefined, { headers: corsHeaders });

      let chatId = await getCircleChatId(circleId);
      if (!chatId) {
        const { data: newChat, error: createChatError } = await supabaseAdmin
          .from("chats")
          .insert({
            type: "group",
            name: String(circle.name || "Circle chat"),
            avatar: String(circle.image || ""),
            circle_id: circleId,
            created_by: circle.creator_id || user.id,
            is_active: true,
          })
          .select("id")
          .single();
        if (createChatError) throw createChatError;
        chatId = String(newChat.id || "");
      }

      const { data: members, error: membersError } = await supabaseAdmin
        .from("circle_members")
        .select("user_id, role")
        .eq("circle_id", circleId)
        .eq("status", "active");
      if (membersError) throw membersError;

      for (const member of members || []) {
        await upsertCircleChatParticipant(
          chatId,
          String(member.user_id || ""),
          ["creator", "admin"].includes(String(member.role || "")) ? "admin" : "member",
        );
      }

      return json({ chatId }, { headers: corsHeaders });
    }

    if (action === "resolveAppInvite") {
      const tokenValue = String(body?.token || "");
      const tokenHash = await hashValue(tokenValue);
      const { data, error } = await supabaseAdmin
        .from("app_invites")
        .select("id, expires_at, max_uses, use_count, is_revoked")
        .eq("token_hash", tokenHash)
        .maybeSingle();
      if (error) throw error;
      const valid = !!data && !data.is_revoked && Number(data.use_count || 0) < Number(data.max_uses || 0) && Date.parse(String(data.expires_at || "")) > Date.now();
      return json({ valid }, { headers: corsHeaders });
    }

    if (action === "consumeAppInvite") {
      if (!user) return errorResponse(401, "Authentication required.", undefined, { headers: corsHeaders });
      const tokenValue = String(body?.token || "");
      const tokenHash = await hashValue(tokenValue);
      const { data, error } = await supabaseAdmin.from("app_invites").select("*").eq("token_hash", tokenHash).maybeSingle();
      if (error) throw error;
      if (!data || data.is_revoked || Number(data.use_count || 0) >= Number(data.max_uses || 0) || Date.parse(String(data.expires_at || "")) < Date.now()) {
        return errorResponse(404, "Invite is invalid or expired.", undefined, { headers: corsHeaders });
      }
      await supabaseAdmin.from("app_invites").update({ use_count: Number(data.use_count || 0) + 1 }).eq("id", data.id);
      return json({ success: true }, { headers: corsHeaders });
    }

    if (action === "manageMember") {
      if (!user) return errorResponse(401, "Authentication required.", undefined, { headers: corsHeaders });
      const circleId = String(body?.circleId || "");
      const targetUid = String(body?.targetUid || "");
      const memberAction = String(body?.actionType || body?.memberAction || body?.action || "");
      const requesterRole = await requireCircleRole(circleId, user.id);
      if (!canModerate(requesterRole)) return errorResponse(403, "Missing moderation permission.", undefined, { headers: corsHeaders });

      if (memberAction === "remove" || memberAction === "kick") {
        const chatId = await getCircleChatId(circleId);
        await supabaseAdmin.from("circle_members").delete().eq("circle_id", circleId).eq("user_id", targetUid);
        await removeCircleChatParticipant(chatId, targetUid);
      } else if (memberAction === "promote_moderator" || memberAction === "promote_mod") {
        await supabaseAdmin.from("circle_members").update({ role: "moderator" }).eq("circle_id", circleId).eq("user_id", targetUid);
      } else if (memberAction === "demote_member" || memberAction === "demote") {
        await supabaseAdmin.from("circle_members").update({ role: "member" }).eq("circle_id", circleId).eq("user_id", targetUid);
      } else if (memberAction === "promote_admin") {
        if (!canAdmin(requesterRole)) return errorResponse(403, "Only admins can promote other admins.", undefined, { headers: corsHeaders });
        await supabaseAdmin.from("circle_members").update({ role: "admin" }).eq("circle_id", circleId).eq("user_id", targetUid);
      } else if (memberAction === "ban") {
        const chatId = await getCircleChatId(circleId);
        await supabaseAdmin.from("circle_members").delete().eq("circle_id", circleId).eq("user_id", targetUid);
        await removeCircleChatParticipant(chatId, targetUid);
      } else {
        return errorResponse(400, "Unsupported member action.", undefined, { headers: corsHeaders });
      }
      return json({ success: true }, { headers: corsHeaders });
    }

    if (action === "handleJoinRequest") {
      if (!user) return errorResponse(401, "Authentication required.", undefined, { headers: corsHeaders });
      const circleId = String(body?.circleId || "");
      const targetUid = String(body?.targetUid || "");
      const resolution = String(body?.requestAction || body?.action || "");
      const role = await requireCircleRole(circleId, user.id);
      if (!canModerate(role)) return errorResponse(403, "Missing moderation permission.", undefined, { headers: corsHeaders });

      if (resolution === "approve" || resolution === "accept") {
        const chatId = await getCircleChatId(circleId);
        await supabaseAdmin.from("circle_members").upsert({
          circle_id: circleId,
          user_id: targetUid,
          role: "member",
          status: "active",
        });
        await upsertCircleChatParticipant(chatId, targetUid, "member");
        await supabaseAdmin.from("circle_join_requests").update({
          status: "approved",
          resolved_at: new Date().toISOString(),
          resolved_by: user.id,
        }).eq("circle_id", circleId).eq("user_id", targetUid);
      } else if (resolution === "reject" || resolution === "decline") {
        await supabaseAdmin.from("circle_join_requests").update({
          status: "rejected",
          resolved_at: new Date().toISOString(),
          resolved_by: user.id,
        }).eq("circle_id", circleId).eq("user_id", targetUid);
      } else {
        return errorResponse(400, "Unsupported request action.", undefined, { headers: corsHeaders });
      }
      return json({ success: true }, { headers: corsHeaders });
    }

    if (action === "resolveCircleReport") {
      if (!user) return errorResponse(401, "Authentication required.", undefined, { headers: corsHeaders });
      const circleId = String(body?.circleId || "");
      const reportId = String(body?.reportId || "");
      const resolutionAction = String(body?.resolutionAction || body?.action || "");
      const resolutionNote = String(body?.resolutionNote || "");
      const role = await requireCircleRole(circleId, user.id);
      if (!canModerate(role)) return errorResponse(403, "Missing moderation permission.", undefined, { headers: corsHeaders });

      const { error } = await supabaseAdmin.from("circle_reports").update({
        status: "resolved",
        resolution_action: resolutionAction,
        resolution_note: resolutionNote,
        resolved_at: new Date().toISOString(),
        resolved_by: user.id,
      }).eq("id", reportId);
      if (error) throw error;
      return json({ success: true }, { headers: corsHeaders });
    }

    if (action === "submitReport") {
      if (!user) return errorResponse(401, "Authentication required.", undefined, { headers: corsHeaders });
      const circleId = String(body?.circleId || "");
      const targetId = String(body?.targetId || "");
      const targetType = String(body?.targetType || "member");
      const reason = String(body?.reason || "");
      const description = String(body?.description || "");

      const { error } = await supabaseAdmin.from("circle_reports").insert({
        circle_id: circleId,
        reporter_uid: user.id,
        target_id: targetId || null,
        target_type: targetType,
        reason,
        description,
      });
      if (error) throw error;
      return json({ success: true }, { headers: corsHeaders });
    }

    if (action === "scheduleHuddle") {
      if (!user) return errorResponse(401, "Authentication required.", undefined, { headers: corsHeaders });
      const circleId = String(body?.circleId || "");
      const title = String(body?.title || "Scheduled huddle").trim();
      const scheduledAt = String(body?.scheduledAt || "");
      const role = await requireCircleRole(circleId, user.id);
      if (!canModerate(role)) return errorResponse(403, "Missing scheduling permission.", undefined, { headers: corsHeaders });

      const chatId = await getCircleChatId(circleId);
      const { data, error } = await supabaseAdmin
        .from("scheduled_huddles")
        .insert({
          circle_id: circleId,
          chat_id: chatId || null,
          title: title || "Scheduled huddle",
          scheduled_at: scheduledAt,
          created_by: user.id,
        })
        .select("*")
        .single();
      if (error) throw error;
      return json({ id: data.id, ...data }, { headers: corsHeaders });
    }

    if (action === "toggleScheduledHuddleReminder") {
      if (!user) return errorResponse(401, "Authentication required.", undefined, { headers: corsHeaders });
      const circleId = String(body?.circleId || "");
      const eventId = String(body?.eventId || "");
      const enabled = !!body?.enabled;
      const role = await requireCircleRole(circleId, user.id);
      if (!canModerate(role)) return errorResponse(403, "Missing scheduling permission.", undefined, { headers: corsHeaders });
      const { error } = await supabaseAdmin.from("scheduled_huddles").update({ reminder_enabled: enabled }).eq("id", eventId).eq("circle_id", circleId);
      if (error) throw error;
      return json({ success: true }, { headers: corsHeaders });
    }

    if (action === "deleteScheduledHuddle") {
      if (!user) return errorResponse(401, "Authentication required.", undefined, { headers: corsHeaders });
      const circleId = String(body?.circleId || "");
      const eventId = String(body?.eventId || "");
      const role = await requireCircleRole(circleId, user.id);
      if (!canModerate(role)) return errorResponse(403, "Missing scheduling permission.", undefined, { headers: corsHeaders });
      const { error } = await supabaseAdmin.from("scheduled_huddles").delete().eq("id", eventId).eq("circle_id", circleId);
      if (error) throw error;
      return json({ success: true }, { headers: corsHeaders });
    }

    if (action === "triggerDueScheduledHuddles") {
      if (!user) return errorResponse(401, "Authentication required.", undefined, { headers: corsHeaders });
      const circleId = String(body?.circleId || "");
      await requireCircleRole(circleId, user.id);
      const startWindow = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const endWindow = new Date(Date.now() + 30 * 1000).toISOString();
      const { data, error } = await supabaseAdmin
        .from("scheduled_huddles")
        .select("*")
        .eq("circle_id", circleId)
        .gte("scheduled_at", startWindow)
        .lte("scheduled_at", endWindow)
        .order("scheduled_at", { ascending: true });
      if (error) throw error;
      return json({ events: data || [] }, { headers: corsHeaders });
    }

    if (action === "listCircleRequests") {
      if (!user || !rls) return errorResponse(401, "Authentication required.", undefined, { headers: corsHeaders });
      const circleId = String(body?.circleId || "");
      const { data, error } = await rls
        .from("circle_join_requests")
        .select("*")
        .eq("circle_id", circleId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return json({ items: data || [] }, { headers: corsHeaders });
    }

    if (action === "listCircleReports") {
      if (!user || !rls) return errorResponse(401, "Authentication required.", undefined, { headers: corsHeaders });
      const circleId = String(body?.circleId || "");
      const { data, error } = await rls
        .from("circle_reports")
        .select("*")
        .eq("circle_id", circleId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return json({ items: data || [] }, { headers: corsHeaders });
    }

    return errorResponse(400, "Unsupported action.", undefined, { headers: corsHeaders });
  } catch (error) {
    if (error instanceof Response) return error;
    return errorResponse(500, error instanceof Error ? error.message : "Unable to manage circles.", undefined, { headers: corsHeaders });
  }
});
