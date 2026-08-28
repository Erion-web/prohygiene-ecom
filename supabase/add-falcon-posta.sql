-- Falcon Posta courier integration
-- Tracks the courier-side shipment status separately from our own order.status
-- lifecycle, since Falcon's status set (id/name pairs like "Në proces", "Në depo")
-- doesn't map cleanly onto ours.

alter table public.orders
  add column if not exists falcon_order_id text,
  add column if not exists falcon_status_id int,
  add column if not exists falcon_status_name text,
  add column if not exists falcon_updated_at timestamptz;

create index if not exists orders_falcon_order_id_idx on public.orders(falcon_order_id);

-- COD payout batches ("liquidations") — Falcon periodically settles collected
-- cash-on-delivery money and reports it via webhook; this is a record of that,
-- not tied to a single order.
create table if not exists public.falcon_liquidations (
  id                uuid primary key default uuid_generate_v4(),
  falcon_liquidation_id int not null unique,
  status_id         int,
  status_name       text,
  total_sales       numeric(10,2),
  total_neto_amount numeric(10,2),
  orders            jsonb not null default '[]',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.falcon_liquidations enable row level security;

create policy "falcon_liquidations_admin_select" on public.falcon_liquidations
  for select using (public.get_my_role() in ('admin', 'manager'));

-- Note: inserts/updates to falcon_liquidations and the falcon_* order columns
-- happen only via the webhook route using the service role key, which
-- bypasses RLS — no public/anon policy is needed or intended here.
