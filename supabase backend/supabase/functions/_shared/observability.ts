import { supabaseAdmin } from "./supabase.ts";

type ObservabilityInput = {
  userId?: string | null;
  organisationId?: string | null;
  eventType: string;
  severity?: "info" | "warning" | "error";
  metricName?: string | null;
  metricValue?: number | null;
  metadata?: Record<string, unknown>;
};

export const writeObservabilityEvent = async ({
  userId = null,
  organisationId = null,
  eventType,
  severity = "info",
  metricName = null,
  metricValue = null,
  metadata = {},
}: ObservabilityInput) => {
  const { error } = await supabaseAdmin.from("observability_events").insert({
    user_id: userId,
    organisation_id: organisationId,
    event_type: eventType,
    severity,
    metric_name: metricName,
    metric_value: metricValue,
    metadata,
  });

  if (error) {
    console.error("[observability] failed", { eventType, error: error.message });
  }
};
