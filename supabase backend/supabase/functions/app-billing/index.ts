import { requireUser } from "../_shared/auth.ts";
import { writeAnalyticsEvent } from "../_shared/analytics.ts";
import {
  claimIdempotency,
  completeIdempotency,
  failIdempotency,
  grantBoostPack,
  listPlanCatalog,
  listStoreProducts,
  resolveSubscriptionStatus,
} from "../_shared/billing.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { writeObservabilityEvent } from "../_shared/observability.ts";
import { errorResponse, json } from "../_shared/response.ts";
import {
  verifyAppleProductPurchase,
  verifyAppleSubscriptionTransaction,
  verifyGoogleProductPurchase,
  verifyGoogleSubscriptionPurchase,
} from "../_shared/storeVerification.ts";
import { syncRevenueCatCustomerInfo } from "../_shared/revenuecat.ts";
import { supabaseAdmin } from "../_shared/supabase.ts";

const parseBody = async (req: Request) => {
  try {
    return await req.json();
  } catch {
    return {};
  }
};

const hashRequest = async (payload: unknown) => {
  const data = new TextEncoder().encode(JSON.stringify(payload || {}));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

const normalizeCatalog = (plans: Record<string, unknown>[], products: Record<string, unknown>[]) => {
  const byPlan = new Map<string, Record<string, unknown>[]>();
  const boosts: Record<string, unknown>[] = [];

  products.forEach((product) => {
    const type = String(product.product_type || "");
    if (type === "boost") {
      boosts.push(product);
      return;
    }
    const planId = String(product.plan_id || "");
    if (!byPlan.has(planId)) byPlan.set(planId, []);
    byPlan.get(planId)?.push(product);
  });

  return {
    plans: plans.map((plan) => {
      const id = String(plan.id || "");
      const monthlyPriceGbp = Number(plan.monthly_price_gbp || 0);
      const annualPriceGbp = Number(plan.annual_price_gbp || 0);
      const annualSavingsPercent = monthlyPriceGbp > 0 && annualPriceGbp > 0 && (monthlyPriceGbp * 12) > annualPriceGbp
        ? Math.round((((monthlyPriceGbp * 12) - annualPriceGbp) / (monthlyPriceGbp * 12)) * 100)
        : null;
      const productRows = byPlan.get(id) || [];
      const productIds = productRows.reduce<Record<string, string[]>>((acc, row) => {
        const platform = String(row.platform || "");
        if (!acc[platform]) acc[platform] = [];
        acc[platform].push(String(row.product_id || ""));
        return acc;
      }, {});
      return {
        id,
        name: plan.display_name,
        displayName: plan.display_name,
        priceLabel: plan.monthly_price_gbp ? `£${monthlyPriceGbp.toFixed(2)}/month` : "External pricing",
        annualPriceLabel: plan.annual_price_gbp ? `£${annualPriceGbp.toFixed(2)}/year` : "",
        annualSavingsPercent,
        limits: {
          monthlyAiCredits: plan.monthly_ai_credits,
          monthlyHuddleMinutes: plan.monthly_huddle_minutes,
          dailyHuddleStarts: null,
          maxMinutesPerHuddle: plan.max_minutes_per_huddle,
        },
        capabilities: plan.capabilities || {},
        metadata: plan.metadata || {},
        productIds,
      };
    }),
    boosts: boosts.map((product) => ({
      id: product.product_id,
      productId: product.product_id,
      platform: product.platform,
      name: product.metadata?.displayName || product.product_id,
      title: product.metadata?.displayName || product.product_id,
      priceLabel: product.metadata?.priceLabel || "",
      aiCredits: product.boost_ai_credits || 0,
      huddleMinutes: product.boost_huddle_minutes || 0,
      ...((product.metadata && typeof product.metadata === "object") ? product.metadata : {}),
    })),
    defaults: {
      iosProductIds: products.filter((row) => row.platform === "ios" && row.product_type === "subscription").map((row) => String(row.product_id || "")),
      androidProductIds: products.filter((row) => row.platform === "android" && row.product_type === "subscription").map((row) => String(row.product_id || "")),
    },
    enterprise: {
      title: "Enterprise / For Organisations",
      subtitle: "Contact us for a demo",
      url: Deno.env.get("ENTERPRISE_DEMO_URL") || "https://circleshealth.com",
    },
  };
};

const applyValidatedEntitlement = async ({
  userId,
  productId,
  billingCadence,
  platform,
  transactionId,
  originalTransactionId,
  purchaseToken,
  idempotencyKey,
  payload,
  startsAt,
  expiresAt,
  renewalState,
}: {
  userId: string;
  productId: string;
  billingCadence: string;
  platform: string;
  transactionId?: string;
  originalTransactionId?: string;
  purchaseToken?: string;
  idempotencyKey: string;
  payload: Record<string, unknown>;
  startsAt?: string | null;
  expiresAt?: string | null;
  renewalState?: string | null;
}) => {
  const { data: productRow, error: productError } = await supabaseAdmin
    .from("store_products")
    .select("*")
    .eq("product_id", productId)
    .maybeSingle();
  if (productError) throw productError;
  if (!productRow) throw new Error("Unknown product.");

  const renewalDate = expiresAt || null;

  const { data: purchaseEvent, error: purchaseError } = await supabaseAdmin
    .from("purchase_events")
    .insert({
      user_id: userId,
      platform,
      product_id: productId,
      product_type: "subscription",
      transaction_id: transactionId || null,
      original_transaction_id: originalTransactionId || null,
      purchase_token: purchaseToken || null,
      idempotency_key: idempotencyKey,
      status: "validated",
      amount_gbp: billingCadence === "annual" ? productRow.metadata?.annualPriceGbp || null : productRow.metadata?.monthlyPriceGbp || null,
      payload,
      result: { renewalDate, startsAt, renewalState },
    })
    .select("*")
    .single();
  if (purchaseError) throw purchaseError;

  const { error: entitlementError } = await supabaseAdmin
    .from("user_entitlements")
    .upsert({
      user_id: userId,
      plan_id: productRow.plan_id,
      status: "active",
      source: platform,
      billing_cadence: billingCadence,
      product_id: productId,
      store_transaction_id: transactionId || originalTransactionId || purchaseToken || null,
      renewal_at: renewalDate,
      expires_at: renewalDate,
      metadata: {
        lastValidatedAt: new Date().toISOString(),
        startsAt,
        renewalState,
      },
    }, { onConflict: "user_id" });
  if (entitlementError) throw entitlementError;

  const status = await resolveSubscriptionStatus(userId);
  await writeAnalyticsEvent({
    userId,
    eventType: "subscription.activated",
    planId: String(productRow.plan_id || ""),
    metadata: { billingCadence, productId, platform },
  });
  await completeIdempotency({
    scope: "subscription_validation",
    key: idempotencyKey,
    response: { success: true, status, purchaseEventId: purchaseEvent.id },
    resourceType: "purchase_event",
    resourceId: purchaseEvent.id,
  });
  return { success: true, status, purchaseEventId: purchaseEvent.id };
};

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  if (req.method !== "POST") return errorResponse(405, "Method not allowed.", undefined, { headers: corsHeaders });

  try {
    const body = await parseBody(req);
    const action = String(body?.action || "");

    if (action === "getSubscriptionCatalog" || action === "getEnterpriseContactConfig") {
      const [plans, products] = await Promise.all([listPlanCatalog(), listStoreProducts()]);
      const catalog = normalizeCatalog(plans, products);
      if (action === "getEnterpriseContactConfig") {
        return json(catalog.enterprise, { headers: corsHeaders });
      }
      return json(catalog, { headers: corsHeaders });
    }

    const { user } = await requireUser(req);

    if (action === "getSubscriptionStatus") {
      const status = await resolveSubscriptionStatus(user.id);
      return json(status, { headers: corsHeaders });
    }

    if (action === "syncRevenueCatCustomer") {
      const customerInfo = (body?.customerInfo && typeof body.customerInfo === "object")
        ? body.customerInfo as Record<string, unknown>
        : null;
      if (!customerInfo) {
        return errorResponse(400, "customerInfo is required.", undefined, { headers: corsHeaders });
      }

      const result = await syncRevenueCatCustomerInfo({
        userId: user.id,
        customerInfo,
        source: body?.source ? String(body.source) : "app_sync",
        forceDowngrade: body?.forceDowngrade === true,
      });
      return json(result, { headers: corsHeaders });
    }

    if (action === "validateBoostPurchase") {
      const idempotencyKey = String(body?.idempotencyKey || "").trim();
      const productId = String(body?.productId || "").trim();
      const platform = String(body?.platform || "").trim() || "unknown";
      const requestHash = await hashRequest({ productId, platform, body });
      const idempotent = await claimIdempotency({
        scope: "boost_purchase",
        userId: user.id,
        key: idempotencyKey,
        requestHash,
      });
      if (String(idempotent?.status || "") === "completed" && idempotent?.response) {
        return json({ ...(idempotent.response as Record<string, unknown>), idempotentReplay: true }, { headers: corsHeaders });
      }

      const verified = platform === "ios"
        ? await verifyAppleProductPurchase({
          productId,
          transactionId: body?.transactionId ? String(body.transactionId) : undefined,
          signedTransactionInfo: body?.signedTransactionInfo ? String(body.signedTransactionInfo) : undefined,
        })
        : await verifyGoogleProductPurchase({
          purchaseToken: String(body?.purchaseToken || "").trim(),
          productId,
        });

      const { data: purchaseEvent, error: purchaseError } = await supabaseAdmin
        .from("purchase_events")
        .insert({
          user_id: user.id,
          platform: String(verified.platform || platform),
          product_id: String(verified.productId || productId),
          product_type: "boost",
          transaction_id: verified.transactionId ? String(verified.transactionId) : (body?.transactionId ? String(body.transactionId) : null),
          original_transaction_id: verified.originalTransactionId ? String(verified.originalTransactionId) : (body?.originalTransactionId ? String(body.originalTransactionId) : null),
          purchase_token: verified.purchaseToken ? String(verified.purchaseToken) : (body?.purchaseToken ? String(body.purchaseToken) : null),
          idempotency_key: idempotencyKey,
          status: "validated",
          payload: { ...body, verified },
        })
        .select("*")
        .single();
      if (purchaseError) throw purchaseError;

      const grant = await grantBoostPack({
        userId: user.id,
        productId: String(verified.productId || productId),
        purchaseEventId: purchaseEvent.id,
        metadata: { platform: String(verified.platform || platform), startsAt: verified.startsAt || null },
      });
      const status = await resolveSubscriptionStatus(user.id);
      const response = { success: true, grant, status, purchaseEventId: purchaseEvent.id };
      await writeAnalyticsEvent({
        userId: user.id,
        eventType: "boost.purchased",
        planId: String((status as Record<string, unknown>)?.entitlement?.plan || ""),
        metadata: { productId: String(verified.productId || productId), platform: String(verified.platform || platform) },
      });
      await completeIdempotency({
        scope: "boost_purchase",
        key: idempotencyKey,
        response,
        resourceType: "purchase_event",
        resourceId: purchaseEvent.id,
      });
      return json(response, { headers: corsHeaders });
    }

    if (action === "validateAppleSubscriptionReceipt" || action === "validateGoogleSubscriptionPurchase" || action === "restoreSubscriptions") {
      const idempotencyKey = String(body?.idempotencyKey || body?.transactionId || body?.purchaseToken || body?.originalTransactionId || "").trim();
      const requestHash = await hashRequest(body);
      const idempotent = await claimIdempotency({
        scope: "subscription_validation",
        userId: user.id,
        key: idempotencyKey,
        requestHash,
      });
      if (String(idempotent?.status || "") === "completed" && idempotent?.response) {
        return json({ ...(idempotent.response as Record<string, unknown>), idempotentReplay: true }, { headers: corsHeaders });
      }

      const productId = String(body?.productId || "").trim();
      const billingCadence = productId.includes("annual") ? "annual" : "monthly";
      if (!productId) {
        await failIdempotency({
          scope: "subscription_validation",
          key: idempotencyKey,
          response: { success: false, message: "Missing productId." },
        });
        return errorResponse(400, "Missing productId.", undefined, { headers: corsHeaders });
      }

      const platform = action === "validateAppleSubscriptionReceipt"
        ? "ios"
        : action === "validateGoogleSubscriptionPurchase"
          ? "android"
          : String(body?.platform || "unknown");

      const verified = platform === "ios"
        ? await verifyAppleSubscriptionTransaction({
          productId,
          transactionId: body?.transactionId ? String(body.transactionId) : undefined,
          originalTransactionId: body?.originalTransactionId ? String(body.originalTransactionId) : undefined,
          signedTransactionInfo: body?.signedTransactionInfo ? String(body.signedTransactionInfo) : undefined,
        })
        : await verifyGoogleSubscriptionPurchase({
          purchaseToken: String(body?.purchaseToken || "").trim(),
          productId,
        });

      const result = await applyValidatedEntitlement({
        userId: user.id,
        productId: String(verified.productId || productId),
        billingCadence: String(verified.billingCadence || billingCadence),
        platform: String(verified.platform || platform),
        transactionId: verified.transactionId ? String(verified.transactionId) : (body?.transactionId ? String(body.transactionId) : undefined),
        originalTransactionId: verified.originalTransactionId ? String(verified.originalTransactionId) : (body?.originalTransactionId ? String(body.originalTransactionId) : undefined),
        purchaseToken: verified.purchaseToken ? String(verified.purchaseToken) : (body?.purchaseToken ? String(body.purchaseToken) : undefined),
        idempotencyKey,
        payload: { ...body, verified },
        startsAt: verified.startsAt ? String(verified.startsAt) : null,
        expiresAt: verified.expiresAt ? String(verified.expiresAt) : null,
        renewalState: verified.renewalState ? String(verified.renewalState) : null,
      });
      return json(result, { headers: corsHeaders });
    }

    return errorResponse(400, "Unsupported action.", undefined, { headers: corsHeaders });
  } catch (error) {
    await writeObservabilityEvent({
      eventType: "billing.error",
      severity: "error",
      metadata: {
        message: error instanceof Error ? error.message : "Unknown error",
      },
    });
    if (error instanceof Response) return error;
    return errorResponse(500, error instanceof Error ? error.message : "Unable to complete billing action.", undefined, { headers: corsHeaders });
  }
});
