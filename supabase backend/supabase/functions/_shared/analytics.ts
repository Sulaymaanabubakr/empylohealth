import { supabaseAdmin } from "./supabase.ts";

type AnalyticsInput = {
  userId?: string | null;
  organisationId?: string | null;
  eventType: string;
  planId?: string | null;
  amount?: number | null;
  amountGbp?: number | null;
  metadata?: Record<string, unknown>;
};

export const writeAnalyticsEvent = async ({
  userId = null,
  organisationId = null,
  eventType,
  planId = null,
  amount = null,
  amountGbp = null,
  metadata = {},
}: AnalyticsInput) => {
  const { error } = await supabaseAdmin.from("analytics_events").insert({
    user_id: userId,
    organisation_id: organisationId,
    event_type: eventType,
    plan_id: planId,
    amount,
    amount_gbp: amountGbp,
    metadata,
  });

  if (error) {
    console.error("[analytics] failed", { eventType, error: error.message });
  }
};
