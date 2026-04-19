import { requireUser } from "../_shared/auth.ts";
import { writeAuditLog } from "../_shared/audit.ts";
import { getChatMembership, sanitizeUuidArray } from "../_shared/chat.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
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

    const { data: huddle, error: huddleError } = await supabaseAdmin.from("huddles").select("*").eq("id", huddleId).maybeSingle();
    if (huddleError) throw huddleError;
    if (!huddle) return errorResponse(404, "Huddle not found.", undefined, { headers: corsHeaders });

    await getChatMembership(String(huddle.chat_id), user.id);
    if (!huddle.is_active || String(huddle.status || "") === "ended") {
      return json({ success: true }, { headers: corsHeaders });
    }

    const declined = Array.from(new Set([...sanitizeUuidArray(huddle.declined_user_ids), user.id]));
    const invited = sanitizeUuidArray(huddle.invited_user_ids).filter((id) => id !== user.id);
    const accepted = sanitizeUuidArray(huddle.accepted_user_ids);
    const onlyHostAccepted = accepted.filter(Boolean).length <= 1;
    const shouldEnd = String(huddle.type || "p2p") === "p2p" || (invited.length === 0 && onlyHostAccepted);

    const updatePayload: Record<string, unknown> = {
      declined_user_ids: declined,
      invited_user_ids: invited,
      updated_at: new Date().toISOString(),
    };

    if (shouldEnd) {
      updatePayload.is_active = false;
      updatePayload.status = "ended";
      updatePayload.ended_by = user.id;
      updatePayload.ended_at = new Date().toISOString();
      updatePayload.ended_reason = "declined";
    }

    const { error: updateError } = await supabaseAdmin.from("huddles").update(updatePayload).eq("id", huddleId);
    if (updateError) throw updateError;

    await supabaseAdmin.from("huddle_participants").upsert({
      huddle_id: huddleId,
      user_id: user.id,
      role: user.id === String(huddle.started_by || "") ? "host" : "member",
      declined_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    await supabaseAdmin.from("huddle_live_states").upsert({
      huddle_id: huddleId,
      chat_id: huddle.chat_id,
      host_uid: huddle.started_by,
      state: shouldEnd ? "ended" : "ringing",
      last_action: "decline",
      updated_at: new Date().toISOString(),
    });

    const missedUpdate = await markMissedHuddleStatus({
      huddleId,
      receiverId: user.id,
      status: "declined",
    }).catch(() => null);
    if (!missedUpdate) {
      await ensureMissedHuddleStatus({
        huddleId,
        chatId: String(huddle.chat_id || ""),
        callerId: huddle.started_by ? String(huddle.started_by) : null,
        receiverId: user.id,
        status: "declined",
      });
    }

    await writeAuditLog({
      userId: user.id,
      action: "huddle.declined",
      metadata: { huddleId, ended: shouldEnd },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
    });

    return json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    if (error instanceof Response) return error;
    return errorResponse(500, error instanceof Error ? error.message : "Unable to decline huddle.", undefined, { headers: corsHeaders });
  }
});
