create or replace function public.user_can_use_boosts(p_user_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  entitlement_row public.user_entitlements%rowtype;
  plan_row public.plan_catalog%rowtype;
begin
  select * into entitlement_row
  from public.user_entitlements
  where user_id = p_user_id;

  if entitlement_row.id is null then
    return false;
  end if;

  if coalesce(entitlement_row.status, 'active') <> 'active' then
    return false;
  end if;

  if entitlement_row.expires_at is not null and entitlement_row.expires_at <= timezone('utc', now()) then
    return false;
  end if;

  select * into plan_row
  from public.plan_catalog
  where id = entitlement_row.plan_id;

  return coalesce((plan_row.capabilities ->> 'canUseBoosts')::boolean, false);
end;
$$;

create or replace function public.expire_forfeited_boost_grants(p_user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  if public.user_can_use_boosts(p_user_id) then
    return;
  end if;

  update public.boost_grants
  set expires_at = timezone('utc', now()),
      metadata = coalesce(metadata, '{}'::jsonb)
        || jsonb_build_object(
          'forfeitedAt', timezone('utc', now()),
          'forfeitedReason', 'subscription_inactive'
        )
  where user_id = p_user_id
    and coalesce(expires_at, timezone('utc', now()) + interval '100 years') > timezone('utc', now())
    and (
      greatest(ai_credits_granted - ai_credits_used, 0) > 0
      or greatest(huddle_minutes_granted - huddle_minutes_used, 0) > 0
    );
end;
$$;

create or replace function public.sync_usage_summary_boosts(
  p_user_id uuid,
  p_period_id uuid default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  period_id uuid;
  ai_total integer;
  ai_used integer;
  huddle_total integer;
  huddle_used integer;
begin
  period_id := coalesce(p_period_id, public.ensure_billing_period(p_user_id));

  perform public.expire_forfeited_boost_grants(p_user_id);

  select
    coalesce(sum(ai_credits_granted), 0)::integer,
    coalesce(sum(ai_credits_used), 0)::integer,
    coalesce(sum(huddle_minutes_granted), 0)::integer,
    coalesce(sum(huddle_minutes_used), 0)::integer
  into ai_total, ai_used, huddle_total, huddle_used
  from public.boost_grants
  where user_id = p_user_id
    and coalesce(expires_at, timezone('utc', now()) + interval '100 years') > timezone('utc', now());

  update public.usage_summaries
  set ai_boost_credits_total = ai_total,
      ai_boost_credits_used = ai_used,
      huddle_boost_minutes_total = huddle_total,
      huddle_boost_minutes_used = huddle_used
  where user_id = p_user_id
    and billing_period_id = period_id;

  return period_id;
end;
$$;

create or replace function public.resolve_subscription_status(p_user_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  entitlement_row public.user_entitlements%rowtype;
  plan_row public.plan_catalog%rowtype;
  org_config public.organisation_plan_configs%rowtype;
  period_id uuid;
  usage_row public.usage_summaries%rowtype;
  organisation_name text;
  ai_remaining integer;
  huddle_remaining integer;
  daily_starts_remaining integer;
  warning_threshold integer;
begin
  period_id := public.ensure_billing_period(p_user_id);

  select * into entitlement_row
  from public.user_entitlements
  where user_id = p_user_id;

  if entitlement_row.plan_id <> 'free' and entitlement_row.expires_at is not null and entitlement_row.expires_at <= timezone('utc', now()) then
    update public.user_entitlements
    set plan_id = 'free',
        status = 'expired',
        source = 'system',
        billing_cadence = 'monthly',
        organisation_id = null,
        renewal_at = timezone('utc', now()) + interval '1 month',
        expires_at = timezone('utc', now()) + interval '1 month',
        metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('downgradedAt', timezone('utc', now()))
    where id = entitlement_row.id
    returning * into entitlement_row;
  end if;

  perform public.sync_usage_summary_boosts(p_user_id, period_id);

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
  daily_starts_remaining := greatest(
    coalesce(org_config.daily_huddle_starts, plan_row.daily_huddle_starts, 0) - usage_row.huddle_starts_used_today,
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
      'dailyHuddleStarts', coalesce(org_config.daily_huddle_starts, plan_row.daily_huddle_starts, 0),
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
      'dailyHuddleStartsRemaining', daily_starts_remaining,
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
      'lowDailyHuddleStarts', daily_starts_remaining <= 1
    ),
    'refreshesOn', entitlement_row.renewal_at,
    'activityGatingEnabled', true
  );
end;
$$;

create or replace function public.consume_huddle_minutes(
  p_user_id uuid,
  p_minutes integer,
  p_source_id text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  period_id uuid;
  usage_row public.usage_summaries%rowtype;
  grant_row public.boost_grants%rowtype;
  total_remaining integer;
  remaining_to_deduct integer;
  subscription_remaining integer;
  boost_remaining integer;
  deducted_from_grant integer;
begin
  if p_minutes <= 0 then
    return jsonb_build_object('success', true, 'deducted', 0);
  end if;

  period_id := public.ensure_billing_period(p_user_id);
  perform public.sync_usage_summary_boosts(p_user_id, period_id);

  select * into usage_row
  from public.usage_summaries
  where user_id = p_user_id and billing_period_id = period_id
  for update;

  subscription_remaining := greatest(usage_row.huddle_subscription_minutes_total - usage_row.huddle_subscription_minutes_used, 0);
  boost_remaining := greatest(usage_row.huddle_boost_minutes_total - usage_row.huddle_boost_minutes_used, 0);
  total_remaining := subscription_remaining + boost_remaining;

  if total_remaining < p_minutes then
    return jsonb_build_object('success', false, 'reasonCode', 'huddle_minutes_exhausted', 'remaining', total_remaining);
  end if;

  remaining_to_deduct := p_minutes;

  if subscription_remaining > 0 then
    update public.usage_summaries
    set huddle_subscription_minutes_used = huddle_subscription_minutes_used + least(subscription_remaining, remaining_to_deduct)
    where id = usage_row.id;
    remaining_to_deduct := remaining_to_deduct - least(subscription_remaining, remaining_to_deduct);
  end if;

  if remaining_to_deduct > 0 then
    for grant_row in
      select *
      from public.boost_grants
      where user_id = p_user_id
        and coalesce(expires_at, timezone('utc', now()) + interval '100 years') > timezone('utc', now())
        and huddle_minutes_used < huddle_minutes_granted
      order by expires_at asc nulls last, created_at asc, id asc
      for update
    loop
      deducted_from_grant := least(grant_row.huddle_minutes_granted - grant_row.huddle_minutes_used, remaining_to_deduct);

      update public.boost_grants
      set huddle_minutes_used = huddle_minutes_used + deducted_from_grant
      where id = grant_row.id;

      remaining_to_deduct := remaining_to_deduct - deducted_from_grant;
      exit when remaining_to_deduct <= 0;
    end loop;
  end if;

  perform public.sync_usage_summary_boosts(p_user_id, period_id);

  insert into public.usage_events (user_id, billing_period_id, source_id, event_type, amount, metadata)
  values (p_user_id, period_id, p_source_id, 'huddle_minutes_consumed', p_minutes, '{}'::jsonb)
  on conflict do nothing;

  return jsonb_build_object('success', true, 'deducted', p_minutes);
end;
$$;

create or replace function public.reserve_ai_credits(
  p_user_id uuid,
  p_operation_type text,
  p_idempotency_key text,
  p_credits integer,
  p_request_payload jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  existing_attempt public.usage_attempts%rowtype;
  period_id uuid;
  usage_row public.usage_summaries%rowtype;
  subscription_remaining integer;
  boost_remaining integer;
begin
  if p_credits <= 0 then
    return jsonb_build_object('success', true, 'attemptId', null);
  end if;

  select * into existing_attempt
  from public.usage_attempts
  where user_id = p_user_id
    and operation_type = p_operation_type
    and idempotency_key = p_idempotency_key
  for update;

  if existing_attempt.id is not null then
    return jsonb_build_object(
      'success', existing_attempt.status in ('reserved', 'completed'),
      'attemptId', existing_attempt.id,
      'status', existing_attempt.status,
      'result', existing_attempt.result_payload
    );
  end if;

  period_id := public.ensure_billing_period(p_user_id);
  perform public.sync_usage_summary_boosts(p_user_id, period_id);

  select * into usage_row
  from public.usage_summaries
  where user_id = p_user_id and billing_period_id = period_id
  for update;

  subscription_remaining := greatest(usage_row.ai_subscription_credits_total - usage_row.ai_subscription_credits_used, 0);
  boost_remaining := greatest(usage_row.ai_boost_credits_total - usage_row.ai_boost_credits_used, 0);

  if subscription_remaining + boost_remaining < p_credits then
    return jsonb_build_object('success', false, 'reasonCode', 'ai_credits_exhausted', 'remaining', subscription_remaining + boost_remaining);
  end if;

  insert into public.usage_attempts (
    user_id, billing_period_id, operation_type, idempotency_key, reserved_ai_credits, status, request_payload
  )
  values (p_user_id, period_id, p_operation_type, p_idempotency_key, p_credits, 'reserved', coalesce(p_request_payload, '{}'::jsonb))
  returning * into existing_attempt;

  return jsonb_build_object('success', true, 'attemptId', existing_attempt.id, 'status', 'reserved');
end;
$$;

create or replace function public.finalize_ai_credits(
  p_attempt_id uuid,
  p_source_id text,
  p_result_payload jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  attempt_row public.usage_attempts%rowtype;
  usage_row public.usage_summaries%rowtype;
  grant_row public.boost_grants%rowtype;
  subscription_remaining integer;
  remaining_to_deduct integer;
  deducted_from_grant integer;
begin
  select * into attempt_row
  from public.usage_attempts
  where id = p_attempt_id
  for update;

  if attempt_row.id is null then
    return jsonb_build_object('success', false, 'reasonCode', 'attempt_not_found');
  end if;

  if attempt_row.status = 'completed' then
    return jsonb_build_object('success', true, 'replayed', true, 'result', attempt_row.result_payload);
  end if;

  perform public.sync_usage_summary_boosts(attempt_row.user_id, attempt_row.billing_period_id);

  select * into usage_row
  from public.usage_summaries
  where id = (
    select id from public.usage_summaries
    where user_id = attempt_row.user_id and billing_period_id = attempt_row.billing_period_id
  )
  for update;

  remaining_to_deduct := attempt_row.reserved_ai_credits;
  subscription_remaining := greatest(usage_row.ai_subscription_credits_total - usage_row.ai_subscription_credits_used, 0);

  if subscription_remaining > 0 then
    update public.usage_summaries
    set ai_subscription_credits_used = ai_subscription_credits_used + least(subscription_remaining, remaining_to_deduct)
    where id = usage_row.id;
    remaining_to_deduct := remaining_to_deduct - least(subscription_remaining, remaining_to_deduct);
  end if;

  if remaining_to_deduct > 0 then
    for grant_row in
      select *
      from public.boost_grants
      where user_id = attempt_row.user_id
        and coalesce(expires_at, timezone('utc', now()) + interval '100 years') > timezone('utc', now())
        and ai_credits_used < ai_credits_granted
      order by expires_at asc nulls last, created_at asc, id asc
      for update
    loop
      deducted_from_grant := least(grant_row.ai_credits_granted - grant_row.ai_credits_used, remaining_to_deduct);

      update public.boost_grants
      set ai_credits_used = ai_credits_used + deducted_from_grant
      where id = grant_row.id;

      remaining_to_deduct := remaining_to_deduct - deducted_from_grant;
      exit when remaining_to_deduct <= 0;
    end loop;
  end if;

  perform public.sync_usage_summary_boosts(attempt_row.user_id, attempt_row.billing_period_id);

  update public.usage_attempts
  set status = 'completed',
      result_payload = coalesce(p_result_payload, '{}'::jsonb)
  where id = attempt_row.id;

  insert into public.usage_events (user_id, billing_period_id, usage_attempt_id, source_id, event_type, amount, metadata)
  values (attempt_row.user_id, attempt_row.billing_period_id, attempt_row.id, p_source_id, 'ai_credits_consumed', attempt_row.reserved_ai_credits, coalesce(p_result_payload, '{}'::jsonb))
  on conflict do nothing;

  return jsonb_build_object('success', true, 'deducted', attempt_row.reserved_ai_credits);
end;
$$;

create or replace function public.grant_boost_pack(
  p_user_id uuid,
  p_product_id text,
  p_purchase_event_id uuid,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  product_row public.store_products%rowtype;
  period_id uuid;
  grant_id uuid;
  grant_expires_at timestamptz;
begin
  if public.user_can_use_boosts(p_user_id) = false then
    return jsonb_build_object('success', false, 'reasonCode', 'boosts_require_active_subscription');
  end if;

  select * into product_row
  from public.store_products
  where product_id = p_product_id
    and is_active = true
  for update;

  if product_row.id is null then
    return jsonb_build_object('success', false, 'reasonCode', 'product_not_found');
  end if;

  period_id := public.ensure_billing_period(p_user_id);
  grant_expires_at := timezone('utc', now()) + interval '3 months';

  insert into public.boost_grants (
    user_id, product_id, purchase_event_id, ai_credits_granted, huddle_minutes_granted, expiry_policy, expires_at, metadata
  )
  values (
    p_user_id,
    p_product_id,
    p_purchase_event_id,
    coalesce(product_row.boost_ai_credits, 0),
    coalesce(product_row.boost_huddle_minutes, 0),
    'three_months_active_subscription',
    grant_expires_at,
    coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object('grantedAt', timezone('utc', now()))
  )
  returning id into grant_id;

  perform public.sync_usage_summary_boosts(p_user_id, period_id);

  insert into public.usage_events (user_id, billing_period_id, source_id, event_type, amount, metadata)
  values
    (p_user_id, period_id, grant_id::text, 'boost_ai_granted', coalesce(product_row.boost_ai_credits, 0), coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object('expiresAt', grant_expires_at)),
    (p_user_id, period_id, grant_id::text, 'boost_huddle_granted', coalesce(product_row.boost_huddle_minutes, 0), coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object('expiresAt', grant_expires_at));

  return jsonb_build_object(
    'success', true,
    'grantId', grant_id,
    'expiresAt', grant_expires_at,
    'aiCreditsGranted', coalesce(product_row.boost_ai_credits, 0),
    'huddleMinutesGranted', coalesce(product_row.boost_huddle_minutes, 0)
  );
end;
$$;

update public.boost_grants
set expiry_policy = 'three_months_active_subscription',
    expires_at = coalesce(expires_at, created_at + interval '3 months')
where expiry_policy = 'non_expiring'
   or expires_at is null;

do $$
declare
  target_user_id uuid;
begin
  for target_user_id in
    select distinct user_id
    from public.boost_grants
  loop
    perform public.sync_usage_summary_boosts(target_user_id, null);
  end loop;
end;
$$;
