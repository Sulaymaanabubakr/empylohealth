import { requireAdmin } from "../_shared/admin.ts";
import { writeAuditLog } from "../_shared/audit.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { errorResponse, json } from "../_shared/response.ts";
import { getIpAddress, getUserAgent } from "../_shared/request.ts";
import { supabaseAdmin } from "../_shared/supabase.ts";

const parseBody = async (req: Request) => {
  try {
    return await req.json();
  } catch {
    return {};
  }
};

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  if (req.method !== "POST") return errorResponse(405, "Method not allowed.", undefined, { headers: corsHeaders });

  try {
    const admin = await requireAdmin(req, { permission: "transactions.view", denialAction: "admin.billing_denied" });
    const body = await parseBody(req);
    const action = String(body?.action || "");
    const ipAddress = getIpAddress(req);
    const userAgent = getUserAgent(req);

    if (action === "getBillingOverview") {
      const [
        entitlementRows,
        purchaseRows,
        analyticsRows,
        usageRows,
        observabilityRows,
        organisationRows,
      ] = await Promise.all([
        supabaseAdmin.from("user_entitlements").select("plan_id, status"),
        supabaseAdmin.from("purchase_events").select("product_type, status, amount_gbp, created_at").order("created_at", { ascending: false }).limit(200),
        supabaseAdmin.from("analytics_events").select("event_type, plan_id, created_at").order("created_at", { ascending: false }).limit(500),
        supabaseAdmin.from("usage_summaries").select("subscription_ai_credits_used, subscription_huddle_minutes_used, boost_ai_credits_used, boost_huddle_minutes_used"),
        supabaseAdmin.from("observability_events").select("event_type, severity, created_at").order("created_at", { ascending: false }).limit(500),
        supabaseAdmin.from("organisations").select("id"),
      ]);

      if (entitlementRows.error) throw entitlementRows.error;
      if (purchaseRows.error) throw purchaseRows.error;
      if (analyticsRows.error) throw analyticsRows.error;
      if (usageRows.error) throw usageRows.error;
      if (observabilityRows.error) throw observabilityRows.error;
      if (organisationRows.error) throw organisationRows.error;

      const plans = { free: 0, pro: 0, premium: 0, enterprise: 0 } as Record<string, number>;
      for (const row of entitlementRows.data || []) {
        const planId = String(row.plan_id || "free");
        if (plans[planId] == null) plans[planId] = 0;
        plans[planId] += 1;
      }

      const revenue = (purchaseRows.data || []).reduce((sum, row) => sum + toNumber(row.amount_gbp, 0), 0);
      const boostPurchases = (purchaseRows.data || []).filter((row) => String(row.product_type || "") === "boost").length;
      const churnEvents = (analyticsRows.data || []).filter((row) => String(row.event_type || "") === "subscription.expired").length;
      const conversions = (analyticsRows.data || []).filter((row) => String(row.event_type || "").startsWith("subscription.")).length;
      const aiCreditsUsed = (usageRows.data || []).reduce((sum, row) => sum + toNumber(row.subscription_ai_credits_used) + toNumber(row.boost_ai_credits_used), 0);
      const huddleMinutesUsed = (usageRows.data || []).reduce((sum, row) => sum + toNumber(row.subscription_huddle_minutes_used) + toNumber(row.boost_huddle_minutes_used), 0);
      const activeHuddles = (observabilityRows.data || []).filter((row) => String(row.event_type || "") === "huddle.started").length;
      const failedUsageEvents = (observabilityRows.data || []).filter((row) => String(row.severity || "") === "error").length;

      return json({
        plans,
        revenue,
        boostPurchases,
        churnEvents,
        conversions,
        aiCreditsUsed,
        huddleMinutesUsed,
        activeHuddles,
        failedUsageEvents,
        organisations: (organisationRows.data || []).length,
      }, { headers: corsHeaders });
    }

    if (action === "listOrganisations") {
      const { data: orgs, error } = await supabaseAdmin
        .from("organisations")
        .select(`
          id,
          name,
          slug,
          status,
          contact_email,
          created_at,
          organisation_plan_configs (
            monthly_ai_credits,
            monthly_huddle_minutes,
            daily_huddle_starts,
            max_minutes_per_huddle,
            soft_caps,
            alert_thresholds
          ),
          organisation_seats (
            id,
            user_id,
            role,
            status
          )
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const items = (orgs || []).map((org) => {
        const config = Array.isArray(org.organisation_plan_configs) ? org.organisation_plan_configs[0] : org.organisation_plan_configs;
        const seats = Array.isArray(org.organisation_seats) ? org.organisation_seats : [];
        return {
          id: org.id,
          name: org.name,
          slug: org.slug,
          status: org.status,
          contactEmail: org.contact_email,
          createdAt: org.created_at,
          config: config || {},
          seatCount: seats.length,
          activeSeatCount: seats.filter((seat) => String(seat.status || "active") === "active").length,
          seats,
        };
      });

      return json({ items }, { headers: corsHeaders });
    }

    if (action === "upsertOrganisation") {
      const name = String(body?.name || "").trim();
      const slug = String(body?.slug || "").trim();
      if (!name || !slug) {
        return errorResponse(400, "Organisation name and slug are required.", undefined, { headers: corsHeaders });
      }

      const orgId = body?.organisationId ? String(body.organisationId) : crypto.randomUUID();
      const organisationPayload = {
        id: orgId,
        name,
        slug,
        status: String(body?.status || "active"),
        contact_email: body?.contactEmail ? String(body.contactEmail) : null,
        metadata: body?.metadata && typeof body.metadata === "object" ? body.metadata : {},
      };

      const configPayload = {
        organisation_id: orgId,
        monthly_ai_credits: body?.monthlyAiCredits == null || body?.monthlyAiCredits === "" ? null : toNumber(body.monthlyAiCredits),
        monthly_huddle_minutes: body?.monthlyHuddleMinutes == null || body?.monthlyHuddleMinutes === "" ? null : toNumber(body.monthlyHuddleMinutes),
        daily_huddle_starts: body?.dailyHuddleStarts == null || body?.dailyHuddleStarts === "" ? null : toNumber(body.dailyHuddleStarts),
        max_minutes_per_huddle: body?.maxMinutesPerHuddle == null || body?.maxMinutesPerHuddle === "" ? null : toNumber(body.maxMinutesPerHuddle),
        soft_caps: body?.softCaps && typeof body.softCaps === "object" ? body.softCaps : {},
        alert_thresholds: body?.alertThresholds && typeof body.alertThresholds === "object" ? body.alertThresholds : {},
        capabilities: body?.capabilities && typeof body.capabilities === "object" ? body.capabilities : {},
      };

      const { error: orgError } = await supabaseAdmin.from("organisations").upsert(organisationPayload, { onConflict: "id" });
      if (orgError) throw orgError;

      const { error: configError } = await supabaseAdmin.from("organisation_plan_configs").upsert(configPayload, { onConflict: "organisation_id" });
      if (configError) throw configError;

      await writeAuditLog({
        userId: admin.user.id,
        action: "admin.billing_org_upsert",
        metadata: { organisationId: orgId, slug },
        ipAddress,
        userAgent,
      });

      return json({ success: true, organisationId: orgId }, { headers: corsHeaders });
    }

    if (action === "assignOrganisationSeat") {
      const organisationId = String(body?.organisationId || "").trim();
      const userId = String(body?.userId || "").trim();
      if (!organisationId || !userId) {
        return errorResponse(400, "organisationId and userId are required.", undefined, { headers: corsHeaders });
      }

      const { error } = await supabaseAdmin.from("organisation_seats").upsert({
        organisation_id: organisationId,
        user_id: userId,
        role: String(body?.role || "member"),
        status: String(body?.status || "active"),
      }, { onConflict: "organisation_id,user_id" });
      if (error) throw error;

      const { error: entitlementError } = await supabaseAdmin.from("user_entitlements").upsert({
        user_id: userId,
        plan_id: "enterprise",
        status: "active",
        source: "admin",
        billing_cadence: "custom",
        organisation_id: organisationId,
        renewal_at: null,
        expires_at: null,
      }, { onConflict: "user_id" });
      if (entitlementError) throw entitlementError;

      await writeAuditLog({
        userId: admin.user.id,
        action: "admin.billing_org_assign_seat",
        metadata: { organisationId, assignedUserId: userId },
        ipAddress,
        userAgent,
      });

      return json({ success: true }, { headers: corsHeaders });
    }

    if (action === "grantManualBoost") {
      const userId = String(body?.userId || "").trim();
      if (!userId) {
        return errorResponse(400, "userId is required.", undefined, { headers: corsHeaders });
      }

      const grantId = crypto.randomUUID();
      const aiCredits = Math.max(toNumber(body?.aiCredits, 0), 0);
      const huddleMinutes = Math.max(toNumber(body?.huddleMinutes, 0), 0);

      const { error } = await supabaseAdmin.from("boost_grants").insert({
        id: grantId,
        user_id: userId,
        purchase_event_id: null,
        product_id: body?.label ? String(body.label) : "manual_adjustment",
        ai_credits_total: aiCredits,
        ai_credits_remaining: aiCredits,
        huddle_minutes_total: huddleMinutes,
        huddle_minutes_remaining: huddleMinutes,
        expires_at: null,
        metadata: {
          source: "admin_manual_override",
          grantedBy: admin.user.id,
          note: body?.note ? String(body.note) : "",
        },
      });
      if (error) throw error;

      await writeAuditLog({
        userId: admin.user.id,
        action: "admin.billing_manual_boost",
        metadata: { assignedUserId: userId, aiCredits, huddleMinutes },
        ipAddress,
        userAgent,
      });

      return json({ success: true, grantId }, { headers: corsHeaders });
    }

    return errorResponse(400, "Unsupported action.", undefined, { headers: corsHeaders });
  } catch (error) {
    if (error instanceof Response) return error;
    return errorResponse(500, error instanceof Error ? error.message : "Unable to complete admin billing action.", undefined, { headers: corsHeaders });
  }
});
