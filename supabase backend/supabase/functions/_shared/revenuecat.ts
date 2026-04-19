import { resolveSubscriptionStatus } from "./billing.ts";
import { supabaseAdmin } from "./supabase.ts";

const ACTIVE_PLAN_PRIORITY = ["premium", "pro"];

const toIsoString = (value: unknown) => {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" && Number.isFinite(value)) return new Date(value).toISOString();
  return null;
};

const toMillis = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

const normalizeProductIdCandidates = (productId: string) => {
  const normalized = String(productId || "").trim();
  if (!normalized) return [];
  const base = normalized.includes(":") ? normalized.split(":")[0] : normalized;
  return Array.from(new Set([normalized, base].filter(Boolean)));
};

const normalizePlatform = (storeOrPlatform: unknown) => {
  const value = String(storeOrPlatform || "").trim().toUpperCase();
  if (value.includes("PLAY")) return "android";
  if (value.includes("APP_STORE") || value.includes("APP STORE") || value === "IOS") return "ios";
  if (value === "ANDROID") return "android";
  return "unknown";
};

const findStoreProduct = async (productId: string) => {
  const candidates = normalizeProductIdCandidates(productId);
  for (const candidate of candidates) {
    const { data, error } = await supabaseAdmin
      .from("store_products")
      .select("*")
      .eq("product_id", candidate)
      .maybeSingle();
    if (error) throw error;
    if (data) return data;
  }
  return null;
};

const recordRevenueCatPurchaseEvent = async ({
  userId,
  productRow,
  eventType,
  platform,
  transactionId,
  originalTransactionId,
  payload,
}: {
  userId: string;
  productRow: Record<string, unknown>;
  eventType: string;
  platform: string;
  transactionId?: string | null;
  originalTransactionId?: string | null;
  payload: Record<string, unknown>;
}) => {
  if (!transactionId) return null;
  const { error } = await supabaseAdmin
    .from("purchase_events")
    .upsert({
      user_id: userId,
      platform,
      product_id: String(productRow.product_id || ""),
      product_type: "subscription",
      transaction_id: transactionId,
      original_transaction_id: originalTransactionId || null,
      idempotency_key: payload?.id ? String(payload.id) : null,
      status: "validated",
      payload,
      result: {
        source: "revenuecat",
        eventType,
      },
    }, { onConflict: "platform,transaction_id" });
  if (error) throw error;
  return transactionId;
};

const applyEntitlementUpdate = async ({
  userId,
  productRow,
  status,
  renewalAt,
  expiresAt,
  startedAt,
  eventTimestampMs,
  externalCustomerId,
  externalSubscriptionId,
  storeTransactionId,
  metadata,
}: {
  userId: string;
  productRow: Record<string, unknown>;
  status: "active" | "expired";
  renewalAt?: string | null;
  expiresAt?: string | null;
  startedAt?: string | null;
  eventTimestampMs?: number | null;
  externalCustomerId?: string | null;
  externalSubscriptionId?: string | null;
  storeTransactionId?: string | null;
  metadata?: Record<string, unknown>;
}) => {
  const { data: existing, error: existingError } = await supabaseAdmin
    .from("user_entitlements")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (existingError) throw existingError;

  const existingTimestamp = Number(existing?.metadata?.lastRevenueCatEventTimestampMs || 0);
  if (eventTimestampMs && existingTimestamp && existingTimestamp > eventTimestampMs) {
    return { ignored: true };
  }

  const nextMetadata = {
    ...(existing?.metadata && typeof existing.metadata === "object" ? existing.metadata : {}),
    ...(metadata || {}),
    lastRevenueCatEventTimestampMs: eventTimestampMs || existingTimestamp || Date.now(),
    lastRevenueCatSyncedAt: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin
    .from("user_entitlements")
    .upsert({
      user_id: userId,
      plan_id: String(productRow.plan_id || "free"),
      status,
      source: "revenuecat",
      billing_cadence: String(productRow.billing_cadence || "monthly"),
      product_id: String(productRow.product_id || ""),
      external_customer_id: externalCustomerId || existing?.external_customer_id || null,
      external_subscription_id: externalSubscriptionId || existing?.external_subscription_id || null,
      store_transaction_id: storeTransactionId || existing?.store_transaction_id || null,
      started_at: startedAt || existing?.started_at || new Date().toISOString(),
      renewal_at: renewalAt || null,
      expires_at: expiresAt || null,
      metadata: nextMetadata,
    }, { onConflict: "user_id" });
  if (error) throw error;
  return { ignored: false };
};

const getActiveEntitlementSnapshot = (customerInfo: Record<string, any>) => {
  const active = customerInfo?.entitlements?.active || {};
  for (const planId of ACTIVE_PLAN_PRIORITY) {
    const entitlementKey = planId === "premium" ? "Premium" : "Pro";
    const entitlement = active?.[entitlementKey];
    if (entitlement?.isActive === true) {
      return { entitlementKey, entitlement };
    }
  }
  return null;
};

export const syncRevenueCatCustomerInfo = async ({
  userId,
  customerInfo,
  source,
  forceDowngrade = false,
}: {
  userId: string;
  customerInfo: Record<string, any>;
  source: string;
  forceDowngrade?: boolean;
}) => {
  const snapshot = getActiveEntitlementSnapshot(customerInfo);

  if (!snapshot) {
    if (forceDowngrade) {
      const { error } = await supabaseAdmin
        .from("user_entitlements")
        .update({
          status: "expired",
          metadata: {
            ...(customerInfo || {}),
            source,
            forceDowngrade,
            lastRevenueCatSyncedAt: new Date().toISOString(),
          },
        })
        .eq("user_id", userId);
      if (error) throw error;
    }

    const status = await resolveSubscriptionStatus(userId);
    return { success: true, synced: false, status };
  }

  const productIdentifier = String(snapshot.entitlement.productIdentifier || "").trim();
  const productRow = await findStoreProduct(productIdentifier);
  if (!productRow) {
    const status = await resolveSubscriptionStatus(userId);
    return {
      success: false,
      synced: false,
      message: `No store product mapping found for ${productIdentifier}.`,
      status,
    };
  }

  await applyEntitlementUpdate({
    userId,
    productRow,
    status: "active",
    renewalAt: toIsoString(snapshot.entitlement.expirationDate),
    expiresAt: toIsoString(snapshot.entitlement.expirationDate),
    startedAt: toIsoString(snapshot.entitlement.originalPurchaseDate || snapshot.entitlement.latestPurchaseDate),
    externalCustomerId: String(customerInfo?.originalAppUserId || userId),
    externalSubscriptionId: null,
    storeTransactionId: null,
    metadata: {
      source,
      revenuecat: customerInfo,
      entitlementIdentifier: snapshot.entitlement.identifier,
      productIdentifier,
      unsubscribeDetectedAt: toIsoString(snapshot.entitlement.unsubscribeDetectedAt),
      billingIssueDetectedAt: toIsoString(snapshot.entitlement.billingIssueDetectedAt),
      willRenew: snapshot.entitlement.willRenew === true,
    },
  });

  const status = await resolveSubscriptionStatus(userId);
  return { success: true, synced: true, status };
};

export const applyRevenueCatWebhookEvent = async (event: Record<string, any>) => {
  const userId = String(event?.app_user_id || event?.original_app_user_id || "").trim();
  if (!userId) {
    return { success: true, ignored: true, reason: "missing_app_user_id" };
  }

  const productId = String(event?.product_id || "").trim();
  const productRow = await findStoreProduct(productId);
  if (!productRow || String(productRow.product_type || "") !== "subscription") {
    return { success: true, ignored: true, reason: "non_subscription_product" };
  }

  const eventType = String(event?.type || "").trim().toUpperCase();
  const platform = normalizePlatform(event?.store);
  const expirationAt = toIsoString(event?.expiration_at_ms);
  const purchasedAt = toIsoString(event?.purchased_at_ms);
  const eventTimestampMs = toMillis(event?.event_timestamp_ms);
  const willRemainActive = !["EXPIRATION", "REFUND", "SUBSCRIPTION_PAUSED"].includes(eventType);

  await applyEntitlementUpdate({
    userId,
    productRow,
    status: willRemainActive ? "active" : "expired",
    renewalAt: expirationAt,
    expiresAt: expirationAt,
    startedAt: purchasedAt,
    eventTimestampMs,
    externalCustomerId: userId,
    externalSubscriptionId: String(event?.original_transaction_id || event?.transaction_id || ""),
    storeTransactionId: String(event?.transaction_id || event?.original_transaction_id || ""),
    metadata: {
      source: "webhook",
      revenuecatEventType: eventType,
      revenuecatStore: event?.store || null,
      revenuecatEntitlementIds: Array.isArray(event?.entitlement_ids) ? event.entitlement_ids : [],
      willRenew: !["CANCELLATION", "BILLING_ISSUE", "EXPIRATION", "REFUND", "SUBSCRIPTION_PAUSED"].includes(eventType),
      rawEvent: event,
    },
  });

  await recordRevenueCatPurchaseEvent({
    userId,
    productRow,
    eventType,
    platform,
    transactionId: event?.transaction_id ? String(event.transaction_id) : null,
    originalTransactionId: event?.original_transaction_id ? String(event.original_transaction_id) : null,
    payload: event,
  });

  const status = await resolveSubscriptionStatus(userId);
  return { success: true, ignored: false, status };
};
