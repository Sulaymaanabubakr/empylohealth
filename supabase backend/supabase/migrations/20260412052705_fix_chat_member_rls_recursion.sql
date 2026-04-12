create or replace function public.is_chat_member(target_chat_id uuid, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.chat_participants cp
    where cp.chat_id = target_chat_id
      and cp.user_id = target_user_id
      and cp.left_at is null
  );
$$;

revoke all on function public.is_chat_member(uuid, uuid) from public;
grant execute on function public.is_chat_member(uuid, uuid) to authenticated;
