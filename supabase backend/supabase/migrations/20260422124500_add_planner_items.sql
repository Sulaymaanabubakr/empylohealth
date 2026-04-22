create table if not exists public.planner_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  item_type text not null default 'task',
  scheduled_for timestamptz not null,
  all_day boolean not null default false,
  status text not null default 'pending',
  notes text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint planner_items_type_check check (item_type in ('task', 'event', 'huddle')),
  constraint planner_items_status_check check (status in ('pending', 'done'))
);

create index if not exists planner_items_user_scheduled_idx
  on public.planner_items (user_id, scheduled_for asc);

create index if not exists planner_items_user_status_idx
  on public.planner_items (user_id, status, scheduled_for asc);

drop trigger if exists planner_items_set_updated_at on public.planner_items;
create trigger planner_items_set_updated_at
before update on public.planner_items
for each row execute function public.set_updated_at();

alter table public.planner_items enable row level security;

drop policy if exists planner_items_select_own on public.planner_items;
create policy planner_items_select_own
on public.planner_items
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists planner_items_insert_own on public.planner_items;
create policy planner_items_insert_own
on public.planner_items
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists planner_items_update_own on public.planner_items;
create policy planner_items_update_own
on public.planner_items
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists planner_items_delete_own on public.planner_items;
create policy planner_items_delete_own
on public.planner_items
for delete
to authenticated
using (auth.uid() = user_id);
