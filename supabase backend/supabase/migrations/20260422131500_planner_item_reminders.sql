create extension if not exists pg_net;
create extension if not exists pg_cron;

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
  dispatch_key text;
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
    dispatch_key := format(
      'planner-item:%s:%s',
      item_row.id,
      to_char(item_row.scheduled_for at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
    );

    insert into public.notification_dispatches (dispatch_key, kind, metadata)
    values (
      dispatch_key,
      'planner_item',
      jsonb_build_object(
        'itemId', item_row.id,
        'userId', item_row.user_id,
        'scheduledFor', item_row.scheduled_for,
        'itemType', item_row.item_type,
        'source', 'pg_cron'
      )
    )
    on conflict (dispatch_key) do nothing;

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

do $$
declare
  job record;
begin
  for job in
    select jobid
    from cron.job
    where jobname in ('planner-item-reminders-every-5m')
  loop
    perform cron.unschedule(job.jobid);
  end loop;
end;
$$;

select cron.schedule(
  'planner-item-reminders-every-5m',
  '*/5 * * * *',
  $$select public.dispatch_planner_item_reminders();$$
);
