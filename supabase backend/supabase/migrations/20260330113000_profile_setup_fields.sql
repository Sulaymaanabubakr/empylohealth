alter table public.profiles
  add column if not exists dob text not null default '',
  add column if not exists gender text not null default '',
  add column if not exists location text not null default '';
