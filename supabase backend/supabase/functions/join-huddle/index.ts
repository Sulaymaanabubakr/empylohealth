import { requireUser } from "../_shared/auth.ts";
import { writeAuditLog } from "../_shared/audit.ts";
import { resolveSubscriptionStatus } from "../_shared/billing.ts";
import { getChatMembership, sanitizeUuidArray } from "../_shared/chat.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { createDailyMeetingToken } from "../_shared/daily.ts";
import { ensureMissedHuddleStatus, markMissedHuddleStatus } from "../_shared/huddles.ts";
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

    const statusPayload = await resolveSubscriptionStatus(user.id) as Record<string, unknown>;
    const canJoin = Boolean((statusPayload?.capabilities as Record<string, unknown>)?.canJoinHuddles);
    const minutesRemaining = Number((statusPayload?.remaining as Record<string, unknown>)?.huddleMinutesRemaining || 0);
    if (!canJoin) {
      return errorResponse(403, "Your plan does not allow joining huddles.", { reasonCode: "cannot_join_huddles" }, { headers: corsHeaders });
    }
    if (minutesRemaining <= 0) {
      return errorResponse(403, "You do not have any huddle minutes remaining.", { reasonCode: "huddle_minutes_exhausted" }, { headers: corsHeaders });
    }

    const { data: huddle, error: huddleError } = await supabaseAdmin
      .from("huddles")
      .select("*")
      .eq("id", huddleId)
      .maybeSingle();
    if (huddleError) throw huddleError;
    if (!huddle) return errorResponse(404, "Huddle not found.", undefined, { headers: corsHeaders });
    if (!huddle.is_active || String(huddle.status) === "ended") {
      return errorResponse(409, "This huddle has already ended.", undefined, { headers: corsHeaders });
    }

    await getChatMembership(String(huddle.chat_id), user.id);

    const acceptedUserIds = Array.from(new Set([...sanitizeUuidArray(huddle.accepted_user_ids), user.id]));
    const activeUserIds = sanitizeUuidArray(huddle.active_user_ids);
    const invitedUserIds = sanitizeUuidArray(huddle.invited_user_ids).filter((id) => id !== user.id);
    const nextStatus = user.id !== String(huddle.started_by || "") && String(huddle.status || "ringing") === "ringing"
      ? "accepted"
      : String(huddle.status || "ringing");

    const { error: updateError } = await supabaseAdmin
      .from("huddles")
      .update({
        accepted_user_ids: acceptedUserIds,
        invited_user_ids: invitedUserIds,
        status: nextStatus,
        accepted_by: nextStatus === "accepted" ? user.id : huddle.accepted_by,
        accepted_at: nextStatus === "accepted" ? new Date().toISOString() : huddle.accepted_at,
        updated_at: new Date().toISOString(),
      })
      .eq("id", huddleId);
    if (updateError) throw updateError;

    await supabaseAdmin.from("huddle_participants").upsert({
      huddle_id: huddleId,
      user_id: user.id,
      role: user.id === String(huddle.started_by || "") ? "host" : "member",
      joined_at: null,
      left_at: null,
      declined_at: null,
      updated_at: new Date().toISOString(),
    });

    await supabaseAdmin.from("huddle_live_states").upsert({
      huddle_id: huddleId,
      chat_id: huddle.chat_id,
      host_uid: huddle.started_by,
      state: activeUserIds.length >= 1 ? "in-call" : "ringing",
      last_action: "join",
      updated_at: new Date().toISOString(),
    });

    const missedUpdate = await markMissedHuddleStatus({
      huddleId,
      receiverId: user.id,
      status: "accepted",
    }).catch(() => null);
    if (!missedUpdate) {
      await ensureMissedHuddleStatus({
        huddleId,
        chatId: String(huddle.chat_id || ""),
        callerId: huddle.started_by ? String(huddle.started_by) : null,
        receiverId: user.id,
        status: "accepted",
      });
    }

    const token = await createDailyMeetingToken({
      roomName: String(huddle.room_name || ""),
      userId: user.id,
      isOwner: false,
    });

    await writeAuditLog({
      userId: user.id,
      action: "huddle.joined",
      metadata: { huddleId },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
    });

    return json({
      success: true,
      huddleId,
      roomUrl: huddle.room_url,
      roomName: huddle.room_name,
      token,
      startedBy: huddle.started_by || null,
      grantedMinutes: minutesRemaining,
    }, { headers: corsHeaders });
  } catch (error) {
    if (error instanceof Response) return error;
    return errorResponse(500, error instanceof Error ? error.message : "Unable to join huddle.", undefined, { headers: corsHeaders });
  }
});
