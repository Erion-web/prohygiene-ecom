-- Products can be marked as lease materials (Lëndë e parë)
-- Run in Supabase Dashboard → SQL Editor

alter table public.products
  add column if not exists is_material boolean not null default false;

alter table public.materials
  add column if not exists product_id uuid unique references public.products(id) on delete cascade;

alter table public.materials
  drop constraint if exists materials_unit_check;

alter table public.materials
  add constraint materials_unit_check check (unit in ('ml', 'cope', 'pako'));
