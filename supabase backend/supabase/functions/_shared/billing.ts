import { supabaseAdmin } from "./supabase.ts";

const rpc = async <T = unknown>(fn: string, params: Record<string, unknown>) => {
  const { data, error } = await supabaseAdmin.rpc(fn, params);
  if (error) throw error;
  return data as T;
};

export const resolveSubscriptionStatus = async (userId: string) =>
  rpc<Record<string, unknown>>("resolve_subscription_status", { p_user_id: userId });

export const claimIdempotency = async ({
  scope,
  userId,
  key,
  requestHash,
}: {
  scope: string;
  userId: string | null;
  key: string;
  requestHash?: string | null;
}) =>
  rpc<Record<string, unknown>>("claim_idempotency", {
    p_scope: scope,
    p_user_id: userId,
    p_key: key,
    p_request_hash: requestHash || null,
  });

export const completeIdempotency = async ({
  scope,
  key,
  response,
  resourceType,
  resourceId,
}: {
  scope: string;
  key: string;
  response: Record<string, unknown>;
  resourceType?: string | null;
  resourceId?: string | null;
}) =>
  rpc("complete_idempotency", {
    p_scope: scope,
    p_key: key,
    p_response: response,
    p_resource_type: resourceType || null,
    p_resource_id: resourceId || null,
  });

export const failIdempotency = async ({
  scope,
  key,
  response,
}: {
  scope: string;
  key: string;
  response: Record<string, unknown>;
}) =>
  rpc("fail_idempotency", {
    p_scope: scope,
    p_key: key,
    p_response: response,
  });

export const consumeHuddleStart = async (userId: string, sourceId: string) =>
  rpc<Record<string, unknown>>("consume_huddle_start", {
    p_user_id: userId,
    p_source_id: sourceId,
  });

export const revertHuddleStart = async (userId: string, sourceId: string) =>
  rpc<Record<string, unknown>>("revert_huddle_start", {
    p_user_id: userId,
    p_source_id: sourceId,
  });

export const consumeHuddleMinutes = async (userId: string, minutes: number, sourceId: string) =>
  rpc<Record<string, unknown>>("consume_huddle_minutes", {
    p_user_id: userId,
    p_minutes: minutes,
    p_source_id: sourceId,
  });

export const reserveAiCredits = async ({
  userId,
  operationType,
  idempotencyKey,
  credits,
  requestPayload,
}: {
  userId: string;
  operationType: string;
  idempotencyKey: string;
  credits: number;
  requestPayload?: Record<string, unknown>;
}) =>
  rpc<Record<string, unknown>>("reserve_ai_credits", {
    p_user_id: userId,
    p_operation_type: operationType,
    p_idempotency_key: idempotencyKey,
    p_credits: credits,
    p_request_payload: requestPayload || {},
  });

export const finalizeAiCredits = async ({
  attemptId,
  sourceId,
  resultPayload,
}: {
  attemptId: string;
  sourceId: string;
  resultPayload?: Record<string, unknown>;
}) =>
  rpc<Record<string, unknown>>("finalize_ai_credits", {
    p_attempt_id: attemptId,
    p_source_id: sourceId,
    p_result_payload: resultPayload || {},
  });

export const releaseAiCredits = async ({
  attemptId,
  errorMessage,
  resultPayload,
}: {
  attemptId: string;
  errorMessage?: string | null;
  resultPayload?: Record<string, unknown>;
}) =>
  rpc<Record<string, unknown>>("release_ai_credits", {
    p_attempt_id: attemptId,
    p_error_message: errorMessage || null,
    p_result_payload: resultPayload || {},
  });

export const grantBoostPack = async ({
  userId,
  productId,
  purchaseEventId,
  metadata,
}: {
  userId: string;
  productId: string;
  purchaseEventId: string;
  metadata?: Record<string, unknown>;
}) =>
  rpc<Record<string, unknown>>("grant_boost_pack", {
    p_user_id: userId,
    p_product_id: productId,
    p_purchase_event_id: purchaseEventId,
    p_metadata: metadata || {},
  });

export const ensureBillingPeriod = async (userId: string) =>
  rpc<string>("ensure_billing_period", { p_user_id: userId });

export const listStoreProducts = async () => {
  const { data, error } = await supabaseAdmin
    .from("store_products")
    .select("*")
    .eq("is_active", true)
    .order("product_type", { ascending: true })
    .order("product_id", { ascending: true });
  if (error) throw error;
  return data || [];
};

export const listPlanCatalog = async () => {
  const { data, error } = await supabaseAdmin
    .from("plan_catalog")
    .select("*")
    .eq("is_active", true)
    .order("monthly_price_gbp", { ascending: true, nullsFirst: true });
  if (error) throw error;
  return data || [];
};
