import { requireUser } from "../_shared/auth.ts";
import { writeAuditLog } from "../_shared/audit.ts";
import { getChatMembership } from "../_shared/chat.ts";
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
    const chatId = String(body?.chatId || "").trim();
    if (!chatId) return errorResponse(400, "chatId is required.", undefined, { headers: corsHeaders });

    await getChatMembership(chatId, user.id);

    const now = new Date().toISOString();
    const { error } = await supabaseAdmin
      .from("chat_participants")
      .update({ left_at: now, updated_at: now })
      .eq("chat_id", chatId)
      .eq("user_id", user.id);

    if (error) throw error;

    const { data: remaining, error: remainingError } = await supabaseAdmin
      .from("chat_participants")
      .select("user_id")
      .eq("chat_id", chatId)
      .is("left_at", null);
    if (remainingError) throw remainingError;

    if (!remaining || remaining.length === 0) {
      await supabaseAdmin.from("chats").update({ is_active: false, updated_at: now }).eq("id", chatId);
    }

    await writeAuditLog({
      userId: user.id,
      action: "chat.deleted",
      metadata: { chatId },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
    });

    return json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    if (error instanceof Response) return error;
    return errorResponse(500, error instanceof Error ? error.message : "Unable to delete chat.", undefined, { headers: corsHeaders });
  }
});
