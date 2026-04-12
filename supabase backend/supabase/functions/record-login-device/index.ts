import { requireUser } from "../_shared/auth.ts";
import { writeAuditLog } from "../_shared/audit.ts";
import { getIpAddress, getUserAgent, readJson } from "../_shared/request.ts";
import { errorResponse, json } from "../_shared/response.ts";
import { createRlsClient, supabaseAdmin } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") return errorResponse(405, "Method not allowed.");

  try {
    const { token, user } = await requireUser(req);
    const body = await readJson<Record<string, unknown>>(req);
    const deviceId = String(body.deviceId || "").trim();
    if (!deviceId) return errorResponse(400, "deviceId is required.");

    const rls = createRlsClient(token);
    const payload = {
      user_id: user.id,
      device_id: deviceId,
      platform: String(body.platform || ""),
      model: String(body.model || ""),
      os_version: String(body.osVersion || ""),
      app_version: String(body.appVersion || ""),
      locale: String(body.locale || ""),
      last_seen_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await rls.from("user_devices").upsert(payload, { onConflict: "user_id,device_id" });
    if (error) throw error;

    await writeAuditLog({
      userId: user.id,
      action: "auth.login",
      metadata: { deviceId, platform: payload.platform },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
    });

    return json({ success: true });
  } catch (error) {
    if (error instanceof Response) return error;
    return errorResponse(500, error instanceof Error ? error.message : "Unable to record login device.");
  }
});
