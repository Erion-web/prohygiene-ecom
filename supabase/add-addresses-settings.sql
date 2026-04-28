-- ============================================================
-- Migration: User Addresses + App Settings
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

-- ── USER ADDRESSES ─────────────────────────────────────────────
create table if not exists public.user_addresses (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  label      text not null default 'Shtëpi',
  full_name  text not null,
  phone      text,
  city       text not null,
  address    text not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.user_addresses enable row level security;

create policy "addresses_owner_all"
  on public.user_addresses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "addresses_admin_select"
  on public.user_addresses for select
  using (public.get_my_role() in ('admin', 'manager'));

-- ── APP SETTINGS ───────────────────────────────────────────────
create table if not exists public.app_settings (
  key   text primary key,
  value jsonb not null
);

alter table public.app_settings enable row level security;

-- Public can read settings (needed for checkout page)
create policy "settings_public_select"
  on public.app_settings for select
  to public
  using (true);

-- Only admin/manager can write
create policy "settings_admin_all"
  on public.app_settings for all
  using (public.get_my_role() in ('admin', 'manager'));

-- Seed default payment settings
insert into public.app_settings (key, value) values
  ('payment_methods', '{"card": true, "cash_on_delivery": true}'::jsonb)
on conflict (key) do nothing;
