create table if not exists public.missed_huddles (
  id uuid primary key default gen_random_uuid(),
  huddle_id uuid not null references public.huddles(id) on delete cascade,
  chat_id uuid not null references public.chats(id) on delete cascade,
  caller_id uuid references auth.users(id) on delete set null,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  handled_at timestamptz,
  unique (huddle_id, receiver_id)
);

create index if not exists missed_huddles_receiver_status_created_idx
  on public.missed_huddles (receiver_id, status, created_at desc);

create index if not exists missed_huddles_huddle_receiver_idx
  on public.missed_huddles (huddle_id, receiver_id);

alter table public.missed_huddles enable row level security;

drop policy if exists missed_huddles_select_own on public.missed_huddles;
create policy missed_huddles_select_own
on public.missed_huddles
for select
to authenticated
using (receiver_id = auth.uid());
