create extension if not exists pg_net;
create extension if not exists pg_cron;

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
  dispatch_key text;
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
    dispatch_key := format('scheduled-huddle:%s', event_row.id);

    insert into public.notification_dispatches (dispatch_key, kind, metadata)
    values (
      dispatch_key,
      'scheduled_huddle',
      jsonb_build_object(
        'eventId', event_row.id,
        'circleId', event_row.circle_id,
        'chatId', event_row.chat_id,
        'scheduledAt', event_row.scheduled_at,
        'source', 'pg_cron'
      )
    )
    on conflict (dispatch_key) do nothing;

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

do $$
declare
  job record;
begin
  for job in
    select jobid
    from cron.job
    where jobname in ('scheduled-huddle-reminders-every-minute')
  loop
    perform cron.unschedule(job.jobid);
  end loop;
end;
$$;

select cron.schedule(
  'scheduled-huddle-reminders-every-minute',
  '* * * * *',
  $$select public.dispatch_scheduled_huddle_reminders();$$
);
