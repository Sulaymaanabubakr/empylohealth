create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  content text not null default '',
  content_format text not null default 'html',
  image text not null default '',
  category text not null default '',
  tag text not null default '',
  time text not null default '',
  color text not null default '',
  status text not null default 'active',
  tags jsonb not null default '[]'::jsonb,
  access jsonb not null default '{"kind":"self_development","plans":["pro"],"shareRequiresPremium":false}'::jsonb,
  published_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint resources_title_key unique (title)
);

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  level text not null default '',
  icon text not null default '',
  bg text not null default '',
  color text not null default '',
  category text not null default '',
  priority integer not null default 0,
  status text not null default 'active',
  tags jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  published_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint challenges_title_key unique (title)
);

create table if not exists public.affirmations (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  tags jsonb not null default '[]'::jsonb,
  image text not null default '',
  scheduled_date date,
  status text not null default 'active',
  is_active boolean not null default true,
  published_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint affirmations_content_key unique (content)
);

create table if not exists public.daily_affirmations (
  day_key date primary key,
  affirmation_id uuid not null references public.affirmations(id) on delete cascade,
  slot_key text not null default 'morning',
  title text not null default 'Daily Affirmation',
  created_at timestamptz not null default timezone('utc', now()),
  unique (day_key, slot_key)
);

create table if not exists public.assessment_questions (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  type text not null default 'scale',
  category text not null default 'General',
  tags jsonb not null default '[]'::jsonb,
  weight integer not null default 1,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint assessment_questions_text_key unique (text)
);

create index if not exists resources_status_published_idx
  on public.resources (status, published_at desc);

create index if not exists challenges_status_created_idx
  on public.challenges (status, created_at desc);

create index if not exists affirmations_status_published_idx
  on public.affirmations (status, published_at desc);

create index if not exists assessment_questions_sort_idx
  on public.assessment_questions (sort_order asc);

drop trigger if exists resources_set_updated_at on public.resources;
create trigger resources_set_updated_at
before update on public.resources
for each row execute function public.set_updated_at();

drop trigger if exists challenges_set_updated_at on public.challenges;
create trigger challenges_set_updated_at
before update on public.challenges
for each row execute function public.set_updated_at();

drop trigger if exists affirmations_set_updated_at on public.affirmations;
create trigger affirmations_set_updated_at
before update on public.affirmations
for each row execute function public.set_updated_at();

drop trigger if exists assessment_questions_set_updated_at on public.assessment_questions;
create trigger assessment_questions_set_updated_at
before update on public.assessment_questions
for each row execute function public.set_updated_at();

alter table public.resources enable row level security;
alter table public.challenges enable row level security;
alter table public.affirmations enable row level security;
alter table public.daily_affirmations enable row level security;
alter table public.assessment_questions enable row level security;

drop policy if exists resources_select_active on public.resources;
create policy resources_select_active
on public.resources
for select
to authenticated
using (status in ('active', 'published'));

drop policy if exists challenges_select_active on public.challenges;
create policy challenges_select_active
on public.challenges
for select
to authenticated
using (status in ('active', 'published') and is_active = true);

drop policy if exists affirmations_select_active on public.affirmations;
create policy affirmations_select_active
on public.affirmations
for select
to authenticated
using (status in ('active', 'published') and is_active = true);

drop policy if exists daily_affirmations_select_all on public.daily_affirmations;
create policy daily_affirmations_select_all
on public.daily_affirmations
for select
to authenticated
using (true);

drop policy if exists assessment_questions_select_active on public.assessment_questions;
create policy assessment_questions_select_active
on public.assessment_questions
for select
to authenticated
using (is_active = true);
