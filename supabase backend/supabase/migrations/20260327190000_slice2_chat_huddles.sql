create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'direct',
  name text not null default '',
  avatar text not null default '',
  circle_id text,
  created_by uuid references auth.users(id) on delete set null,
  is_active boolean not null default true,
  last_message_text text not null default '',
  last_message_type text not null default 'text',
  last_message_sender_id uuid references auth.users(id) on delete set null,
  last_message_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.chat_participants (
  chat_id uuid not null references public.chats(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  is_muted boolean not null default false,
  joined_at timestamptz not null default timezone('utc', now()),
  left_at timestamptz,
  last_read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (chat_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  text text not null default '',
  type text not null default 'text',
  system_kind text,
  media_url text,
  visible_to uuid[] not null default '{}'::uuid[],
  client_message_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.huddles (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  circle_id text,
  room_url text not null default '',
  room_name text not null default '',
  type text not null default 'p2p',
  created_by uuid references auth.users(id) on delete set null,
  started_by uuid references auth.users(id) on delete set null,
  accepted_by uuid references auth.users(id) on delete set null,
  is_group boolean not null default false,
  is_active boolean not null default true,
  status text not null default 'ringing',
  invited_user_ids uuid[] not null default '{}'::uuid[],
  accepted_user_ids uuid[] not null default '{}'::uuid[],
  declined_user_ids uuid[] not null default '{}'::uuid[],
  active_user_ids uuid[] not null default '{}'::uuid[],
  ring_started_at timestamptz,
  accepted_at timestamptz,
  ongoing_at timestamptz,
  ended_at timestamptz,
  ended_by uuid references auth.users(id) on delete set null,
  ended_reason text,
  last_ring_sent_at timestamptz,
  ring_count integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.huddle_participants (
  huddle_id uuid not null references public.huddles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  muted boolean not null default false,
  joined_at timestamptz,
  left_at timestamptz,
  declined_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  primary key (huddle_id, user_id)
);

create table if not exists public.scheduled_huddles (
  id uuid primary key default gen_random_uuid(),
  circle_id text not null,
  chat_id uuid references public.chats(id) on delete cascade,
  title text not null,
  scheduled_at timestamptz not null,
  created_by uuid references auth.users(id) on delete set null,
  reminder_enabled boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.chat_typing_states (
  chat_id uuid not null references public.chats(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  state text not null default 'typing',
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (chat_id, user_id)
);

create table if not exists public.chat_presence_states (
  chat_id uuid not null references public.chats(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  state text not null default 'idle',
  last_seen_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (chat_id, user_id)
);

create table if not exists public.huddle_live_states (
  huddle_id uuid primary key references public.huddles(id) on delete cascade,
  chat_id uuid not null references public.chats(id) on delete cascade,
  host_uid uuid references auth.users(id) on delete set null,
  state text not null default 'idle',
  last_action text,
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists chats_updated_at_idx
  on public.chats (updated_at desc);

create index if not exists chats_circle_id_idx
  on public.chats (circle_id)
  where circle_id is not null;

create index if not exists chat_participants_user_id_idx
  on public.chat_participants (user_id, updated_at desc);

create index if not exists messages_chat_id_created_idx
  on public.messages (chat_id, created_at desc);

create index if not exists messages_client_message_id_idx
  on public.messages (client_message_id)
  where client_message_id is not null;

create index if not exists huddles_chat_id_created_idx
  on public.huddles (chat_id, created_at desc);

create index if not exists huddles_status_idx
  on public.huddles (status, is_active, updated_at desc);

create index if not exists huddle_participants_user_id_idx
  on public.huddle_participants (user_id, updated_at desc);

create index if not exists scheduled_huddles_circle_scheduled_idx
  on public.scheduled_huddles (circle_id, scheduled_at asc);

create or replace function public.is_chat_member(target_chat_id uuid, target_user_id uuid)
returns boolean
language sql
stable
as $$
  select exists(
    select 1
    from public.chat_participants cp
    where cp.chat_id = target_chat_id
      and cp.user_id = target_user_id
      and cp.left_at is null
  );
$$;

drop trigger if exists chats_set_updated_at on public.chats;
create trigger chats_set_updated_at
before update on public.chats
for each row execute function public.set_updated_at();

drop trigger if exists chat_participants_set_updated_at on public.chat_participants;
create trigger chat_participants_set_updated_at
before update on public.chat_participants
for each row execute function public.set_updated_at();

drop trigger if exists huddles_set_updated_at on public.huddles;
create trigger huddles_set_updated_at
before update on public.huddles
for each row execute function public.set_updated_at();

drop trigger if exists huddle_participants_set_updated_at on public.huddle_participants;
create trigger huddle_participants_set_updated_at
before update on public.huddle_participants
for each row execute function public.set_updated_at();

drop trigger if exists scheduled_huddles_set_updated_at on public.scheduled_huddles;
create trigger scheduled_huddles_set_updated_at
before update on public.scheduled_huddles
for each row execute function public.set_updated_at();

alter table public.chats enable row level security;
alter table public.chat_participants enable row level security;
alter table public.messages enable row level security;
alter table public.huddles enable row level security;
alter table public.huddle_participants enable row level security;
alter table public.scheduled_huddles enable row level security;
alter table public.chat_typing_states enable row level security;
alter table public.chat_presence_states enable row level security;
alter table public.huddle_live_states enable row level security;

drop policy if exists chats_select_member on public.chats;
create policy chats_select_member
on public.chats
for select
to authenticated
using (public.is_chat_member(id, auth.uid()));

drop policy if exists chat_participants_select_member on public.chat_participants;
create policy chat_participants_select_member
on public.chat_participants
for select
to authenticated
using (public.is_chat_member(chat_id, auth.uid()));

drop policy if exists chat_participants_update_self on public.chat_participants;
create policy chat_participants_update_self
on public.chat_participants
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists messages_select_member on public.messages;
create policy messages_select_member
on public.messages
for select
to authenticated
using (
  public.is_chat_member(chat_id, auth.uid())
  and (
    coalesce(array_length(visible_to, 1), 0) = 0
    or auth.uid() = any(visible_to)
  )
);

drop policy if exists huddles_select_member on public.huddles;
create policy huddles_select_member
on public.huddles
for select
to authenticated
using (public.is_chat_member(chat_id, auth.uid()));

drop policy if exists huddle_participants_select_member on public.huddle_participants;
create policy huddle_participants_select_member
on public.huddle_participants
for select
to authenticated
using (
  exists (
    select 1
    from public.huddles h
    where h.id = huddle_participants.huddle_id
      and public.is_chat_member(h.chat_id, auth.uid())
  )
);

drop policy if exists chat_typing_select_member on public.chat_typing_states;
create policy chat_typing_select_member
on public.chat_typing_states
for select
to authenticated
using (public.is_chat_member(chat_id, auth.uid()));

drop policy if exists chat_typing_upsert_self on public.chat_typing_states;
create policy chat_typing_upsert_self
on public.chat_typing_states
for insert
to authenticated
with check (auth.uid() = user_id and public.is_chat_member(chat_id, auth.uid()));

drop policy if exists chat_typing_update_self on public.chat_typing_states;
create policy chat_typing_update_self
on public.chat_typing_states
for update
to authenticated
using (auth.uid() = user_id and public.is_chat_member(chat_id, auth.uid()))
with check (auth.uid() = user_id and public.is_chat_member(chat_id, auth.uid()));

drop policy if exists chat_presence_select_member on public.chat_presence_states;
create policy chat_presence_select_member
on public.chat_presence_states
for select
to authenticated
using (public.is_chat_member(chat_id, auth.uid()));

drop policy if exists chat_presence_insert_self on public.chat_presence_states;
create policy chat_presence_insert_self
on public.chat_presence_states
for insert
to authenticated
with check (auth.uid() = user_id and public.is_chat_member(chat_id, auth.uid()));

drop policy if exists chat_presence_update_self on public.chat_presence_states;
create policy chat_presence_update_self
on public.chat_presence_states
for update
to authenticated
using (auth.uid() = user_id and public.is_chat_member(chat_id, auth.uid()))
with check (auth.uid() = user_id and public.is_chat_member(chat_id, auth.uid()));

drop policy if exists huddle_live_select_member on public.huddle_live_states;
create policy huddle_live_select_member
on public.huddle_live_states
for select
to authenticated
using (public.is_chat_member(chat_id, auth.uid()));

drop policy if exists huddle_live_insert_member on public.huddle_live_states;
create policy huddle_live_insert_member
on public.huddle_live_states
for insert
to authenticated
with check (public.is_chat_member(chat_id, auth.uid()));

drop policy if exists huddle_live_update_member on public.huddle_live_states;
create policy huddle_live_update_member
on public.huddle_live_states
for update
to authenticated
using (public.is_chat_member(chat_id, auth.uid()))
with check (public.is_chat_member(chat_id, auth.uid()));
