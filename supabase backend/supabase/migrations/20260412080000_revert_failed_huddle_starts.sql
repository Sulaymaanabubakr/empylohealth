create or replace function public.revert_huddle_start(
  p_user_id uuid,
  p_source_id text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  period_id uuid;
  usage_row public.usage_summaries%rowtype;
  reverted boolean := false;
begin
  period_id := public.ensure_billing_period(p_user_id);

  select * into usage_row
  from public.usage_summaries
  where user_id = p_user_id and billing_period_id = period_id
  for update;

  if usage_row.id is null then
    return jsonb_build_object('success', false, 'reverted', false);
  end if;

  if usage_row.huddle_starts_date = (timezone('utc', now()))::date
     and coalesce(usage_row.huddle_starts_used_today, 0) > 0 then
    update public.usage_summaries
    set huddle_starts_used_today = greatest(huddle_starts_used_today - 1, 0)
    where id = usage_row.id;
    reverted := true;
  end if;

  delete from public.usage_events
  where event_type = 'huddle_start'
    and source_id = p_source_id
    and user_id = p_user_id
    and billing_period_id = period_id;

  return jsonb_build_object('success', true, 'reverted', reverted);
end;
$$;
