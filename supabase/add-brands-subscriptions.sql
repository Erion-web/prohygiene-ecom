-- ============================================================
-- Migration: Brands + Subscriptions
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

-- ── BRANDS ────────────────────────────────────────────────────
create table if not exists public.brands (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  logo_url    text,
  description text,
  is_active   boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.brands enable row level security;

-- Public can read active brands
create policy "brands_public_select"
  on public.brands for select
  using (is_active = true);

-- Admin/manager full access
create policy "brands_admin_all"
  on public.brands for all
  using (public.get_my_role() in ('admin', 'manager'));

-- Auto-update updated_at
create trigger brands_updated_at
  before update on public.brands
  for each row execute function public.handle_updated_at();

-- ── Add brand_id to products ───────────────────────────────────
alter table public.products
  add column if not exists brand_id uuid references public.brands(id) on delete set null;

-- ── SUBSCRIPTIONS ─────────────────────────────────────────────
create table if not exists public.subscriptions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  name            text not null default 'Paketa ime',
  frequency       text not null default 'monthly'
                    check (frequency in ('weekly', 'biweekly', 'monthly')),
  next_order_date date not null,
  is_active       boolean not null default true,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "subscriptions_owner_select"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "subscriptions_owner_insert"
  on public.subscriptions for insert
  with check (auth.uid() = user_id);

create policy "subscriptions_owner_update"
  on public.subscriptions for update
  using (auth.uid() = user_id);

create policy "subscriptions_owner_delete"
  on public.subscriptions for delete
  using (auth.uid() = user_id);

create policy "subscriptions_admin_select"
  on public.subscriptions for select
  using (public.get_my_role() in ('admin', 'manager'));

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.handle_updated_at();

-- ── SUBSCRIPTION ITEMS ────────────────────────────────────────
create table if not exists public.subscription_items (
  id              uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  product_id      uuid not null references public.products(id) on delete cascade,
  quantity        int not null default 1 check (quantity > 0),
  unique (subscription_id, product_id)
);

alter table public.subscription_items enable row level security;

create policy "sub_items_owner_all"
  on public.subscription_items for all
  using (
    exists (
      select 1 from public.subscriptions s
      where s.id = subscription_id and s.user_id = auth.uid()
    )
  );

create policy "sub_items_admin_select"
  on public.subscription_items for select
  using (public.get_my_role() in ('admin', 'manager'));
