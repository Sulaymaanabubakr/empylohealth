create table if not exists public.user_presence_states (
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id text not null,
  state text not null default 'offline',
  last_seen_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, device_id)
);

create index if not exists user_presence_states_user_id_idx
  on public.user_presence_states (user_id, updated_at desc);

drop trigger if exists user_presence_states_set_updated_at on public.user_presence_states;
create trigger user_presence_states_set_updated_at
before update on public.user_presence_states
for each row execute function public.set_updated_at();

alter table public.user_presence_states enable row level security;

drop policy if exists user_presence_states_select_authenticated on public.user_presence_states;
create policy user_presence_states_select_authenticated
on public.user_presence_states
for select
to authenticated
using (true);

drop policy if exists user_presence_states_insert_self on public.user_presence_states;
create policy user_presence_states_insert_self
on public.user_presence_states
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists user_presence_states_update_self on public.user_presence_states;
create policy user_presence_states_update_self
on public.user_presence_states
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

alter publication supabase_realtime add table public.user_presence_states;
