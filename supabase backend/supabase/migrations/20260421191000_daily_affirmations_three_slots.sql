alter table public.daily_affirmations
  drop constraint if exists daily_affirmations_pkey;

alter table public.daily_affirmations
  add constraint daily_affirmations_pkey primary key (day_key, slot_key);

with ordered_affirmations as (
  select
    id,
    row_number() over (order by published_at desc, created_at desc, id desc) as rn
  from public.affirmations
  where status = 'active'
),
slot_templates as (
  select * from (
    values
      ('afternoon'::text, 'Afternoon Affirmation'::text, 1),
      ('evening'::text, 'Evening Affirmation'::text, 2)
  ) as slots(slot_key, title, slot_offset)
),
day_keys as (
  select distinct day_key
  from public.daily_affirmations
),
affirmation_count as (
  select count(*)::integer as total
  from ordered_affirmations
)
insert into public.daily_affirmations (
  day_key,
  affirmation_id,
  slot_key,
  title
)
select
  day_keys.day_key,
  chosen.id,
  slot_templates.slot_key,
  slot_templates.title
from day_keys
cross join slot_templates
cross join affirmation_count
join lateral (
  select ordered_affirmations.id
  from ordered_affirmations
  where ordered_affirmations.rn = (
    (
      (extract(doy from day_keys.day_key)::integer * 3) + slot_templates.slot_offset
    ) % greatest(affirmation_count.total, 1)
  ) + 1
) as chosen on affirmation_count.total > 0
on conflict (day_key, slot_key) do nothing;
