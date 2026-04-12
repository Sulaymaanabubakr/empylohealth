import { requireUser } from "../_shared/auth.ts";
import { writeAuditLog } from "../_shared/audit.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
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
    const recipientId = String(body?.recipientId || "").trim();
    if (!recipientId || recipientId === user.id) {
      return errorResponse(400, "Recipient ID is invalid.", undefined, { headers: corsHeaders });
    }

    const { data: memberships, error: membershipError } = await supabaseAdmin
      .from("chat_participants")
      .select("chat_id, chats!inner(id, type, circle_id, is_active)")
      .eq("user_id", user.id)
      .is("left_at", null);

    if (membershipError) throw membershipError;

    for (const membership of memberships || []) {
      const chat = membership.chats as Record<string, unknown>;
      if (!chat || String(chat.type || "") !== "direct" || chat.circle_id) continue;

      const { data: participants, error: participantError } = await supabaseAdmin
        .from("chat_participants")
        .select("user_id")
        .eq("chat_id", String(membership.chat_id))
        .is("left_at", null);

      if (participantError) throw participantError;

      const ids = (participants || []).map((row) => String(row.user_id)).sort();
      const target = [String(user.id), recipientId].sort();
      if (ids.length === 2 && ids[0] === target[0] && ids[1] === target[1]) {
        return json({ chatId: membership.chat_id, existing: true }, { headers: corsHeaders });
      }
    }

    const { data: chat, error: chatError } = await supabaseAdmin
      .from("chats")
      .insert({
        type: "direct",
        created_by: user.id,
      })
      .select("id")
      .single();

    if (chatError || !chat) throw chatError || new Error("Unable to create chat.");

    const { error: participantInsertError } = await supabaseAdmin
      .from("chat_participants")
      .insert([
        { chat_id: chat.id, user_id: user.id, role: "member" },
        { chat_id: chat.id, user_id: recipientId, role: "member" },
      ]);

    if (participantInsertError) {
      await supabaseAdmin.from("chats").delete().eq("id", chat.id);
      throw participantInsertError;
    }

    await writeAuditLog({
      userId: user.id,
      action: "chat.direct.created",
      metadata: { chatId: chat.id, recipientId },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
    });

    return json({ chatId: chat.id, existing: false }, { headers: corsHeaders });
  } catch (error) {
    if (error instanceof Response) return error;
    return errorResponse(500, error instanceof Error ? error.message : "Unable to create direct chat.", undefined, { headers: corsHeaders });
  }
});
