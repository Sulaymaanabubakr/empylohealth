create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null default '',
  subject text not null,
  message text not null,
  status text not null default 'open',
  last_reply text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.moderation_reports (
  id uuid primary key default gen_random_uuid(),
  reported_by uuid references auth.users(id) on delete set null,
  reported_user_id uuid references auth.users(id) on delete set null,
  content_id text,
  content_type text not null default 'users',
  reason text not null,
  details text not null default '',
  status text not null default 'pending',
  resolution_action text,
  resolution_note text,
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null default '',
  email text not null default '',
  amount numeric(12,2) not null default 0,
  status text not null default 'pending',
  type text not null default 'subscription',
  external_reference text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists support_tickets_status_created_idx
  on public.support_tickets (status, created_at desc);

create index if not exists moderation_reports_status_created_idx
  on public.moderation_reports (status, created_at desc);

create index if not exists transactions_status_created_idx
  on public.transactions (status, created_at desc);

drop trigger if exists support_tickets_set_updated_at on public.support_tickets;
create trigger support_tickets_set_updated_at
before update on public.support_tickets
for each row execute function public.set_updated_at();

drop trigger if exists moderation_reports_set_updated_at on public.moderation_reports;
create trigger moderation_reports_set_updated_at
before update on public.moderation_reports
for each row execute function public.set_updated_at();

drop trigger if exists transactions_set_updated_at on public.transactions;
create trigger transactions_set_updated_at
before update on public.transactions
for each row execute function public.set_updated_at();

alter table public.support_tickets enable row level security;
alter table public.moderation_reports enable row level security;
alter table public.transactions enable row level security;
