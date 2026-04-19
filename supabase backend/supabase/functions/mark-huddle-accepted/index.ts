import { requireUser } from "../_shared/auth.ts";
import { getChatMembership, sanitizeUuidArray } from "../_shared/chat.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { ensureMissedHuddleStatus, markMissedHuddleStatus } from "../_shared/huddles.ts";
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

    const { data: huddle, error: huddleError } = await supabaseAdmin
      .from("huddles")
      .select("*")
      .eq("id", huddleId)
      .maybeSingle();
    if (huddleError) throw huddleError;
    if (!huddle) return errorResponse(404, "Huddle not found.", undefined, { headers: corsHeaders });
    if (!huddle.is_active || String(huddle.status || "") === "ended") {
      return errorResponse(409, "This huddle has already ended.", undefined, { headers: corsHeaders });
    }

    await getChatMembership(String(huddle.chat_id), user.id);

    const acceptedUserIds = Array.from(new Set([...sanitizeUuidArray(huddle.accepted_user_ids), user.id]));
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

    return json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    if (error instanceof Response) return error;
    return errorResponse(500, error instanceof Error ? error.message : "Unable to accept huddle.", undefined, { headers: corsHeaders });
  }
});
