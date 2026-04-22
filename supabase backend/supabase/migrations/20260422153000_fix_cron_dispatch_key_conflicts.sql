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
  v_dispatch_key text := format('daily-affirmation:%s:%s', target_day, normalized_slot);
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
    v_dispatch_key,
    'daily_affirmation',
    jsonb_build_object('dayKey', target_day, 'slotKey', normalized_slot, 'source', 'pg_cron')
  )
  on conflict ((notification_dispatches.dispatch_key)) do nothing;

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

create or replace function public.dispatch_planner_item_reminders()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  start_window timestamptz := timezone('utc', now()) - interval '5 minutes';
  end_window timestamptz := timezone('utc', now()) + interval '5 minutes';
  item_row record;
  v_dispatch_key text;
  type_label text;
  body_text text;
  sent_count integer := 0;
  inserted_count integer := 0;
  push_messages jsonb := '[]'::jsonb;
begin
  for item_row in
    select
      planner_items.id,
      planner_items.user_id,
      planner_items.title,
      planner_items.item_type,
      planner_items.scheduled_for
    from public.planner_items
    where planner_items.status = 'pending'
      and planner_items.scheduled_for >= start_window
      and planner_items.scheduled_for <= end_window
    order by planner_items.scheduled_for asc
  loop
    v_dispatch_key := format(
      'planner-item:%s:%s',
      item_row.id,
      to_char(item_row.scheduled_for at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
    );

    insert into public.notification_dispatches (dispatch_key, kind, metadata)
    values (
      v_dispatch_key,
      'planner_item',
      jsonb_build_object(
        'itemId', item_row.id,
        'userId', item_row.user_id,
        'scheduledFor', item_row.scheduled_for,
        'itemType', item_row.item_type,
        'source', 'pg_cron'
      )
    )
    on conflict ((notification_dispatches.dispatch_key)) do nothing;

    if not found then
      continue;
    end if;

    type_label := case item_row.item_type
      when 'event' then 'Event'
      when 'huddle' then 'Huddle reminder'
      else 'Task'
    end;

    body_text := case item_row.item_type
      when 'event' then 'Your planned event is due around now.'
      when 'huddle' then 'Your huddle reminder is due around now.'
      else 'Your planned task is due around now.'
    end;

    insert into public.notifications (
      user_id,
      type,
      title,
      body,
      data
    )
    values (
      item_row.user_id,
      'PLANNER_ITEM_REMINDER',
      coalesce(nullif(item_row.title, ''), type_label),
      body_text,
      jsonb_build_object(
        'type', 'PLANNER_ITEM_REMINDER',
        'plannerItemId', item_row.id,
        'plannerDate', (item_row.scheduled_for at time zone 'UTC')::date,
        'itemType', item_row.item_type,
        'scheduledFor', item_row.scheduled_for
      )
    );

    inserted_count := inserted_count + 1;

    select coalesce(jsonb_agg(
      jsonb_build_object(
        'to', token,
        'title', coalesce(nullif(item_row.title, ''), type_label),
        'body', body_text,
        'sound', 'default',
        'data', jsonb_build_object(
          'type', 'PLANNER_ITEM_REMINDER',
          'plannerItemId', item_row.id,
          'plannerDate', (item_row.scheduled_for at time zone 'UTC')::date,
          'itemType', item_row.item_type,
          'scheduledFor', item_row.scheduled_for
        ),
        'channelId', 'default',
        'priority', 'high'
      )
    ), '[]'::jsonb)
    into push_messages
    from (
      select unnest(profiles.expo_push_tokens) as token
      from public.profiles
      where profiles.id = item_row.user_id
        and coalesce(array_length(profiles.expo_push_tokens, 1), 0) > 0
    ) tokens
    where token ~ '^(ExponentPushToken|ExpoPushToken)\\[[^\\]]+\\]$';

    if jsonb_array_length(push_messages) > 0 then
      perform net.http_post(
        url := 'https://exp.host/--/api/v2/push/send',
        headers := '{"Content-Type":"application/json","Accept":"application/json"}'::jsonb,
        body := push_messages
      );
      sent_count := sent_count + jsonb_array_length(push_messages);
    end if;
  end loop;

  return jsonb_build_object(
    'success', true,
    'notificationsInserted', inserted_count,
    'pushMessages', sent_count
  );
end;
$$;

create or replace function public.dispatch_scheduled_huddle_reminders()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  start_window timestamptz := timezone('utc', now()) - interval '5 minutes';
  end_window timestamptz := timezone('utc', now()) + interval '5 minutes';
  event_row record;
  v_dispatch_key text;
  inserted_count integer := 0;
  inserted_rows integer := 0;
  push_count integer := 0;
  push_messages jsonb := '[]'::jsonb;
begin
  for event_row in
    select
      sh.id,
      sh.circle_id,
      sh.chat_id,
      sh.title,
      sh.scheduled_at,
      c.name as circle_name,
      c.image as circle_image
    from public.scheduled_huddles sh
    left join public.circles c on c.id = sh.circle_id
    where sh.reminder_enabled = true
      and sh.scheduled_at >= start_window
      and sh.scheduled_at <= end_window
    order by sh.scheduled_at asc
  loop
    v_dispatch_key := format('scheduled-huddle:%s', event_row.id);

    insert into public.notification_dispatches (dispatch_key, kind, metadata)
    values (
      v_dispatch_key,
      'scheduled_huddle',
      jsonb_build_object(
        'eventId', event_row.id,
        'circleId', event_row.circle_id,
        'chatId', event_row.chat_id,
        'scheduledAt', event_row.scheduled_at,
        'source', 'pg_cron'
      )
    )
    on conflict ((notification_dispatches.dispatch_key)) do nothing;

    if not found then
      continue;
    end if;

    insert into public.notifications (
      user_id,
      type,
      title,
      body,
      avatar,
      data
    )
    select
      cm.user_id,
      'SCHEDULED_HUDDLE_REMINDER',
      coalesce(nullif(event_row.title, ''), nullif(event_row.circle_name, ''), 'Scheduled huddle'),
      format('Starting around now in %s', coalesce(nullif(event_row.circle_name, ''), 'your circle')),
      coalesce(event_row.circle_image, ''),
      jsonb_build_object(
        'type', 'SCHEDULED_HUDDLE_REMINDER',
        'eventId', event_row.id,
        'circleId', event_row.circle_id,
        'chatId', event_row.chat_id,
        'scheduledAt', event_row.scheduled_at
      )
    from public.circle_members cm
    where cm.circle_id = event_row.circle_id
      and cm.status = 'active';

    get diagnostics inserted_rows = row_count;
    inserted_count := inserted_count + inserted_rows;

    select coalesce(jsonb_agg(
      jsonb_build_object(
        'to', token,
        'title', coalesce(nullif(event_row.title, ''), nullif(event_row.circle_name, ''), 'Scheduled huddle'),
        'body', format('Starting around now in %s', coalesce(nullif(event_row.circle_name, ''), 'your circle')),
        'sound', 'default',
        'data', jsonb_build_object(
          'type', 'SCHEDULED_HUDDLE_REMINDER',
          'eventId', event_row.id,
          'circleId', event_row.circle_id,
          'chatId', event_row.chat_id,
          'scheduledAt', event_row.scheduled_at,
          'avatar', coalesce(event_row.circle_image, '')
        ),
        'channelId', 'default',
        'priority', 'high'
      )
    ), '[]'::jsonb)
    into push_messages
    from (
      select unnest(p.expo_push_tokens) as token
      from public.circle_members cm
      join public.profiles p on p.id = cm.user_id
      where cm.circle_id = event_row.circle_id
        and cm.status = 'active'
        and coalesce(array_length(p.expo_push_tokens, 1), 0) > 0
    ) tokens
    where token ~ '^(ExponentPushToken|ExpoPushToken)\\[[^\\]]+\\]$';

    if jsonb_array_length(push_messages) > 0 then
      perform net.http_post(
        url := 'https://exp.host/--/api/v2/push/send',
        headers := '{"Content-Type":"application/json","Accept":"application/json"}'::jsonb,
        body := push_messages
      );
      push_count := push_count + jsonb_array_length(push_messages);
    end if;
  end loop;

  return jsonb_build_object(
    'success', true,
    'notificationsInserted', inserted_count,
    'pushMessages', push_count
  );
end;
$$;
