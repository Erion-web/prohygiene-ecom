alter table public.materials
  add column if not exists product_id uuid unique references public.products(id) on delete cascade;

alter table public.materials
  add column if not exists category_id uuid references public.categories(id) on delete restrict;

alter table public.materials
  alter column utility_category_id drop not null;

notify pgrst, 'reload schema';
