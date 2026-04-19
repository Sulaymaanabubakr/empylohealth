import { requireUser } from "../_shared/auth.ts";
import { writeAuditLog } from "../_shared/audit.ts";
import { getChatMembership } from "../_shared/chat.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { createPendingMissedHuddles } from "../_shared/huddles.ts";
import { sendExpoPushNotifications } from "../_shared/push.ts";
import { getIpAddress, getUserAgent } from "../_shared/request.ts";
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
    const { user } = await requireUser(req);
    const body = await parseBody(req);
    const huddleId = String(body?.huddleId || "").trim();
    if (!huddleId) return errorResponse(400, "Huddle ID required.", undefined, { headers: corsHeaders });

    const { data: huddle, error: huddleError } = await supabaseAdmin.from("huddles").select("*").eq("id", huddleId).maybeSingle();
    if (huddleError) throw huddleError;
    if (!huddle) return errorResponse(404, "Huddle not found.", undefined, { headers: corsHeaders });

    await getChatMembership(String(huddle.chat_id), user.id);
    if (String(huddle.started_by || "") !== user.id) {
      return errorResponse(403, "Only the caller can trigger ringing.", undefined, { headers: corsHeaders });
    }
    if (!huddle.is_active || String(huddle.status || "") !== "ringing") {
      return json({ success: true, skipped: true }, { headers: corsHeaders });
    }

    const lastRingAt = huddle.last_ring_sent_at ? new Date(String(huddle.last_ring_sent_at)).getTime() : 0;
    if (Date.now() - lastRingAt < 8000) {
      return json({ success: true, skipped: true, reason: "rate-limited" }, { headers: corsHeaders });
    }

    const now = new Date().toISOString();
    await supabaseAdmin.from("huddles").update({
      last_ring_sent_at: now,
      ring_count: Number(huddle.ring_count || 0) + 1,
      updated_at: now,
    }).eq("id", huddleId);

    const recipientIds = Array.isArray(huddle.invited_user_ids)
      ? huddle.invited_user_ids.map((item: unknown) => String(item))
      : [];

    if (recipientIds.length) {
      await createPendingMissedHuddles({
        huddleId,
        chatId: String(huddle.chat_id),
        callerId: user.id,
        receiverIds: recipientIds,
      });

      const [{ data: sender }, { data: chat }] = await Promise.all([
        supabaseAdmin.from("profiles").select("name, photo_url").eq("id", user.id).maybeSingle(),
        supabaseAdmin.from("chats").select("name, avatar").eq("id", String(huddle.chat_id)).maybeSingle(),
      ]);
      const callerAvatar = sender?.photo_url || "";
      const chatAvatar = chat?.avatar || "";
      const displayAvatar = Boolean(huddle.is_group) ? (chatAvatar || callerAvatar) : (callerAvatar || chatAvatar);

      await sendExpoPushNotifications({
        userIds: recipientIds,
        type: "HUDDLE_STARTED",
        title: `${sender?.name || "Someone"} is calling again`,
        body: `Tap to join ${chat?.name || "the huddle"}`,
        avatar: displayAvatar,
        data: {
          type: "HUDDLE_STARTED",
          huddleId,
          chatId: String(huddle.chat_id),
          chatName: chat?.name || "Huddle",
          callerName: sender?.name || "Someone",
          callerAvatar,
          chatAvatar,
          groupAvatar: chatAvatar,
          senderId: user.id,
          isGroup: Boolean(huddle.is_group),
        },
        categoryId: "huddle-call-actions",
        channelId: "huddle-calls-ringtone",
      }).catch((pushError) => {
        console.warn("[ring-huddle-participants] push send failed", pushError);
      });
    }

    await writeAuditLog({
      userId: user.id,
      action: "huddle.ring",
      metadata: { huddleId, ringCount: Number(huddle.ring_count || 0) + 1 },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
    });

    return json({ success: true, notified: Array.isArray(huddle.invited_user_ids) ? huddle.invited_user_ids.length : 0 }, { headers: corsHeaders });
  } catch (error) {
    if (error instanceof Response) return error;
    return errorResponse(500, error instanceof Error ? error.message : "Unable to ring huddle participants.", undefined, { headers: corsHeaders });
  }
});
