import { supabaseAdmin } from "./supabase.ts";

type HuddleRow = {
  id: string;
  chat_id: string;
  started_by: string | null;
  type: string | null;
  status: string | null;
  is_active: boolean | null;
  invited_user_ids: string[] | null;
  accepted_user_ids: string[] | null;
  declined_user_ids: string[] | null;
};

const toUserIdArray = (value: unknown) =>
  Array.isArray(value)
    ? value.map((item) => String(item || "").trim()).filter(Boolean)
    : [];

export const createPendingMissedHuddles = async ({
  huddleId,
  chatId,
  callerId,
  receiverIds,
}: {
  huddleId: string;
  chatId: string;
  callerId: string | null;
  receiverIds: string[];
}) => {
  const uniqueReceivers = Array.from(new Set(receiverIds.map((value) => String(value || "").trim()).filter(Boolean)));
  if (!uniqueReceivers.length) return;

  const rows = uniqueReceivers.map((receiverId) => ({
    huddle_id: huddleId,
    chat_id: chatId,
    caller_id: callerId,
    receiver_id: receiverId,
    status: "pending",
  }));

  const { error } = await supabaseAdmin
    .from("missed_huddles")
    .upsert(rows, { onConflict: "huddle_id,receiver_id", ignoreDuplicates: true });

  if (error) throw error;
};

export const markMissedHuddleStatus = async ({
  huddleId,
  receiverId,
  status,
}: {
  huddleId: string;
  receiverId: string;
  status: "accepted" | "declined" | "missed";
}) => {
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("missed_huddles")
    .update({
      status,
      handled_at: now,
    })
    .eq("huddle_id", huddleId)
    .eq("receiver_id", receiverId)
    .eq("status", "pending")
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return data || null;
};

export const ensureMissedHuddleStatus = async ({
  huddleId,
  chatId,
  callerId,
  receiverId,
  status,
}: {
  huddleId: string;
  chatId: string;
  callerId: string | null;
  receiverId: string;
  status: "accepted" | "declined" | "missed";
}) => {
  const now = new Date().toISOString();
  const { error } = await supabaseAdmin
    .from("missed_huddles")
    .upsert({
      huddle_id: huddleId,
      chat_id: chatId,
      caller_id: callerId,
      receiver_id: receiverId,
      status,
      handled_at: now,
    }, { onConflict: "huddle_id,receiver_id" });

  if (error) throw error;
};

export const resolveHuddleAfterRecipientHandled = async ({
  huddle,
  receiverId,
  reason,
}: {
  huddle: HuddleRow;
  receiverId: string;
  reason: "declined" | "missed";
}) => {
  const invited = toUserIdArray(huddle.invited_user_ids).filter((id) => id !== receiverId);
  const accepted = toUserIdArray(huddle.accepted_user_ids);
  const onlyHostAccepted = accepted.filter(Boolean).length <= 1;
  const shouldEnd = String(huddle.type || "p2p") === "p2p" || (invited.length === 0 && onlyHostAccepted);
  const now = new Date().toISOString();

  const updatePayload: Record<string, unknown> = {
    invited_user_ids: invited,
    updated_at: now,
  };

  if (shouldEnd) {
    updatePayload.is_active = false;
    updatePayload.status = "ended";
    updatePayload.ended_at = now;
    updatePayload.ended_reason = reason;
  }

  const { error: huddleError } = await supabaseAdmin
    .from("huddles")
    .update(updatePayload)
    .eq("id", huddle.id);
  if (huddleError) throw huddleError;

  const { error: liveError } = await supabaseAdmin
    .from("huddle_live_states")
    .upsert({
      huddle_id: huddle.id,
      chat_id: huddle.chat_id,
      host_uid: huddle.started_by,
      state: shouldEnd ? "ended" : "ringing",
      last_action: reason,
      updated_at: now,
    });
  if (liveError) throw liveError;

  return { shouldEnd };
};
