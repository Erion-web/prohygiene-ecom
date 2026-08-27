-- Materials use shared product categories instead of utility_categories
-- Run in Supabase Dashboard → SQL Editor

alter table public.materials
  add column if not exists category_id uuid references public.categories(id) on delete restrict;

update public.materials m
set category_id = c.id
from public.utility_categories uc
join public.categories c on c.slug = uc.slug
where m.utility_category_id = uc.id
  and m.category_id is null;

update public.materials m
set category_id = c.id
from public.utility_categories uc
join public.categories c on lower(trim(c.name_sq)) = lower(trim(uc.name_sq))
where m.utility_category_id = uc.id
  and m.category_id is null;

update public.materials m
set category_id = (
  select id from public.categories
  where is_active = true
  order by sort_order, name_sq
  limit 1
)
where m.category_id is null;

alter table public.materials
  alter column category_id set not null;

alter table public.materials
  drop constraint if exists materials_utility_category_id_fkey;

alter table public.materials
  drop column if exists utility_category_id;

drop table if exists public.utility_categories cascade;
