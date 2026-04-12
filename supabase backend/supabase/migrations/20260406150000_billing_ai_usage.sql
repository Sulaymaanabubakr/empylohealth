create table if not exists public.plan_catalog (
  id text primary key,
  display_name text not null,
  monthly_price_gbp numeric(12,2),
  annual_price_gbp numeric(12,2),
  monthly_ai_credits integer,
  monthly_huddle_minutes integer,
  daily_huddle_starts integer,
  max_minutes_per_huddle integer,
  max_ai_context_tokens integer not null default 4000,
  max_ai_response_tokens integer not null default 500,
  capabilities jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.store_products (
  id uuid primary key default gen_random_uuid(),
  product_id text not null unique,
  platform text not null,
  product_type text not null,
  plan_id text references public.plan_catalog(id) on delete cascade,
  billing_cadence text,
  boost_ai_credits integer,
  boost_huddle_minutes integer,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  contact_email text not null default '',
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.organisation_plan_configs (
  organisation_id uuid primary key references public.organisations(id) on delete cascade,
  plan_id text not null default 'enterprise' references public.plan_catalog(id),
  monthly_ai_credits integer,
  monthly_huddle_minutes integer,
  daily_huddle_starts integer,
  max_minutes_per_huddle integer,
  concurrent_huddles_soft_cap integer,
  concurrent_users_soft_cap integer,
  warning_threshold_percent integer not null default 20,
  capabilities jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.organisation_seats (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organisation_id, user_id)
);

create table if not exists public.user_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  plan_id text not null references public.plan_catalog(id),
  status text not null default 'active',
  source text not null default 'system',
  billing_cadence text,
  organisation_id uuid references public.organisations(id) on delete set null,
  product_id text,
  external_customer_id text,
  external_subscription_id text,
  store_transaction_id text,
  started_at timestamptz not null default timezone('utc', now()),
  renewal_at timestamptz,
  expires_at timestamptz,
  canceled_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.billing_periods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entitlement_id uuid not null references public.user_entitlements(id) on delete cascade,
  period_start timestamptz not null,
  period_end timestamptz not null,
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, period_start, period_end)
);

create table if not exists public.usage_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  billing_period_id uuid not null references public.billing_periods(id) on delete cascade,
  ai_subscription_credits_total integer not null default 0,
  ai_subscription_credits_used integer not null default 0,
  ai_boost_credits_total integer not null default 0,
  ai_boost_credits_used integer not null default 0,
  huddle_subscription_minutes_total integer not null default 0,
  huddle_subscription_minutes_used integer not null default 0,
  huddle_boost_minutes_total integer not null default 0,
  huddle_boost_minutes_used integer not null default 0,
  huddle_starts_used_today integer not null default 0,
  huddle_starts_date date not null default current_date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, billing_period_id)
);

create table if not exists public.boost_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text references public.store_products(product_id) on delete set null,
  purchase_event_id uuid,
  ai_credits_granted integer not null default 0,
  ai_credits_used integer not null default 0,
  huddle_minutes_granted integer not null default 0,
  huddle_minutes_used integer not null default 0,
  expiry_policy text not null default 'non_expiring',
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.purchase_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  platform text not null,
  product_id text not null,
  product_type text not null,
  transaction_id text,
  original_transaction_id text,
  purchase_token text,
  idempotency_key text,
  status text not null default 'validated',
  amount_gbp numeric(12,2),
  payload jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique nulls not distinct (platform, transaction_id),
  unique nulls not distinct (platform, purchase_token)
);

create table if not exists public.idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  scope text not null,
  user_id uuid references auth.users(id) on delete cascade,
  key text not null,
  request_hash text,
  status text not null default 'pending',
  response jsonb,
  resource_type text,
  resource_id text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (scope, key)
);

create table if not exists public.usage_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  billing_period_id uuid references public.billing_periods(id) on delete cascade,
  operation_type text not null,
  idempotency_key text,
  reserved_ai_credits integer not null default 0,
  reserved_huddle_minutes integer not null default 0,
  status text not null default 'pending',
  request_payload jsonb not null default '{}'::jsonb,
  result_payload jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique nulls not distinct (user_id, operation_type, idempotency_key)
);

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  billing_period_id uuid references public.billing_periods(id) on delete cascade,
  usage_attempt_id uuid references public.usage_attempts(id) on delete set null,
  source_id text,
  event_type text not null,
  amount integer not null default 0,
  plan_id text,
  organisation_id uuid references public.organisations(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  unique nulls not distinct (event_type, source_id)
);

create table if not exists public.ai_challenge_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  usage_attempt_id uuid references public.usage_attempts(id) on delete set null,
  provider text not null default 'openai',
  model text not null default '',
  status text not null default 'pending',
  source_summary jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (assessment_id)
);

create table if not exists public.ai_challenges (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.ai_challenge_runs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  title text not null,
  level text not null,
  explanation text not null default '',
  suggestions text[] not null default '{}'::text[],
  details jsonb not null default '{}'::jsonb,
  position integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  organisation_id uuid references public.organisations(id) on delete set null,
  event_type text not null,
  plan_id text,
  amount integer,
  amount_gbp numeric(12,2),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.observability_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  organisation_id uuid references public.organisations(id) on delete set null,
  event_type text not null,
  severity text not null default 'info',
  metric_name text,
  metric_value numeric,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.plan_catalog enable row level security;
alter table public.store_products enable row level security;
alter table public.organisations enable row level security;
alter table public.organisation_plan_configs enable row level security;
alter table public.organisation_seats enable row level security;
alter table public.user_entitlements enable row level security;
alter table public.billing_periods enable row level security;
alter table public.usage_summaries enable row level security;
alter table public.boost_grants enable row level security;
alter table public.purchase_events enable row level security;
alter table public.idempotency_keys enable row level security;
alter table public.usage_attempts enable row level security;
alter table public.usage_events enable row level security;
alter table public.ai_challenge_runs enable row level security;
alter table public.ai_challenges enable row level security;
alter table public.analytics_events enable row level security;
alter table public.observability_events enable row level security;

create index if not exists organisation_seats_user_active_idx
  on public.organisation_seats (user_id, is_active);
create index if not exists user_entitlements_plan_status_idx
  on public.user_entitlements (plan_id, status);
create index if not exists billing_periods_user_status_idx
  on public.billing_periods (user_id, status, period_end desc);
create index if not exists usage_summaries_user_period_idx
  on public.usage_summaries (user_id, billing_period_id);
create index if not exists usage_events_user_created_idx
  on public.usage_events (user_id, created_at desc);
create index if not exists analytics_events_type_created_idx
  on public.analytics_events (event_type, created_at desc);
create index if not exists observability_events_type_created_idx
  on public.observability_events (event_type, created_at desc);
create index if not exists ai_challenges_user_created_idx
  on public.ai_challenges (user_id, created_at desc);

drop trigger if exists plan_catalog_set_updated_at on public.plan_catalog;
create trigger plan_catalog_set_updated_at before update on public.plan_catalog
for each row execute function public.set_updated_at();
drop trigger if exists store_products_set_updated_at on public.store_products;
create trigger store_products_set_updated_at before update on public.store_products
for each row execute function public.set_updated_at();
drop trigger if exists organisations_set_updated_at on public.organisations;
create trigger organisations_set_updated_at before update on public.organisations
for each row execute function public.set_updated_at();
drop trigger if exists organisation_plan_configs_set_updated_at on public.organisation_plan_configs;
create trigger organisation_plan_configs_set_updated_at before update on public.organisation_plan_configs
for each row execute function public.set_updated_at();
drop trigger if exists organisation_seats_set_updated_at on public.organisation_seats;
create trigger organisation_seats_set_updated_at before update on public.organisation_seats
for each row execute function public.set_updated_at();
drop trigger if exists user_entitlements_set_updated_at on public.user_entitlements;
create trigger user_entitlements_set_updated_at before update on public.user_entitlements
for each row execute function public.set_updated_at();
drop trigger if exists billing_periods_set_updated_at on public.billing_periods;
create trigger billing_periods_set_updated_at before update on public.billing_periods
for each row execute function public.set_updated_at();
drop trigger if exists usage_summaries_set_updated_at on public.usage_summaries;
create trigger usage_summaries_set_updated_at before update on public.usage_summaries
for each row execute function public.set_updated_at();
drop trigger if exists boost_grants_set_updated_at on public.boost_grants;
create trigger boost_grants_set_updated_at before update on public.boost_grants
for each row execute function public.set_updated_at();
drop trigger if exists purchase_events_set_updated_at on public.purchase_events;
create trigger purchase_events_set_updated_at before update on public.purchase_events
for each row execute function public.set_updated_at();
drop trigger if exists idempotency_keys_set_updated_at on public.idempotency_keys;
create trigger idempotency_keys_set_updated_at before update on public.idempotency_keys
for each row execute function public.set_updated_at();
drop trigger if exists usage_attempts_set_updated_at on public.usage_attempts;
create trigger usage_attempts_set_updated_at before update on public.usage_attempts
for each row execute function public.set_updated_at();
drop trigger if exists ai_challenge_runs_set_updated_at on public.ai_challenge_runs;
create trigger ai_challenge_runs_set_updated_at before update on public.ai_challenge_runs
for each row execute function public.set_updated_at();
drop trigger if exists ai_challenges_set_updated_at on public.ai_challenges;
create trigger ai_challenges_set_updated_at before update on public.ai_challenges
for each row execute function public.set_updated_at();

insert into public.plan_catalog (
  id, display_name, monthly_price_gbp, annual_price_gbp, monthly_ai_credits, monthly_huddle_minutes,
  daily_huddle_starts, max_minutes_per_huddle, max_ai_context_tokens, max_ai_response_tokens, capabilities, metadata
)
values
(
  'free', 'Free', 0, 0, 16, 48, 2, 10, 2500, 300,
  jsonb_build_object(
    'canJoinHuddles', true, 'canStartHuddles', false, 'canScheduleHuddles', false,
    'canUseAiAssistant', false, 'hasFullKeyChallenges', false, 'canUseBoosts', false,
    'canShareActivities', false, 'canAccessGroupActivities', false, 'hasCoachRole', false,
    'canReviewWellbeingScores', false, 'canTrackAttendance', false, 'canTrackProgramme', false,
    'canAssignActivities', false, 'canAssignCourses', false
  ),
  jsonb_build_object('basicKeyChallenges', true)
),
(
  'pro', 'Pro', 9.99, 99.99, 160, 240, 3, 30, 5000, 700,
  jsonb_build_object(
    'canJoinHuddles', true, 'canStartHuddles', true, 'canScheduleHuddles', false,
    'canUseAiAssistant', true, 'hasFullKeyChallenges', true, 'canUseBoosts', true,
    'canShareActivities', true, 'canAccessGroupActivities', true, 'hasCoachRole', false,
    'canReviewWellbeingScores', false, 'canTrackAttendance', false, 'canTrackProgramme', false,
    'canAssignActivities', false, 'canAssignCourses', false
  ),
  '{}'::jsonb
),
(
  'premium', 'Premium', 24.99, 249.99, 480, 640, 5, 60, 8000, 1200,
  jsonb_build_object(
    'canJoinHuddles', true, 'canStartHuddles', true, 'canScheduleHuddles', true,
    'canUseAiAssistant', true, 'hasFullKeyChallenges', true, 'canUseBoosts', true,
    'canShareActivities', true, 'canAccessGroupActivities', true, 'hasCoachRole', false,
    'canReviewWellbeingScores', false, 'canTrackAttendance', false, 'canTrackProgramme', false,
    'canAssignActivities', false, 'canAssignCourses', false
  ),
  '{}'::jsonb
),
(
  'enterprise', 'Coach+', null, null, null, null, null, 90, 12000, 1600,
  jsonb_build_object(
    'canJoinHuddles', true, 'canStartHuddles', true, 'canScheduleHuddles', true,
    'canUseAiAssistant', true, 'hasFullKeyChallenges', true, 'canUseBoosts', false,
    'canShareActivities', true, 'canAccessGroupActivities', true, 'hasCoachRole', true,
    'canReviewWellbeingScores', true, 'canTrackAttendance', true, 'canTrackProgramme', true,
    'canAssignActivities', true, 'canAssignCourses', true
  ),
  jsonb_build_object('externalOnly', true)
)
on conflict (id) do update
set
  display_name = excluded.display_name,
  monthly_price_gbp = excluded.monthly_price_gbp,
  annual_price_gbp = excluded.annual_price_gbp,
  monthly_ai_credits = excluded.monthly_ai_credits,
  monthly_huddle_minutes = excluded.monthly_huddle_minutes,
  daily_huddle_starts = excluded.daily_huddle_starts,
  max_minutes_per_huddle = excluded.max_minutes_per_huddle,
  max_ai_context_tokens = excluded.max_ai_context_tokens,
  max_ai_response_tokens = excluded.max_ai_response_tokens,
  capabilities = excluded.capabilities,
  metadata = excluded.metadata;

create or replace function public.private_hash_request(payload jsonb)
returns text
language sql
immutable
as $$
  select md5(coalesce(payload::text, ''));
$$;

create or replace function public.ensure_user_entitlement(p_user_id uuid)
returns uuid
language plpgsql
security definer
as $$
declare
  entitlement_id uuid;
begin
  select id into entitlement_id
  from public.user_entitlements
  where user_id = p_user_id
  for update;

  if entitlement_id is null then
    insert into public.user_entitlements (user_id, plan_id, status, source, billing_cadence, renewal_at, expires_at)
    values (
      p_user_id,
      'free',
      'active',
      'system',
      'monthly',
      timezone('utc', now()) + interval '1 month',
      timezone('utc', now()) + interval '1 month'
    )
    returning id into entitlement_id;
  end if;

  return entitlement_id;
end;
$$;

create or replace function public.ensure_billing_period(p_user_id uuid)
returns uuid
language plpgsql
security definer
as $$
declare
  entitlement_row public.user_entitlements%rowtype;
  period_id uuid;
  period_start_at timestamptz;
  period_end_at timestamptz;
  plan_row public.plan_catalog%rowtype;
  org_config public.organisation_plan_configs%rowtype;
begin
  perform public.ensure_user_entitlement(p_user_id);

  select * into entitlement_row
  from public.user_entitlements
  where user_id = p_user_id
  for update;

  select id into period_id
  from public.billing_periods
  where user_id = p_user_id
    and status = 'active'
    and period_end > timezone('utc', now())
  limit 1;

  if period_id is not null then
    return period_id;
  end if;

  select * into plan_row
  from public.plan_catalog
  where id = entitlement_row.plan_id;

  if entitlement_row.organisation_id is not null then
    select * into org_config
    from public.organisation_plan_configs
    where organisation_id = entitlement_row.organisation_id;
  end if;

  update public.billing_periods
  set status = 'closed'
  where user_id = p_user_id
    and status = 'active';

  period_start_at := timezone('utc', now());
  period_end_at := coalesce(entitlement_row.renewal_at, period_start_at + interval '1 month');

  insert into public.billing_periods (user_id, entitlement_id, period_start, period_end, status)
  values (p_user_id, entitlement_row.id, period_start_at, period_end_at, 'active')
  returning id into period_id;

  insert into public.usage_summaries (
    user_id, billing_period_id,
    ai_subscription_credits_total,
    huddle_subscription_minutes_total,
    huddle_starts_date
  )
  values (
    p_user_id,
    period_id,
    coalesce(org_config.monthly_ai_credits, plan_row.monthly_ai_credits, 0),
    coalesce(org_config.monthly_huddle_minutes, plan_row.monthly_huddle_minutes, 0),
    (timezone('utc', now()))::date
  )
  on conflict (user_id, billing_period_id) do nothing;

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

create or replace function public.claim_idempotency(
  p_scope text,
  p_user_id uuid,
  p_key text,
  p_request_hash text default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  existing_row public.idempotency_keys%rowtype;
begin
  if p_key is null or length(trim(p_key)) = 0 then
    return jsonb_build_object('status', 'missing');
  end if;

  insert into public.idempotency_keys (scope, user_id, key, request_hash, status)
  values (p_scope, p_user_id, p_key, p_request_hash, 'pending')
  on conflict (scope, key) do nothing;

  select * into existing_row
  from public.idempotency_keys
  where scope = p_scope and key = p_key
  for update;

  return jsonb_build_object(
    'status', existing_row.status,
    'response', existing_row.response,
    'resourceType', existing_row.resource_type,
    'resourceId', existing_row.resource_id
  );
end;
$$;

create or replace function public.complete_idempotency(
  p_scope text,
  p_key text,
  p_response jsonb,
  p_resource_type text default null,
  p_resource_id text default null
)
returns void
language plpgsql
security definer
as $$
begin
  update public.idempotency_keys
  set status = 'completed',
      response = p_response,
      resource_type = p_resource_type,
      resource_id = p_resource_id
  where scope = p_scope and key = p_key;
end;
$$;

create or replace function public.fail_idempotency(
  p_scope text,
  p_key text,
  p_response jsonb
)
returns void
language plpgsql
security definer
as $$
begin
  update public.idempotency_keys
  set status = 'failed',
      response = p_response
  where scope = p_scope and key = p_key;
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
  usage_row public.usage_summaries%rowtype;
  daily_limit integer;
begin
  status_json := public.resolve_subscription_status(p_user_id);
  if coalesce((status_json -> 'capabilities' ->> 'canStartHuddles')::boolean, false) = false then
    return jsonb_build_object('allowed', false, 'reasonCode', 'cannot_start_huddles', 'message', 'Your plan does not allow starting huddles.');
  end if;

  period_id := public.ensure_billing_period(p_user_id);
  select * into usage_row
  from public.usage_summaries
  where user_id = p_user_id and billing_period_id = period_id
  for update;

  daily_limit := coalesce((status_json -> 'limits' ->> 'dailyHuddleStarts')::integer, 0);
  if usage_row.huddle_starts_date <> (timezone('utc', now()))::date then
    usage_row.huddle_starts_used_today := 0;
    usage_row.huddle_starts_date := (timezone('utc', now()))::date;
  end if;

  if daily_limit > 0 and usage_row.huddle_starts_used_today >= daily_limit then
    return jsonb_build_object('allowed', false, 'reasonCode', 'daily_huddle_starts_reached', 'message', 'You have reached your daily huddle start limit.');
  end if;

  update public.usage_summaries
  set huddle_starts_used_today = usage_row.huddle_starts_used_today + 1,
      huddle_starts_date = usage_row.huddle_starts_date
  where id = usage_row.id;

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
  total_remaining integer;
  remaining_to_deduct integer;
  subscription_remaining integer;
  boost_remaining integer;
begin
  if p_minutes <= 0 then
    return jsonb_build_object('success', true, 'deducted', 0);
  end if;

  period_id := public.ensure_billing_period(p_user_id);
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
    update public.usage_summaries
    set huddle_boost_minutes_used = huddle_boost_minutes_used + remaining_to_deduct
    where id = usage_row.id;
  end if;

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
  subscription_remaining integer;
  remaining_to_deduct integer;
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
    update public.usage_summaries
    set ai_boost_credits_used = ai_boost_credits_used + remaining_to_deduct
    where id = usage_row.id;
  end if;

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

create or replace function public.release_ai_credits(
  p_attempt_id uuid,
  p_error_message text default null,
  p_result_payload jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  attempt_row public.usage_attempts%rowtype;
begin
  select * into attempt_row
  from public.usage_attempts
  where id = p_attempt_id
  for update;

  if attempt_row.id is null then
    return jsonb_build_object('success', false, 'reasonCode', 'attempt_not_found');
  end if;

  if attempt_row.status in ('released', 'failed') then
    return jsonb_build_object('success', true, 'replayed', true);
  end if;

  if attempt_row.status = 'completed' then
    return jsonb_build_object('success', true, 'alreadyCompleted', true);
  end if;

  update public.usage_attempts
  set status = 'released',
      error_message = p_error_message,
      result_payload = coalesce(p_result_payload, '{}'::jsonb)
  where id = attempt_row.id;

  return jsonb_build_object('success', true);
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
  usage_row public.usage_summaries%rowtype;
  grant_id uuid;
begin
  select * into product_row
  from public.store_products
  where product_id = p_product_id
    and is_active = true
  for update;

  if product_row.id is null then
    return jsonb_build_object('success', false, 'reasonCode', 'product_not_found');
  end if;

  period_id := public.ensure_billing_period(p_user_id);

  insert into public.boost_grants (
    user_id, product_id, purchase_event_id, ai_credits_granted, huddle_minutes_granted, expiry_policy, metadata
  )
  values (
    p_user_id, p_product_id, p_purchase_event_id, coalesce(product_row.boost_ai_credits, 0), coalesce(product_row.boost_huddle_minutes, 0), 'non_expiring', coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into grant_id;

  select * into usage_row
  from public.usage_summaries
  where user_id = p_user_id and billing_period_id = period_id
  for update;

  update public.usage_summaries
  set ai_boost_credits_total = ai_boost_credits_total + coalesce(product_row.boost_ai_credits, 0),
      huddle_boost_minutes_total = huddle_boost_minutes_total + coalesce(product_row.boost_huddle_minutes, 0)
  where id = usage_row.id;

  insert into public.usage_events (user_id, billing_period_id, source_id, event_type, amount, metadata)
  values
    (p_user_id, period_id, grant_id::text, 'boost_ai_granted', coalesce(product_row.boost_ai_credits, 0), coalesce(p_metadata, '{}'::jsonb)),
    (p_user_id, period_id, grant_id::text, 'boost_huddle_granted', coalesce(product_row.boost_huddle_minutes, 0), coalesce(p_metadata, '{}'::jsonb));

  return jsonb_build_object(
    'success', true,
    'grantId', grant_id,
    'aiCreditsGranted', coalesce(product_row.boost_ai_credits, 0),
    'huddleMinutesGranted', coalesce(product_row.boost_huddle_minutes, 0)
  );
end;
$$;

create policy plan_catalog_select_active
on public.plan_catalog
for select
to authenticated
using (is_active = true);

create policy store_products_select_active
on public.store_products
for select
to authenticated
using (is_active = true);

create policy user_entitlements_select_own
on public.user_entitlements
for select
to authenticated
using (auth.uid() = user_id);

create policy billing_periods_select_own
on public.billing_periods
for select
to authenticated
using (auth.uid() = user_id);

create policy usage_summaries_select_own
on public.usage_summaries
for select
to authenticated
using (auth.uid() = user_id);

create policy boost_grants_select_own
on public.boost_grants
for select
to authenticated
using (auth.uid() = user_id);

create policy ai_challenge_runs_select_own
on public.ai_challenge_runs
for select
to authenticated
using (auth.uid() = user_id);

create policy ai_challenges_select_own
on public.ai_challenges
for select
to authenticated
using (auth.uid() = user_id);

create policy organisation_seats_select_own
on public.organisation_seats
for select
to authenticated
using (auth.uid() = user_id);

insert into public.store_products (
  product_id, platform, product_type, plan_id, billing_cadence, boost_ai_credits, boost_huddle_minutes, metadata
) values
  ('circles.pro.monthly.ios', 'ios', 'subscription', 'pro', 'monthly', null, null, '{}'::jsonb),
  ('circles.pro.annual.ios', 'ios', 'subscription', 'pro', 'annual', null, null, '{}'::jsonb),
  ('circles.premium.monthly.ios', 'ios', 'subscription', 'premium', 'monthly', null, null, '{}'::jsonb),
  ('circles.premium.annual.ios', 'ios', 'subscription', 'premium', 'annual', null, null, '{}'::jsonb),
  ('circles.pro.monthly.android', 'android', 'subscription', 'pro', 'monthly', null, null, '{}'::jsonb),
  ('circles.pro.annual.android', 'android', 'subscription', 'pro', 'annual', null, null, '{}'::jsonb),
  ('circles.premium.monthly.android', 'android', 'subscription', 'premium', 'monthly', null, null, '{}'::jsonb),
  ('circles.premium.annual.android', 'android', 'subscription', 'premium', 'annual', null, null, '{}'::jsonb),
  ('circles.boost.small.ios', 'ios', 'boost', null, null, 30, 40, jsonb_build_object('priceLabel', '£2.99', 'displayName', 'Small Boost')),
  ('circles.boost.medium.ios', 'ios', 'boost', null, null, 60, 80, jsonb_build_object('priceLabel', '£5.99', 'displayName', 'Medium Boost')),
  ('circles.boost.large.ios', 'ios', 'boost', null, null, 100, 130, jsonb_build_object('priceLabel', '£9.99', 'displayName', 'Large Boost')),
  ('circles.boost.small.android', 'android', 'boost', null, null, 30, 40, jsonb_build_object('priceLabel', '£2.99', 'displayName', 'Small Boost')),
  ('circles.boost.medium.android', 'android', 'boost', null, null, 60, 80, jsonb_build_object('priceLabel', '£5.99', 'displayName', 'Medium Boost')),
  ('circles.boost.large.android', 'android', 'boost', null, null, 100, 130, jsonb_build_object('priceLabel', '£9.99', 'displayName', 'Large Boost'))
on conflict (product_id) do update
set
  platform = excluded.platform,
  product_type = excluded.product_type,
  plan_id = excluded.plan_id,
  billing_cadence = excluded.billing_cadence,
  boost_ai_credits = excluded.boost_ai_credits,
  boost_huddle_minutes = excluded.boost_huddle_minutes,
  metadata = excluded.metadata,
  is_active = true;

alter table public.huddle_participants
  add column if not exists grace_started_at timestamptz,
  add column if not exists grace_expires_at timestamptz,
  add column if not exists disconnect_pending boolean not null default false,
  add column if not exists metered_seconds integer not null default 0;
