create table if not exists public.notification_dispatches (
  id uuid primary key default gen_random_uuid(),
  dispatch_key text not null unique,
  kind text not null,
  metadata jsonb not null default '{}'::jsonb,
  sent_at timestamptz not null default timezone('utc', now())
);

create index if not exists notification_dispatches_kind_sent_idx
  on public.notification_dispatches (kind, sent_at desc);
