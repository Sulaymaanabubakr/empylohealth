import { errorResponse } from "./response.ts";
import { supabaseAdmin } from "./supabase.ts";

type ChatRecord = {
  id: string;
  type: string;
  name: string;
  avatar: string;
  circle_id: string | null;
  is_active: boolean;
};

export const getChatMembership = async (chatId: string, userId: string) => {
  const { data, error } = await supabaseAdmin
    .from("chat_participants")
    .select("chat_id, user_id, role, is_muted, left_at, chats!inner(id, type, name, avatar, circle_id, is_active)")
    .eq("chat_id", chatId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw errorResponse(500, "Unable to load chat membership.");
  }

  if (!data || data.left_at) {
    throw errorResponse(403, "You do not have access to this chat.");
  }

  return {
    participant: data,
    chat: data.chats as unknown as ChatRecord,
  };
};

export const listActiveParticipantIds = async (chatId: string) => {
  const { data, error } = await supabaseAdmin
    .from("chat_participants")
    .select("user_id")
    .eq("chat_id", chatId)
    .is("left_at", null);

  if (error) {
    throw errorResponse(500, "Unable to load chat participants.");
  }

  return (data || []).map((row) => String(row.user_id));
};

export const updateChatLastMessage = async ({
  chatId,
  text,
  type,
  senderId,
  createdAt,
}: {
  chatId: string;
  text: string;
  type: string;
  senderId: string;
  createdAt?: string;
}) => {
  const { error } = await supabaseAdmin
    .from("chats")
    .update({
      last_message_text: text,
      last_message_type: type,
      last_message_sender_id: senderId,
      last_message_at: createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", chatId);

  if (error) {
    throw errorResponse(500, "Unable to update chat.");
  }
};

export const sanitizeUuidArray = (value: unknown) =>
  Array.isArray(value)
    ? value.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
