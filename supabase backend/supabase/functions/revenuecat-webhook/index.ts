import { applyRevenueCatWebhookEvent } from "../_shared/revenuecat.ts";
import { claimIdempotency, completeIdempotency, failIdempotency } from "../_shared/billing.ts";
import { writeObservabilityEvent } from "../_shared/observability.ts";

const jsonHeaders = {
  "Content-Type": "application/json",
};

const hashPayload = async (payload: unknown) => {
  const data = new TextEncoder().encode(JSON.stringify(payload || {}));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

const errorJson = (status: number, message: string) =>
  new Response(JSON.stringify({ success: false, message }), {
    status,
    headers: jsonHeaders,
  });

Deno.serve(async (req) => {
  if (req.method !== "POST") return errorJson(405, "Method not allowed.");

  let eventId = "";
  try {
    const expectedSecret = Deno.env.get("REVENUECAT_WEBHOOK_AUTH") || "";
    if (!expectedSecret) {
      return errorJson(500, "REVENUECAT_WEBHOOK_AUTH is not configured.");
    }
    const authHeader = req.headers.get("authorization") || "";
    if (authHeader !== `Bearer ${expectedSecret}`) {
      return errorJson(401, "Unauthorized.");
    }

    const body = await req.json().catch(() => ({}));
    const event = body?.event && typeof body.event === "object" ? body.event : null;
    if (!event) {
      return errorJson(400, "Missing RevenueCat event payload.");
    }

    eventId = String(event?.id || "").trim();
    if (!eventId) {
      return errorJson(400, "Missing RevenueCat event id.");
    }

    const requestHash = await hashPayload(body);
    const idempotent = await claimIdempotency({
      scope: "revenuecat_webhook",
      userId: null,
      key: eventId,
      requestHash,
    });

    if (String(idempotent?.status || "") === "completed" && idempotent?.response) {
      return new Response(JSON.stringify({
        ...(idempotent.response as Record<string, unknown>),
        idempotentReplay: true,
      }), { status: 200, headers: jsonHeaders });
    }

    const result = await applyRevenueCatWebhookEvent(event);

    await completeIdempotency({
      scope: "revenuecat_webhook",
      key: eventId,
      response: result,
      resourceType: "revenuecat_event",
      resourceId: eventId,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: jsonHeaders,
    });
  } catch (error) {
    if (eventId) {
      await failIdempotency({
        scope: "revenuecat_webhook",
        key: eventId,
        response: { success: false, message: error instanceof Error ? error.message : "Unknown webhook failure." },
      }).catch(() => {});
    }
    await writeObservabilityEvent({
      eventType: "revenuecat.webhook_error",
      severity: "error",
      metadata: {
        message: error instanceof Error ? error.message : "Unknown webhook failure.",
      },
    }).catch(() => {});
    return errorJson(500, error instanceof Error ? error.message : "Unable to process RevenueCat webhook.");
  }
});
