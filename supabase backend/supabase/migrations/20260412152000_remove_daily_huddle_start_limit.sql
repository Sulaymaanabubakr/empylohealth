create or replace function public.resolve_subscription_status(p_user_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  entitlement_row public.user_entitlements%rowtype;
  plan_row public.plan_catalog%rowtype;
  org_config public.organisation_plan_configs%rowtype;
  usage_row public.usage_summaries%rowtype;
  period_id uuid;
  ai_remaining integer := 0;
  huddle_remaining integer := 0;
  warning_threshold integer := 20;
  organisation_name text := '';
begin
  select * into entitlement_row
  from public.user_entitlements
  where user_id = p_user_id
  order by updated_at desc
  limit 1;

  if entitlement_row.id is null then
    insert into public.user_entitlements (
      user_id,
      plan_id,
      status,
      source,
      billing_cadence,
      organisation_id,
      renewal_at,
      expires_at,
      metadata
    )
    values (
      p_user_id,
      'free',
      'active',
      'system',
      'monthly',
      null,
      timezone('utc', now()) + interval '1 month',
      timezone('utc', now()) + interval '1 month',
      '{}'::jsonb
    )
    returning * into entitlement_row;
  end if;

  if entitlement_row.status <> 'active'
     or (entitlement_row.expires_at is not null and entitlement_row.expires_at < timezone('utc', now())) then
    update public.user_entitlements
    set plan_id = 'free',
        status = 'active',
        source = 'system',
        billing_cadence = 'monthly',
        organisation_id = null,
        renewal_at = timezone('utc', now()) + interval '1 month',
        expires_at = timezone('utc', now()) + interval '1 month',
        metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('downgradedAt', timezone('utc', now()))
    where id = entitlement_row.id
    returning * into entitlement_row;
  end if;

  select * into plan_row
  from public.plan_catalog
  where id = entitlement_row.plan_id;

  if entitlement_row.organisation_id is not null then
    select * into org_config
    from public.organisation_plan_configs
    where organisation_id = entitlement_row.organisation_id;

    select name into organisation_name
    from public.organisations
    where id = entitlement_row.organisation_id;
  end if;

  period_id := public.ensure_billing_period(p_user_id);

  select * into usage_row
  from public.usage_summaries
  where user_id = p_user_id
    and billing_period_id = period_id;

  if usage_row.huddle_starts_date <> (timezone('utc', now()))::date then
    update public.usage_summaries
    set huddle_starts_date = (timezone('utc', now()))::date,
        huddle_starts_used_today = 0
    where id = usage_row.id
    returning * into usage_row;
  end if;

  ai_remaining := greatest(
    (usage_row.ai_subscription_credits_total - usage_row.ai_subscription_credits_used)
    + (usage_row.ai_boost_credits_total - usage_row.ai_boost_credits_used),
    0
  );

  huddle_remaining := greatest(
    (usage_row.huddle_subscription_minutes_total - usage_row.huddle_subscription_minutes_used)
    + (usage_row.huddle_boost_minutes_total - usage_row.huddle_boost_minutes_used),
    0
  );

  warning_threshold := coalesce(org_config.warning_threshold_percent, 20);

  return jsonb_build_object(
    'entitlement', jsonb_build_object(
      'plan', entitlement_row.plan_id,
      'displayName', plan_row.display_name,
      'status', entitlement_row.status,
      'billingCadence', coalesce(entitlement_row.billing_cadence, 'monthly'),
      'renewalDate', entitlement_row.renewal_at,
      'periodStart', (select period_start from public.billing_periods where id = period_id),
      'periodEnd', (select period_end from public.billing_periods where id = period_id),
      'organisationId', entitlement_row.organisation_id,
      'organisationName', coalesce(organisation_name, '')
    ),
    'capabilities', coalesce(plan_row.capabilities, '{}'::jsonb) || coalesce(org_config.capabilities, '{}'::jsonb),
    'limits', jsonb_build_object(
      'monthlyAiCredits', coalesce(org_config.monthly_ai_credits, plan_row.monthly_ai_credits, 0),
      'monthlyHuddleMinutes', coalesce(org_config.monthly_huddle_minutes, plan_row.monthly_huddle_minutes, 0),
      'dailyHuddleStarts', null,
      'maxMinutesPerHuddle', coalesce(org_config.max_minutes_per_huddle, plan_row.max_minutes_per_huddle, 0),
      'maxAiContextTokens', coalesce(plan_row.max_ai_context_tokens, 4000),
      'maxAiResponseTokens', coalesce(plan_row.max_ai_response_tokens, 500)
    ),
    'usage', jsonb_build_object(
      'aiSubscriptionCreditsUsed', usage_row.ai_subscription_credits_used,
      'aiBoostCreditsUsed', usage_row.ai_boost_credits_used,
      'huddleSubscriptionMinutesUsed', usage_row.huddle_subscription_minutes_used,
      'huddleBoostMinutesUsed', usage_row.huddle_boost_minutes_used,
      'huddleStartsUsedToday', usage_row.huddle_starts_used_today,
      'huddleStartsDate', usage_row.huddle_starts_date
    ),
    'remaining', jsonb_build_object(
      'aiCreditsRemaining', ai_remaining,
      'huddleMinutesRemaining', huddle_remaining,
      'dailyHuddleStartsRemaining', null,
      'boostAiCreditsRemaining', greatest(usage_row.ai_boost_credits_total - usage_row.ai_boost_credits_used, 0),
      'boostHuddleMinutesRemaining', greatest(usage_row.huddle_boost_minutes_total - usage_row.huddle_boost_minutes_used, 0)
    ),
    'warnings', jsonb_build_object(
      'lowAiCredits', case
        when coalesce(org_config.monthly_ai_credits, plan_row.monthly_ai_credits, 0) <= 0 then false
        else ai_remaining <= greatest(1, floor(coalesce(org_config.monthly_ai_credits, plan_row.monthly_ai_credits, 0) * warning_threshold / 100.0))
      end,
      'lowHuddleMinutes', case
        when coalesce(org_config.monthly_huddle_minutes, plan_row.monthly_huddle_minutes, 0) <= 0 then false
        else huddle_remaining <= greatest(1, floor(coalesce(org_config.monthly_huddle_minutes, plan_row.monthly_huddle_minutes, 0) * warning_threshold / 100.0))
      end,
      'lowDailyHuddleStarts', false
    ),
    'refreshesOn', entitlement_row.renewal_at,
    'activityGatingEnabled', true
  );
end;
$$;

create or replace function public.consume_huddle_start(
  p_user_id uuid,
  p_source_id text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  status_json jsonb;
  period_id uuid;
begin
  status_json := public.resolve_subscription_status(p_user_id);
  if coalesce((status_json -> 'capabilities' ->> 'canStartHuddles')::boolean, false) = false then
    return jsonb_build_object('allowed', false, 'reasonCode', 'cannot_start_huddles', 'message', 'Your plan does not allow starting huddles.');
  end if;

  period_id := public.ensure_billing_period(p_user_id);

  insert into public.usage_events (user_id, billing_period_id, source_id, event_type, amount, plan_id, metadata)
  values (p_user_id, period_id, p_source_id, 'huddle_start', 1, status_json -> 'entitlement' ->> 'plan', '{}'::jsonb)
  on conflict do nothing;

  return jsonb_build_object(
    'allowed', true,
    'grantedMinutes', coalesce((status_json -> 'remaining' ->> 'huddleMinutesRemaining')::integer, 0),
    'maxMinutesPerHuddle', coalesce((status_json -> 'limits' ->> 'maxMinutesPerHuddle')::integer, 0)
  );
end;
$$;
