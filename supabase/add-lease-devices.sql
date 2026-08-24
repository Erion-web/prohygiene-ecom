-- ============================================================
-- Migration: Lease devices, utilities, contracts, ops
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

-- ── LISTING TYPE ON PRODUCTS ─────────────────────────────────
alter table public.products
  add column if not exists listing_type text not null default 'sale'
  check (listing_type in ('sale', 'lease'));

create index if not exists products_listing_type_idx on public.products (listing_type);

-- ── UTILITY CATEGORIES ───────────────────────────────────────
create table if not exists public.utility_categories (
  id uuid primary key default gen_random_uuid(),
  name_sq text not null,
  name_en text not null,
  slug text not null unique,
  description_sq text,
  description_en text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.utility_categories enable row level security;

create policy "utility_categories_public_select"
  on public.utility_categories for select
  using (is_active = true);

create policy "utility_categories_admin_all"
  on public.utility_categories for all
  using (public.get_my_role() in ('admin', 'manager'));

create trigger utility_categories_updated_at
  before update on public.utility_categories
  for each row execute function public.handle_updated_at();

-- ── MATERIALS ────────────────────────────────────────────────
create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  utility_category_id uuid not null references public.utility_categories(id) on delete restrict,
  name_sq text not null,
  name_en text not null,
  material_type text,
  description_sq text,
  description_en text,
  unit text not null default 'ml' check (unit in ('ml', 'cope')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.materials enable row level security;

create policy "materials_public_select"
  on public.materials for select
  using (is_active = true);

create policy "materials_admin_all"
  on public.materials for all
  using (public.get_my_role() in ('admin', 'manager'));

create trigger materials_updated_at
  before update on public.materials
  for each row execute function public.handle_updated_at();

-- ── DEVICE MATERIALS (product capacity config) ───────────────
create table if not exists public.device_materials (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  material_id uuid not null references public.materials(id) on delete restrict,
  capacity numeric(14,2) not null check (capacity > 0),
  created_at timestamptz not null default now(),
  unique (product_id, material_id)
);

alter table public.device_materials enable row level security;

create policy "device_materials_public_select"
  on public.device_materials for select
  using (true);

create policy "device_materials_admin_all"
  on public.device_materials for all
  using (public.get_my_role() in ('admin', 'manager'));

-- ── LEASE CLIENTS ───────────────────────────────────────────
create table if not exists public.lease_clients (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  company_name text not null,
  contact_name text not null,
  email text not null,
  phone text,
  city text,
  address text,
  employee_count int not null default 0 check (employee_count >= 0),
  payment_status text not null default 'paid'
    check (payment_status in ('paid', 'unpaid', 'danger')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lease_clients enable row level security;

create policy "lease_clients_admin_all"
  on public.lease_clients for all
  using (public.get_my_role() in ('admin', 'manager'));

create trigger lease_clients_updated_at
  before update on public.lease_clients
  for each row execute function public.handle_updated_at();

-- ── LEASE CONTRACTS ───────────────────────────────────────────
create table if not exists public.lease_contracts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.lease_clients(id) on delete restrict,
  duration_months int not null check (duration_months > 0),
  starts_at date not null,
  ends_at date not null,
  device_count int not null default 1 check (device_count > 0),
  employee_count int not null default 0 check (employee_count >= 0),
  monthly_fee numeric(10,2) not null default 0 check (monthly_fee >= 0),
  reminder_period text not null default 'month'
    check (reminder_period in ('week', 'month')),
  surplus_days int not null default 7 check (surplus_days >= 0),
  expected_consumption numeric(14,2) not null default 0 check (expected_consumption >= 0),
  consumption_unit text not null default 'ml' check (consumption_unit in ('ml', 'cope')),
  consumption_period text not null default 'month'
    check (consumption_period in ('week', 'month')),
  status text not null default 'draft'
    check (status in ('draft', 'active', 'expired', 'cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lease_contracts enable row level security;

create policy "lease_contracts_admin_all"
  on public.lease_contracts for all
  using (public.get_my_role() in ('admin', 'manager'));

create trigger lease_contracts_updated_at
  before update on public.lease_contracts
  for each row execute function public.handle_updated_at();

-- ── CONTRACT DEVICES ────────────────────────────────────────────
create table if not exists public.contract_devices (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.lease_contracts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity int not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (contract_id, product_id)
);

alter table public.contract_devices enable row level security;

create policy "contract_devices_admin_all"
  on public.contract_devices for all
  using (public.get_my_role() in ('admin', 'manager'));

-- ── CONTRACT MATERIALS ──────────────────────────────────────────
create table if not exists public.contract_materials (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.lease_contracts(id) on delete cascade,
  material_id uuid not null references public.materials(id) on delete restrict,
  quantity numeric(14,2) not null default 0 check (quantity >= 0),
  created_at timestamptz not null default now(),
  unique (contract_id, material_id)
);

alter table public.contract_materials enable row level security;

create policy "contract_materials_admin_all"
  on public.contract_materials for all
  using (public.get_my_role() in ('admin', 'manager'));

-- ── DEPLOYED DEVICES ───────────────────────────────────────────
create table if not exists public.deployed_devices (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.lease_contracts(id) on delete restrict,
  client_id uuid not null references public.lease_clients(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict,
  location_label text not null,
  city text,
  address text,
  installed_at date not null default current_date,
  status text not null default 'active'
    check (status in ('active', 'maintenance', 'retired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.deployed_devices enable row level security;

create policy "deployed_devices_admin_all"
  on public.deployed_devices for all
  using (public.get_my_role() in ('admin', 'manager'));

create trigger deployed_devices_updated_at
  before update on public.deployed_devices
  for each row execute function public.handle_updated_at();

-- ── DEVICE CONSUMABLE LEVELS ────────────────────────────────────
create table if not exists public.device_consumable_levels (
  id uuid primary key default gen_random_uuid(),
  deployed_device_id uuid not null references public.deployed_devices(id) on delete cascade,
  material_id uuid not null references public.materials(id) on delete restrict,
  capacity numeric(14,2) not null check (capacity > 0),
  current_level numeric(14,2) not null check (current_level >= 0),
  last_refilled_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (deployed_device_id, material_id)
);

alter table public.device_consumable_levels enable row level security;

create policy "device_consumable_levels_admin_all"
  on public.device_consumable_levels for all
  using (public.get_my_role() in ('admin', 'manager'));

create trigger device_consumable_levels_updated_at
  before update on public.device_consumable_levels
  for each row execute function public.handle_updated_at();

-- ── REFILL EVENTS ───────────────────────────────────────────────
create table if not exists public.refill_events (
  id uuid primary key default gen_random_uuid(),
  deployed_device_id uuid not null references public.deployed_devices(id) on delete cascade,
  material_id uuid not null references public.materials(id) on delete restrict,
  amount numeric(14,2) not null check (amount > 0),
  notes text,
  refilled_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.refill_events enable row level security;

create policy "refill_events_admin_all"
  on public.refill_events for all
  using (public.get_my_role() in ('admin', 'manager'));

-- ── LEASE INQUIRIES ─────────────────────────────────────────────
create table if not exists public.lease_inquiries (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  company text,
  message text,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lease_inquiries enable row level security;

create policy "lease_inquiries_admin_all"
  on public.lease_inquiries for all
  using (public.get_my_role() in ('admin', 'manager'));

create trigger lease_inquiries_updated_at
  before update on public.lease_inquiries
  for each row execute function public.handle_updated_at();

-- ── LEASE NOTIFICATIONS ─────────────────────────────────────────
create table if not exists public.lease_notifications (
  id uuid primary key default gen_random_uuid(),
  notification_type text not null
    check (notification_type in ('consumption', 'contract_expiry')),
  deployed_device_id uuid references public.deployed_devices(id) on delete cascade,
  contract_id uuid references public.lease_contracts(id) on delete cascade,
  material_id uuid references public.materials(id) on delete set null,
  client_id uuid references public.lease_clients(id) on delete set null,
  title text not null,
  message text not null,
  due_date date,
  email_sent boolean not null default false,
  created_at timestamptz not null default now(),
  unique (notification_type, deployed_device_id, material_id, due_date),
  unique (notification_type, contract_id, due_date)
);

alter table public.lease_notifications enable row level security;

create policy "lease_notifications_admin_all"
  on public.lease_notifications for all
  using (public.get_my_role() in ('admin', 'manager'));

-- ── SEED UTILITY CATEGORIES ─────────────────────────────────────
insert into public.utility_categories (name_sq, name_en, slug, sort_order)
values
  ('Aroma', 'Aroma', 'aroma', 1),
  ('Sapuni', 'Soap', 'sapuni', 2),
  ('Letra', 'Paper', 'letra', 3),
  ('Letër duarsh', 'Hand paper', 'leter-duarsh', 4)
on conflict (slug) do nothing;

-- ── PG_CRON SETUP (manual steps) ────────────────────────────────
-- 1. Supabase Dashboard → Database → Extensions → enable pg_cron and pg_net
-- 2. Store CRON_SECRET in your app env
-- 3. Replace YOUR_APP_URL and YOUR_CRON_SECRET below, then run:
--
-- select cron.schedule(
--   'lease-reminders-daily',
--   '0 6 * * *',
--   $$
--   select net.http_post(
--     url := 'YOUR_APP_URL/api/cron/lease-reminders',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer YOUR_CRON_SECRET'
--     ),
--     body := '{}'::jsonb
--   );
--   $$
-- );
