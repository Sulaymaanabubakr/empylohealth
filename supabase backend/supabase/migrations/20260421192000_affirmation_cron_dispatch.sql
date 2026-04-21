create extension if not exists pg_net;
create extension if not exists pg_cron;

create or replace function public.dispatch_daily_affirmation_slot(
  target_slot text,
  target_day date default (timezone('Africa/Lagos', now()))::date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_slot text := lower(coalesce(target_slot, 'morning'));
  dispatch_key text := format('daily-affirmation:%s:%s', target_day, normalized_slot);
  title_text text := case
    when normalized_slot = 'afternoon' then 'Afternoon affirmation'
    when normalized_slot = 'evening' then 'Evening affirmation'
    else 'Morning affirmation'
  end;
  affirmation_row record;
  sent_count integer := 0;
  push_messages jsonb := '[]'::jsonb;
begin
  if normalized_slot not in ('morning', 'afternoon', 'evening') then
    raise exception 'Invalid affirmation slot: %', normalized_slot;
  end if;

  insert into public.notification_dispatches (dispatch_key, kind, metadata)
  values (
    dispatch_key,
    'daily_affirmation',
    jsonb_build_object('dayKey', target_day, 'slotKey', normalized_slot, 'source', 'pg_cron')
  )
  on conflict (dispatch_key) do nothing;

  if not found then
    return jsonb_build_object('success', true, 'skipped', true, 'reason', 'already-dispatched', 'slotKey', normalized_slot);
  end if;

  select
    affirmations.id,
    affirmations.content,
    affirmations.image
  into affirmation_row
  from public.daily_affirmations
  join public.affirmations on affirmations.id = daily_affirmations.affirmation_id
  where daily_affirmations.day_key = target_day
    and daily_affirmations.slot_key = normalized_slot
    and affirmations.status = 'active'
  limit 1;

  if not found then
    return jsonb_build_object('success', true, 'skipped', true, 'reason', 'no-affirmation', 'slotKey', normalized_slot);
  end if;

  insert into public.notifications (
    user_id,
    type,
    title,
    body,
    image,
    data
  )
  select
    profiles.id,
    'DAILY_AFFIRMATION',
    title_text,
    left(coalesce(affirmation_row.content, 'Take a mindful moment today.'), 120),
    coalesce(affirmation_row.image, ''),
    jsonb_build_object(
      'type', 'DAILY_AFFIRMATION',
      'affirmationId', affirmation_row.id,
      'slotKey', normalized_slot
    )
  from public.profiles
  where coalesce(array_length(profiles.expo_push_tokens, 1), 0) > 0;

  get diagnostics sent_count = row_count;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'to', token,
      'title', title_text,
      'body', left(coalesce(affirmation_row.content, 'Take a mindful moment today.'), 120),
      'sound', 'default',
      'data', jsonb_build_object(
        'type', 'DAILY_AFFIRMATION',
        'affirmationId', affirmation_row.id,
        'slotKey', normalized_slot,
        'image', coalesce(affirmation_row.image, '')
      ),
      'channelId', 'default',
      'priority', 'high'
    )
  ), '[]'::jsonb)
  into push_messages
  from (
    select unnest(profiles.expo_push_tokens) as token
    from public.profiles
    where coalesce(array_length(profiles.expo_push_tokens, 1), 0) > 0
  ) tokens
  where token ~ '^(ExponentPushToken|ExpoPushToken)\\[[^\\]]+\\]$';

  if jsonb_array_length(push_messages) > 0 then
    perform net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      headers := '{"Content-Type":"application/json","Accept":"application/json"}'::jsonb,
      body := push_messages
    );
  end if;

  return jsonb_build_object(
    'success', true,
    'sent', sent_count,
    'slotKey', normalized_slot,
    'affirmationId', affirmation_row.id
  );
end;
$$;

do $$
declare
  job record;
begin
  for job in
    select jobid
    from cron.job
    where jobname in (
      'affirmation-morning-lagos',
      'affirmation-afternoon-lagos',
      'affirmation-evening-lagos'
    )
  loop
    perform cron.unschedule(job.jobid);
  end loop;
end;
$$;

select cron.schedule(
  'affirmation-morning-lagos',
  '0 7 * * *',
  $$select public.dispatch_daily_affirmation_slot('morning');$$
);

select cron.schedule(
  'affirmation-afternoon-lagos',
  '0 12 * * *',
  $$select public.dispatch_daily_affirmation_slot('afternoon');$$
);

select cron.schedule(
  'affirmation-evening-lagos',
  '0 18 * * *',
  $$select public.dispatch_daily_affirmation_slot('evening');$$
);
