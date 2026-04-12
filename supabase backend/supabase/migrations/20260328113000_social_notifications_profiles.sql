alter table public.profiles
  add column if not exists wellbeing_score integer,
  add column if not exists wellbeing_label text not null default '',
  add column if not exists streak integer not null default 0,
  add column if not exists stats jsonb not null default '{}'::jsonb,
  add column if not exists expo_push_tokens text[] not null default '{}'::text[],
  add column if not exists fcm_tokens text[] not null default '{}'::text[],
  add column if not exists voip_push_tokens text[] not null default '{}'::text[],
  add column if not exists blocked_user_ids uuid[] not null default '{}'::uuid[];

create table if not exists public.circles (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  description text not null default '',
  category text not null default 'General',
  type text not null default 'public',
  visibility text not null default 'visible',
  image text not null default '',
  location text not null default '',
  tags text[] not null default '{}'::text[],
  status text not null default 'active',
  billing_tier text not null default 'free',
  creator_id uuid references auth.users(id) on delete set null,
  admin_id uuid references auth.users(id) on delete set null,
  members uuid[] not null default '{}'::uuid[],
  member_count integer not null default 0,
  active_huddle jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.circle_members (
  circle_id text not null references public.circles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  status text not null default 'active',
  joined_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (circle_id, user_id)
);

create table if not exists public.circle_join_requests (
  id uuid primary key default gen_random_uuid(),
  circle_id text not null references public.circles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null default '',
  answers jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (circle_id, user_id)
);

create table if not exists public.circle_reports (
  id uuid primary key default gen_random_uuid(),
  circle_id text not null references public.circles(id) on delete cascade,
  reporter_uid uuid not null references auth.users(id) on delete cascade,
  target_id uuid,
  target_type text not null default 'member',
  reason text not null default '',
  description text not null default '',
  status text not null default 'pending',
  resolution_action text,
  resolution_note text not null default '',
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.circle_invites (
  id uuid primary key default gen_random_uuid(),
  circle_id text not null references public.circles(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  max_uses integer not null default 1,
  use_count integer not null default 0,
  is_revoked boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.app_invites (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete set null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  max_uses integer not null default 1,
  use_count integer not null default 0,
  is_revoked boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'GENERIC',
  title text not null default 'Notification',
  subtitle text not null default '',
  body text not null default '',
  avatar text not null default '',
  image text not null default '',
  color text not null default '',
  data jsonb not null default '{}'::jsonb,
  read boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'daily',
  score integer not null default 0,
  answers jsonb not null default '{}'::jsonb,
  mood text not null default '',
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists circles_status_created_idx
  on public.circles (status, created_at desc);

create index if not exists circles_creator_idx
  on public.circles (creator_id);

create index if not exists circle_members_user_idx
  on public.circle_members (user_id, updated_at desc);

create index if not exists circle_join_requests_circle_status_idx
  on public.circle_join_requests (circle_id, status, created_at desc);

create index if not exists circle_reports_circle_status_idx
  on public.circle_reports (circle_id, status, created_at desc);

create index if not exists notifications_user_read_created_idx
  on public.notifications (user_id, read, created_at desc);

create index if not exists assessments_user_created_idx
  on public.assessments (user_id, created_at desc);

create or replace function public.sync_circle_members_snapshot()
returns trigger
language plpgsql
as $$
declare
  target_circle_id text;
begin
  target_circle_id := coalesce(new.circle_id, old.circle_id);

  update public.circles
  set
    members = coalesce((
      select array_agg(cm.user_id order by cm.joined_at asc)
      from public.circle_members cm
      where cm.circle_id = target_circle_id
        and cm.status = 'active'
    ), '{}'::uuid[]),
    member_count = (
      select count(*)
      from public.circle_members cm
      where cm.circle_id = target_circle_id
        and cm.status = 'active'
    ),
    updated_at = timezone('utc', now())
  where id = target_circle_id;

  return coalesce(new, old);
end;
$$;

create or replace function public.is_circle_member(target_circle_id text, target_user_id uuid)
returns boolean
language sql
stable
as $$
  select exists(
    select 1
    from public.circle_members cm
    where cm.circle_id = target_circle_id
      and cm.user_id = target_user_id
      and cm.status = 'active'
  );
$$;

create or replace function public.can_manage_circle(target_circle_id text, target_user_id uuid)
returns boolean
language sql
stable
as $$
  select exists(
    select 1
    from public.circle_members cm
    where cm.circle_id = target_circle_id
      and cm.user_id = target_user_id
      and cm.status = 'active'
      and cm.role in ('creator', 'admin', 'moderator')
  );
$$;

drop trigger if exists circles_set_updated_at on public.circles;
create trigger circles_set_updated_at
before update on public.circles
for each row execute function public.set_updated_at();

drop trigger if exists circle_members_set_updated_at on public.circle_members;
create trigger circle_members_set_updated_at
before update on public.circle_members
for each row execute function public.set_updated_at();

drop trigger if exists circle_join_requests_set_updated_at on public.circle_join_requests;
create trigger circle_join_requests_set_updated_at
before update on public.circle_join_requests
for each row execute function public.set_updated_at();

drop trigger if exists circle_reports_set_updated_at on public.circle_reports;
create trigger circle_reports_set_updated_at
before update on public.circle_reports
for each row execute function public.set_updated_at();

drop trigger if exists circle_invites_set_updated_at on public.circle_invites;
create trigger circle_invites_set_updated_at
before update on public.circle_invites
for each row execute function public.set_updated_at();

drop trigger if exists app_invites_set_updated_at on public.app_invites;
create trigger app_invites_set_updated_at
before update on public.app_invites
for each row execute function public.set_updated_at();

drop trigger if exists circle_members_sync_snapshot_insert on public.circle_members;
create trigger circle_members_sync_snapshot_insert
after insert on public.circle_members
for each row execute function public.sync_circle_members_snapshot();

drop trigger if exists circle_members_sync_snapshot_update on public.circle_members;
create trigger circle_members_sync_snapshot_update
after update on public.circle_members
for each row execute function public.sync_circle_members_snapshot();

drop trigger if exists circle_members_sync_snapshot_delete on public.circle_members;
create trigger circle_members_sync_snapshot_delete
after delete on public.circle_members
for each row execute function public.sync_circle_members_snapshot();

alter table public.circles enable row level security;
alter table public.circle_members enable row level security;
alter table public.circle_join_requests enable row level security;
alter table public.circle_reports enable row level security;
alter table public.circle_invites enable row level security;
alter table public.app_invites enable row level security;
alter table public.notifications enable row level security;
alter table public.assessments enable row level security;

drop policy if exists circles_select_member_or_public on public.circles;
create policy circles_select_member_or_public
on public.circles
for select
to authenticated
using (
  status <> 'deleted'
  and (
    type = 'public'
    or public.is_circle_member(id, auth.uid())
  )
);

drop policy if exists circles_insert_creator on public.circles;
create policy circles_insert_creator
on public.circles
for insert
to authenticated
with check (creator_id = auth.uid());

drop policy if exists circles_update_manager on public.circles;
create policy circles_update_manager
on public.circles
for update
to authenticated
using (public.can_manage_circle(id, auth.uid()))
with check (public.can_manage_circle(id, auth.uid()));

drop policy if exists circle_members_select_related on public.circle_members;
create policy circle_members_select_related
on public.circle_members
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_circle_member(circle_id, auth.uid())
  or exists (
    select 1
    from public.circles c
    where c.id = circle_id
      and c.type = 'public'
      and c.status <> 'deleted'
  )
);

drop policy if exists circle_join_requests_select_own_or_manager on public.circle_join_requests;
create policy circle_join_requests_select_own_or_manager
on public.circle_join_requests
for select
to authenticated
using (user_id = auth.uid() or public.can_manage_circle(circle_id, auth.uid()));

drop policy if exists circle_reports_select_own_or_manager on public.circle_reports;
create policy circle_reports_select_own_or_manager
on public.circle_reports
for select
to authenticated
using (reporter_uid = auth.uid() or public.can_manage_circle(circle_id, auth.uid()));

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own
on public.notifications
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own
on public.notifications
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists assessments_select_own on public.assessments;
create policy assessments_select_own
on public.assessments
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists assessments_insert_own on public.assessments;
create policy assessments_insert_own
on public.assessments
for insert
to authenticated
with check (user_id = auth.uid());
