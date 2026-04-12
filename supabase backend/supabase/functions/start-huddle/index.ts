import { requireUser } from "../_shared/auth.ts";
import { writeAuditLog } from "../_shared/audit.ts";
import { writeAnalyticsEvent } from "../_shared/analytics.ts";
import { consumeHuddleStart, resolveSubscriptionStatus, revertHuddleStart } from "../_shared/billing.ts";
import { getChatMembership, listActiveParticipantIds } from "../_shared/chat.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { createDailyMeetingToken, createDailyRoom } from "../_shared/daily.ts";
import { createStoredNotifications, loadProfilesForUsers, sendExpoPushNotifications } from "../_shared/push.ts";
import { getIpAddress, getUserAgent } from "../_shared/request.ts";
import { errorResponse, json } from "../_shared/response.ts";
import { supabaseAdmin } from "../_shared/supabase.ts";
import { writeObservabilityEvent } from "../_shared/observability.ts";

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
  let startAttemptId: string | null = null;
  let startConsumed = false;
  let currentUserId: string | null = null;

  try {
    const { user } = await requireUser(req);
    currentUserId = user.id;
    const body = await parseBody(req);
    const chatId = String(body?.chatId || "").trim();
    const isGroup = Boolean(body?.isGroup);
    if (!chatId) return errorResponse(400, "Chat ID required.", undefined, { headers: corsHeaders });
    startAttemptId = crypto.randomUUID();

    const status = await resolveSubscriptionStatus(user.id) as Record<string, unknown>;
    const { chat } = await getChatMembership(chatId, user.id);
    const participants = await listActiveParticipantIds(chatId);

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("huddles")
      .select("id, room_url, room_name, started_by, status, is_active")
      .eq("chat_id", chatId)
      .eq("is_active", true)
      .neq("status", "ended")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existingError) throw existingError;

    if (existing) {
      const token = await createDailyMeetingToken({
        roomName: String(existing.room_name),
        userId: user.id,
        isOwner: String(existing.started_by || "") === user.id,
      });
      return json({
        success: true,
        huddleId: existing.id,
        roomUrl: existing.room_url,
        roomName: existing.room_name,
        token,
        startedBy: existing.started_by || null,
      }, { headers: corsHeaders });
    }

    const startGuard = await consumeHuddleStart(user.id, startAttemptId);
    startConsumed = Boolean(startGuard?.allowed);
    if (!startGuard?.allowed) {
      return errorResponse(403, String(startGuard?.message || "You cannot start a huddle right now."), {
        reasonCode: startGuard?.reasonCode || "huddle_not_allowed",
      }, { headers: corsHeaders });
    }

    const recipients = participants.filter((id) => id !== user.id);
    const { roomName, roomUrl } = await createDailyRoom(chatId);
    const token = await createDailyMeetingToken({
      roomName,
      userId: user.id,
      isOwner: true,
    });

    const huddlePayload = {
      chat_id: chatId,
      circle_id: chat.circle_id,
      room_url: roomUrl,
      room_name: roomName,
      type: isGroup ? "group" : "p2p",
      created_by: user.id,
      started_by: user.id,
      is_group: isGroup,
      is_active: true,
      status: "ringing",
      invited_user_ids: recipients,
      accepted_user_ids: [user.id],
      declined_user_ids: [],
      active_user_ids: [],
      ring_started_at: new Date().toISOString(),
    };

    const { data: huddle, error: huddleError } = await supabaseAdmin
      .from("huddles")
      .insert(huddlePayload)
      .select("id")
      .single();
    if (huddleError || !huddle) throw huddleError || new Error("Unable to create huddle.");

    await supabaseAdmin.from("huddle_participants").insert(
      participants.map((participantId) => ({
        huddle_id: huddle.id,
        user_id: participantId,
        role: participantId === user.id ? "host" : "member",
        joined_at: participantId === user.id ? new Date().toISOString() : null,
      })),
    );

    await supabaseAdmin.from("huddle_live_states").upsert({
      huddle_id: huddle.id,
      chat_id: chatId,
      host_uid: user.id,
      state: "ringing",
      last_action: "start",
      updated_at: new Date().toISOString(),
    });

    await supabaseAdmin.from("messages").insert({
      chat_id: chatId,
      sender_id: user.id,
      text: "📞 Started a Huddle",
      type: "system",
      system_kind: "huddle_started",
      metadata: { huddleId: huddle.id, roomUrl },
    });

    if (recipients.length) {
      const profiles = await loadProfilesForUsers([user.id]);
      const starter = profiles.find((profile) => String(profile.id) === user.id);
      const chatName = chat.name || starter?.name || "Huddle";
      const notificationTitle = starter?.name ? `${starter.name} started a huddle` : "Incoming huddle";
      const notificationBody = isGroup
        ? `Join ${chatName}`
        : "Tap to join the call";

      await createStoredNotifications({
        userIds: recipients,
        type: "HUDDLE_STARTED",
        title: notificationTitle,
        body: notificationBody,
        avatar: starter?.photo_url || chat.avatar || "",
        data: {
          type: "HUDDLE_STARTED",
          huddleId: huddle.id,
          chatId,
          chatName,
          callerName: starter?.name || "Someone",
          senderId: user.id,
          isGroup,
        },
      });

      await sendExpoPushNotifications({
        userIds: recipients,
        type: "HUDDLE_STARTED",
        title: notificationTitle,
        body: notificationBody,
        avatar: starter?.photo_url || chat.avatar || "",
        data: {
          type: "HUDDLE_STARTED",
          huddleId: huddle.id,
          chatId,
          chatName,
          callerName: starter?.name || "Someone",
          senderId: user.id,
          isGroup,
        },
        categoryId: "huddle-call-actions",
        channelId: "huddle-calls",
      }).catch((pushError) => {
        console.warn("[start-huddle] push send failed", pushError);
      });
    }

    await writeAuditLog({
      userId: user.id,
      action: "huddle.started",
      metadata: { huddleId: huddle.id, chatId },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
    });
    await writeAnalyticsEvent({
      userId: user.id,
      eventType: "huddle.started",
      planId: String((status?.entitlement as Record<string, unknown>)?.plan || ""),
      metadata: { huddleId: huddle.id, chatId },
    });
    await writeObservabilityEvent({
      userId: user.id,
      eventType: "huddle.active",
      metricName: "active_huddles",
      metricValue: 1,
      metadata: { huddleId: huddle.id, chatId, phase: "start" },
    });

    return json({
      success: true,
      huddleId: huddle.id,
      roomUrl,
      roomName,
      token,
      startedBy: user.id,
      grantedMinutes: Number(startGuard?.grantedMinutes || 0),
      maxMinutesPerHuddle: Number(startGuard?.maxMinutesPerHuddle || 0),
    }, { headers: corsHeaders });
  } catch (error) {
    try {
      if (startConsumed && currentUserId && startAttemptId) {
        await revertHuddleStart(currentUserId, startAttemptId);
      }
    } catch {
      // Ignore rollback failures in error path.
    }
    if (error instanceof Response) return error;
    return errorResponse(500, error instanceof Error ? error.message : "Unable to start huddle.", undefined, { headers: corsHeaders });
  }
});
