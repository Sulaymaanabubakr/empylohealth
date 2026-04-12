import { requireUser } from "../_shared/auth.ts";
import { writeAuditLog } from "../_shared/audit.ts";
import { consumeHuddleMinutes } from "../_shared/billing.ts";
import { getChatMembership, sanitizeUuidArray } from "../_shared/chat.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
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

  try {
    const { user } = await requireUser(req);
    const body = await parseBody(req);
    const huddleId = String(body?.huddleId || "").trim();
    const action = String(body?.action || "").trim();

    if (!huddleId) return errorResponse(400, "Huddle ID required.", undefined, { headers: corsHeaders });
    if (!["daily_joined", "daily_left"].includes(action)) {
      return errorResponse(400, "Invalid action.", undefined, { headers: corsHeaders });
    }

    const { data: huddle, error: huddleError } = await supabaseAdmin.from("huddles").select("*").eq("id", huddleId).maybeSingle();
    if (huddleError) throw huddleError;
    if (!huddle) return errorResponse(404, "Huddle not found.", undefined, { headers: corsHeaders });

    await getChatMembership(String(huddle.chat_id), user.id);
    if (!huddle.is_active || String(huddle.status || "") === "ended") {
      return json({ success: true }, { headers: corsHeaders });
    }

    const previousActive = sanitizeUuidArray(huddle.active_user_ids);
    const { data: participantRow } = await supabaseAdmin
      .from("huddle_participants")
      .select("*")
      .eq("huddle_id", huddleId)
      .eq("user_id", user.id)
      .maybeSingle();
    const activeUserIds = action === "daily_joined"
      ? Array.from(new Set([...previousActive, user.id]))
      : previousActive.filter((id) => id !== user.id);

    const updatePayload: Record<string, unknown> = {
      active_user_ids: activeUserIds,
      updated_at: new Date().toISOString(),
    };

    const status = String(huddle.status || "ringing");
    if (activeUserIds.length >= 2 && (status === "ringing" || status === "accepted")) {
      updatePayload.status = "ongoing";
      updatePayload.ongoing_at = new Date().toISOString();
    } else if (activeUserIds.length === 0 && status === "ongoing") {
      updatePayload.status = "ended";
      updatePayload.is_active = false;
      updatePayload.ended_at = new Date().toISOString();
      updatePayload.ended_reason = "hangup";
    }

    const { error: updateError } = await supabaseAdmin.from("huddles").update(updatePayload).eq("id", huddleId);
    if (updateError) throw updateError;

    let graceExpiresAt: string | null = null;
    let minutesChargeResult: Record<string, unknown> | null = null;
    if (action === "daily_left" && participantRow?.joined_at && !participantRow?.left_at) {
      const connectedMs = Math.max(Date.now() - new Date(String(participantRow.joined_at)).getTime(), 0);
      const connectedSeconds = Math.max(Math.round(connectedMs / 1000), 0);
      const connectedMinutes = Math.max(Math.ceil(connectedSeconds / 60), 1);
      minutesChargeResult = await consumeHuddleMinutes(user.id, connectedMinutes, `${huddleId}:${user.id}:${participantRow.joined_at}`);
      if (!minutesChargeResult?.success && String(minutesChargeResult?.reasonCode || "") === "huddle_minutes_exhausted") {
        const now = new Date();
        const expiry = new Date(now.getTime() + 45 * 1000);
        graceExpiresAt = expiry.toISOString();
        await supabaseAdmin
          .from("huddle_participants")
          .update({
            grace_started_at: now.toISOString(),
            grace_expires_at: graceExpiresAt,
            disconnect_pending: true,
            metered_seconds: Number(participantRow?.metered_seconds || 0) + connectedSeconds,
            left_at: null,
          })
          .eq("huddle_id", huddleId)
          .eq("user_id", user.id);
      }
    }

    await supabaseAdmin.from("huddle_live_states").upsert({
      huddle_id: huddleId,
      chat_id: huddle.chat_id,
      host_uid: huddle.started_by,
      state: action === "daily_joined" ? "in-call" : activeUserIds.length === 0 ? "ended" : "ringing",
      last_action: action,
      updated_at: new Date().toISOString(),
    });

    await supabaseAdmin.from("huddle_participants").upsert({
      huddle_id: huddleId,
      user_id: user.id,
      role: user.id === String(huddle.started_by || "") ? "host" : "member",
      joined_at: action === "daily_joined" ? new Date().toISOString() : undefined,
      left_at: action === "daily_left" && !graceExpiresAt ? new Date().toISOString() : null,
      grace_started_at: action === "daily_joined" ? null : undefined,
      grace_expires_at: action === "daily_joined" ? null : undefined,
      disconnect_pending: action === "daily_joined" ? false : Boolean(graceExpiresAt),
      updated_at: new Date().toISOString(),
    });

    await writeAuditLog({
      userId: user.id,
      action: "huddle.connection_updated",
      metadata: { huddleId, actionType: action },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
    });
    await writeObservabilityEvent({
      userId: user.id,
      eventType: action === "daily_joined" ? "huddle.concurrent_user_joined" : "huddle.concurrent_user_left",
      metricName: "concurrent_huddle_users",
      metricValue: activeUserIds.length,
      metadata: { huddleId, action, activeUserIds },
    });

    return json({
      success: true,
      graceActive: Boolean(graceExpiresAt),
      graceExpiresAt,
      usage: minutesChargeResult,
    }, { headers: corsHeaders });
  } catch (error) {
    if (error instanceof Response) return error;
    return errorResponse(500, error instanceof Error ? error.message : "Unable to update huddle connection.", undefined, { headers: corsHeaders });
  }
});
