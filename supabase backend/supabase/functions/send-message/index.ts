import { requireUser } from "../_shared/auth.ts";
import { writeAuditLog } from "../_shared/audit.ts";
import { getChatMembership, updateChatLastMessage } from "../_shared/chat.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { createStoredNotifications, loadProfilesForUsers, sendExpoPushNotifications } from "../_shared/push.ts";
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
    const chatId = String(body?.chatId || "").trim();
    const text = String(body?.text || "");
    const type = String(body?.type || "text").trim() || "text";
    const mediaUrl = body?.mediaUrl ? String(body.mediaUrl) : null;
    const clientMessageId = body?.clientMessageId ? String(body.clientMessageId) : null;

    if (!chatId) return errorResponse(400, "chatId is required.", undefined, { headers: corsHeaders });
    if (!text.trim() && !mediaUrl) {
      return errorResponse(400, "Message content is required.", undefined, { headers: corsHeaders });
    }

    const { chat } = await getChatMembership(chatId, user.id);

    const insertPayload = {
      chat_id: chatId,
      sender_id: user.id,
      text,
      type,
      media_url: mediaUrl,
      client_message_id: clientMessageId,
      visible_to: [] as string[],
      metadata: {},
    };

    const { data: message, error: messageError } = await supabaseAdmin
      .from("messages")
      .insert(insertPayload)
      .select("id, created_at")
      .single();

    if (messageError || !message) throw messageError || new Error("Unable to send message.");

    await updateChatLastMessage({
      chatId,
      text,
      type,
      senderId: user.id,
      createdAt: String(message.created_at),
    });

    await supabaseAdmin
      .from("chat_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("chat_id", chatId)
      .eq("user_id", user.id);

    const backgroundTask = (async () => {
      const { data: participantRows, error: participantError } = await supabaseAdmin
        .from("chat_participants")
        .select("user_id, is_muted")
        .eq("chat_id", chatId)
        .is("left_at", null);
      if (participantError) throw participantError;

      const recipientRows = (participantRows || []).filter((row) => String(row.user_id) !== user.id);
      const recipientIds = recipientRows.map((row) => String(row.user_id));

      if (recipientIds.length) {
        const profiles = await loadProfilesForUsers([user.id, ...recipientIds]);
        const senderProfile = profiles.find((profile) => String(profile.id) === user.id);
        const chatTitle = chat.type === "group" ? (chat.name || "Group chat") : (senderProfile?.name || "New message");
        const messageBody = text.trim() || (type === "image" ? "Sent an image" : "Sent a message");
        const notificationBody = chat.type === "group"
          ? `${senderProfile?.name || "Someone"}: ${messageBody}`
          : messageBody;

        await createStoredNotifications({
          userIds: recipientIds,
          type: "CHAT_MESSAGE",
          title: chatTitle,
          body: notificationBody,
          avatar: senderProfile?.photo_url || chat.avatar || "",
          data: {
            type: "CHAT_MESSAGE",
            chatId,
            senderId: user.id,
            senderName: senderProfile?.name || "Someone",
            chatName: chat.name || "",
            isGroup: chat.type === "group" || Boolean(chat.circle_id),
            messageId: message.id,
          },
        });

        const mutedByUserId = new Map(
          recipientRows.map((row) => [String(row.user_id), Boolean(row.is_muted)]),
        );

        await Promise.all(recipientIds.map(async (recipientId) => {
          await sendExpoPushNotifications({
            userIds: [recipientId],
            type: "CHAT_MESSAGE",
            title: chatTitle,
            body: notificationBody,
            avatar: senderProfile?.photo_url || chat.avatar || "",
            data: {
              type: "CHAT_MESSAGE",
              chatId,
              senderId: user.id,
              senderName: senderProfile?.name || "Someone",
              chatName: chat.name || "",
              isGroup: chat.type === "group" || Boolean(chat.circle_id),
              messageId: message.id,
            },
            categoryId: "chat-message-actions",
            channelId: mutedByUserId.get(recipientId) ? "messages-silent" : "messages-default",
            sound: mutedByUserId.get(recipientId) ? null : "default",
          }).catch((pushError) => {
            console.warn("[send-message] push send failed", pushError);
          });
        }));
      }

      await writeAuditLog({
        userId: user.id,
        action: "chat.message.sent",
        metadata: { chatId, messageId: message.id, type },
        ipAddress: getIpAddress(req),
        userAgent: getUserAgent(req),
      });
    })().catch((backgroundError) => {
      console.warn("[send-message] background work failed", backgroundError);
    });

    const edgeRuntime = (globalThis as typeof globalThis & {
      EdgeRuntime?: { waitUntil?: (promise: Promise<unknown>) => void };
    }).EdgeRuntime;
    if (edgeRuntime?.waitUntil) {
      edgeRuntime.waitUntil(backgroundTask);
    }

    return json({ success: true, messageId: message.id }, { headers: corsHeaders });
  } catch (error) {
    if (error instanceof Response) return error;
    return errorResponse(500, error instanceof Error ? error.message : "Unable to send message.", undefined, { headers: corsHeaders });
  }
});
