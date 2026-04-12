import { requireUser } from "../_shared/auth.ts";
import { writeAuditLog } from "../_shared/audit.ts";
import { writeAnalyticsEvent } from "../_shared/analytics.ts";
import { resolveSubscriptionStatus } from "../_shared/billing.ts";
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
    const reason = String(body?.reason || "hangup").trim() || "hangup";
    if (!huddleId) return errorResponse(400, "Huddle ID required.", undefined, { headers: corsHeaders });
    const status = await resolveSubscriptionStatus(user.id) as Record<string, unknown>;

    const { data: huddle, error: huddleError } = await supabaseAdmin.from("huddles").select("*").eq("id", huddleId).maybeSingle();
    if (huddleError) throw huddleError;
    if (!huddle) return json({ success: true, alreadyEnded: true }, { headers: corsHeaders });

    await getChatMembership(String(huddle.chat_id), user.id);

    if (!huddle.is_active || String(huddle.status || "") === "ended") {
      return json({ success: true, alreadyEnded: true }, { headers: corsHeaders });
    }

    const participants = sanitizeUuidArray(huddle.accepted_user_ids);
    const remaining = participants.filter((id) => id !== user.id);
    const shouldEndForEveryone = String(huddle.started_by || "") === user.id || remaining.length === 0;

    if (shouldEndForEveryone) {
      const now = new Date().toISOString();
      await supabaseAdmin
        .from("huddles")
        .update({
          is_active: false,
          status: "ended",
          ended_by: user.id,
          ended_at: now,
          ended_reason: reason,
          active_user_ids: [],
          updated_at: now,
        })
        .eq("id", huddleId);

      await supabaseAdmin.from("huddle_live_states").upsert({
        huddle_id: huddleId,
        chat_id: huddle.chat_id,
        host_uid: huddle.started_by,
        state: "ended",
        last_action: "end",
        updated_at: now,
      });
    } else {
      const now = new Date().toISOString();
      await supabaseAdmin
        .from("huddles")
        .update({
          accepted_user_ids: remaining,
          active_user_ids: sanitizeUuidArray(huddle.active_user_ids).filter((id) => id !== user.id),
          updated_at: now,
        })
        .eq("id", huddleId);
    }

    await supabaseAdmin.from("huddle_participants").upsert({
      huddle_id: huddleId,
      user_id: user.id,
      role: user.id === String(huddle.started_by || "") ? "host" : "member",
      left_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    await writeAuditLog({
      userId: user.id,
      action: "huddle.ended",
      metadata: { huddleId, reason, endedForEveryone: shouldEndForEveryone },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
    });
    await writeAnalyticsEvent({
      userId: user.id,
      eventType: "huddle.ended",
      planId: String((status?.entitlement as Record<string, unknown>)?.plan || ""),
      metadata: { huddleId, reason, endedForEveryone: shouldEndForEveryone },
    });
    await writeObservabilityEvent({
      userId: user.id,
      eventType: "huddle.ended",
      metricName: "active_huddles",
      metricValue: 0,
      metadata: { huddleId, reason, endedForEveryone: shouldEndForEveryone },
    });

    return json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    if (error instanceof Response) return error;
    return errorResponse(500, error instanceof Error ? error.message : "Unable to end huddle.", undefined, { headers: corsHeaders });
  }
});
