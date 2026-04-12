alter table public.circles
  add column if not exists chat_id uuid references public.chats(id) on delete set null;

create index if not exists circles_chat_id_idx
  on public.circles (chat_id)
  where chat_id is not null;

with existing_circle_chats as (
  select distinct on (c.id)
    c.id as circle_id,
    ch.id as chat_id
  from public.circles c
  join public.chats ch on ch.circle_id = c.id
  where c.chat_id is null
    and coalesce(c.status, 'active') <> 'deleted'
  order by c.id, ch.created_at asc, ch.id asc
)
update public.circles c
set chat_id = e.chat_id
from existing_circle_chats e
where c.id = e.circle_id
  and c.chat_id is null;

with missing_circle_chats as (
  insert into public.chats (type, name, avatar, circle_id, created_by, is_active)
  select
    'group',
    c.name,
    coalesce(c.image, ''),
    c.id,
    c.creator_id,
    true
  from public.circles c
  where c.chat_id is null
    and coalesce(c.status, 'active') <> 'deleted'
  returning id, circle_id
)
update public.circles c
set chat_id = m.id
from missing_circle_chats m
where c.id = m.circle_id
  and c.chat_id is null;

insert into public.chat_participants (chat_id, user_id, role, joined_at, left_at)
select
  c.chat_id,
  cm.user_id,
  case
    when cm.role in ('creator', 'admin') then 'admin'
    else 'member'
  end,
  coalesce(cm.joined_at, timezone('utc', now())),
  null
from public.circles c
join public.circle_members cm on cm.circle_id = c.id
where c.chat_id is not null
  and cm.status = 'active'
on conflict (chat_id, user_id)
do update set
  role = excluded.role,
  joined_at = excluded.joined_at,
  left_at = null,
  updated_at = timezone('utc', now());
