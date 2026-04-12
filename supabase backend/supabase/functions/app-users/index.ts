import { requireUser } from "../_shared/auth.ts";
import { writeAuditLog } from "../_shared/audit.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { errorResponse, json } from "../_shared/response.ts";
import { createRlsClient, supabaseAdmin } from "../_shared/supabase.ts";
import { getIpAddress, getUserAgent } from "../_shared/request.ts";

const parseBody = async (req: Request) => {
  try {
    return await req.json();
  } catch {
    return {};
  }
};

const toPublicProfile = (profile: Record<string, unknown> | null | undefined, uid: string) => ({
  uid,
  id: uid,
  name: String(profile?.name || "Member"),
  displayName: String(profile?.name || "Member"),
  photoURL: String(profile?.photo_url || ""),
  wellbeingScore: typeof profile?.wellbeing_score === "number" ? profile.wellbeing_score : null,
  wellbeingLabel: String(profile?.wellbeing_label || ""),
  streak: typeof profile?.streak === "number" ? profile.streak : 0,
  stats: profile?.stats || {},
});

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  if (req.method !== "POST") return errorResponse(405, "Method not allowed.", undefined, { headers: corsHeaders });

  try {
    const body = await parseBody(req);
    const action = String(body?.action || "");
    const { user, token } = await requireUser(req);
    const ipAddress = getIpAddress(req);
    const userAgent = getUserAgent(req);
    const rls = createRlsClient(token);

    if (action === "getPublicProfile") {
      const uid = String(body?.uid || "").trim();
      if (!uid) return errorResponse(400, "Missing profile id.", undefined, { headers: corsHeaders });

      const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("id, name, photo_url, wellbeing_score, wellbeing_label, streak, stats")
        .eq("id", uid)
        .maybeSingle();

      if (error) throw error;
      return json(toPublicProfile(data as Record<string, unknown> | null, uid), { headers: corsHeaders });
    }

    if (action === "blockUser" || action === "unblockUser") {
      const targetUid = String(body?.targetUid || "").trim();
      if (!targetUid || targetUid === user.id) {
        return errorResponse(400, "Invalid block target.", undefined, { headers: corsHeaders });
      }

      const { data: profile, error: profileError } = await rls
        .from("profiles")
        .select("blocked_user_ids")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      const current = Array.isArray(profile?.blocked_user_ids)
        ? profile.blocked_user_ids.map((item: unknown) => String(item))
        : [];
      const next = action === "blockUser"
        ? Array.from(new Set([...current, targetUid]))
        : current.filter((item: string) => item !== targetUid);

      const { error: updateError } = await rls
        .from("profiles")
        .update({ blocked_user_ids: next })
        .eq("id", user.id);
      if (updateError) throw updateError;

      await writeAuditLog({
        userId: user.id,
        action: action === "blockUser" ? "user.block" : "user.unblock",
        metadata: { targetUid },
        ipAddress,
        userAgent,
      });

      return json({ success: true, blockedUserIds: next }, { headers: corsHeaders });
    }

    if (action === "savePushToken") {
      const field = String(body?.field || "").trim();
      const tokenValue = String(body?.token || "").trim();
      const allowedFields = new Set(["expo_push_tokens", "fcm_tokens", "voip_push_tokens"]);
      if (!allowedFields.has(field) || !tokenValue) {
        return errorResponse(400, "Invalid push token request.", undefined, { headers: corsHeaders });
      }

      const { data: profile, error: profileError } = await rls
        .from("profiles")
        .select(field)
        .eq("id", user.id)
        .maybeSingle();
      if (profileError) throw profileError;

      const current = Array.isArray(profile?.[field]) ? profile[field].map((item: unknown) => String(item)) : [];
      const next = Array.from(new Set([...current, tokenValue]));

      const { error: updateError } = await rls
        .from("profiles")
        .update({ [field]: next })
        .eq("id", user.id);
      if (updateError) throw updateError;

      return json({ success: true }, { headers: corsHeaders });
    }

    return errorResponse(400, "Unsupported action.", undefined, { headers: corsHeaders });
  } catch (error) {
    if (error instanceof Response) return error;
    return errorResponse(500, error instanceof Error ? error.message : "Unable to complete user action.", undefined, { headers: corsHeaders });
  }
});
