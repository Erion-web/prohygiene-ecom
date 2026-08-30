-- ProHygiene E-Commerce Platform — Supabase PostgreSQL Schema
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  full_name text,
  phone text,
  city text,
  address text,
  role text not null default 'customer' check (role in ('customer', 'admin', 'manager')),
  customer_type text not null default 'individual' check (customer_type in ('individual', 'business')),
  business_name text,
  fiscal_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Auto-create profile row on signup
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Security-definer helper ────────────────────────────────────────────────
-- Runs bypassing RLS so policies can call it without infinite recursion.
create or replace function public.get_my_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ── Policies ──────────────────────────────────────────────────────────────
create policy "profiles_select"
  on public.profiles for select
  using (auth.uid() = id or public.get_my_role() in ('admin', 'manager'));

create policy "profiles_update"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles_insert"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ============================================================
-- CATEGORIES
-- ============================================================
create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  name_sq text not null,
  name_en text not null,
  slug text unique not null,
  description_sq text,
  description_en text,
  image_url text,
  parent_id uuid references public.categories(id) on delete set null,
  audience_type text not null default 'both' check (audience_type in ('home', 'business', 'both')),
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "categories_public_select"
  on public.categories for select using (is_active = true);

create policy "categories_admin_all"
  on public.categories for all
  using (public.get_my_role() in ('admin', 'manager'));

-- ============================================================
-- PRODUCTS
-- ============================================================
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  sku text unique not null,
  name_sq text not null,
  name_en text not null,
  slug text unique not null,
  description_sq text,
  description_en text,
  category_id uuid references public.categories(id) on delete set null,
  audience_type text not null default 'both' check (audience_type in ('home', 'business', 'both')),
  price numeric(10,2) not null check (price >= 0),
  sale_price numeric(10,2) check (sale_price >= 0),
  stock int not null default 0 check (stock >= 0),
  unit text not null default 'cope',
  image_url text,
  gallery_urls text[] default '{}',
  is_featured boolean not null default false,
  is_best_seller boolean not null default false,
  is_active boolean not null default true,
  vat_rate numeric(5,2) not null default 18.00,
  meta_title_sq text,
  meta_title_en text,
  meta_description_sq text,
  meta_description_en text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

create policy "products_public_select"
  on public.products for select using (is_active = true);

create policy "products_admin_all"
  on public.products for all
  using (public.get_my_role() in ('admin', 'manager'));

create index products_category_id_idx   on public.products(category_id);
create index products_slug_idx          on public.products(slug);
create index products_sku_idx           on public.products(sku);
create index products_audience_type_idx on public.products(audience_type);
create index products_featured_idx      on public.products(is_featured) where is_featured = true;
create index products_best_seller_idx   on public.products(is_best_seller) where is_best_seller = true;

-- ============================================================
-- CAMPAIGNS
-- ============================================================
create table public.campaigns (
  id uuid default uuid_generate_v4() primary key,
  title_sq text not null,
  title_en text not null,
  description_sq text,
  description_en text,
  slug text unique not null,
  banner_url text,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric(10,2) not null check (discount_value > 0),
  audience_type text not null default 'both' check (audience_type in ('home', 'business', 'both')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_active boolean not null default true,
  show_on_homepage boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_dates check (ends_at > starts_at)
);

alter table public.campaigns enable row level security;

create policy "campaigns_public_select"
  on public.campaigns for select
  using (is_active = true and now() between starts_at and ends_at);

create policy "campaigns_admin_all"
  on public.campaigns for all
  using (public.get_my_role() in ('admin', 'manager'));

-- Campaign ↔ Products (many-to-many)
create table public.campaign_products (
  campaign_id uuid references public.campaigns(id) on delete cascade not null,
  product_id  uuid references public.products(id)  on delete cascade not null,
  primary key (campaign_id, product_id)
);

alter table public.campaign_products enable row level security;

create policy "campaign_products_public_select" on public.campaign_products for select using (true);
create policy "campaign_products_admin_all"
  on public.campaign_products for all
  using (public.get_my_role() in ('admin', 'manager'));

-- Campaign ↔ Categories (many-to-many)
create table public.campaign_categories (
  campaign_id uuid references public.campaigns(id)  on delete cascade not null,
  category_id uuid references public.categories(id) on delete cascade not null,
  primary key (campaign_id, category_id)
);

alter table public.campaign_categories enable row level security;

create policy "campaign_categories_public_select" on public.campaign_categories for select using (true);
create policy "campaign_categories_admin_all"
  on public.campaign_categories for all
  using (public.get_my_role() in ('admin', 'manager'));

-- ============================================================
-- ORDERS
-- ============================================================
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  order_number text unique not null default ('ORD-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(md5(random()::text), 1, 6))),
  user_id uuid references public.profiles(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  customer_type text not null default 'individual' check (customer_type in ('individual', 'business')),
  business_name text,
  fiscal_number text,
  city text not null,
  address text not null,
  notes text,
  subtotal numeric(10,2) not null,
  discount_amount numeric(10,2) not null default 0,
  shipping_cost numeric(10,2) not null default 0,
  vat_amount numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed')),
  payment_method text not null check (payment_method in ('card', 'cash_on_delivery')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'approved', 'declined', 'cancelled', 'needs_clarification')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders enable row level security;

create policy "orders_owner_select" on public.orders for select using (auth.uid() = user_id);
create policy "orders_public_insert" on public.orders for insert with check (true);

create policy "orders_admin_select"
  on public.orders for select
  using (public.get_my_role() in ('admin', 'manager'));

create policy "orders_admin_update"
  on public.orders for update
  using (public.get_my_role() in ('admin', 'manager'));

create index orders_user_id_idx    on public.orders(user_id);
create index orders_status_idx     on public.orders(status);
create index orders_created_at_idx on public.orders(created_at desc);

-- ============================================================
-- ORDER ITEMS
-- ============================================================
create table public.order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  product_name_sq text not null,
  product_name_en text not null,
  product_sku text not null,
  product_image_url text,
  unit_price numeric(10,2) not null,
  sale_price numeric(10,2),
  quantity int not null check (quantity > 0),
  subtotal numeric(10,2) not null,
  created_at timestamptz not null default now()
);

alter table public.order_items enable row level security;

create policy "order_items_owner_select"
  on public.order_items for select
  using (exists (select 1 from public.orders where id = order_id and user_id = auth.uid()));

create policy "order_items_public_insert" on public.order_items for insert with check (true);

create policy "order_items_admin_select"
  on public.order_items for select
  using (public.get_my_role() in ('admin', 'manager'));

-- ============================================================
-- PAYMENTS
-- ============================================================
create table public.payments (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  payment_provider text not null default 'paysera',
  provider_order_id text,
  provider_payment_id text,
  amount numeric(10,2) not null,
  currency text not null default 'EUR',
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined', 'cancelled', 'needs_clarification')),
  callback_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payments enable row level security;

create policy "payments_admin_select"
  on public.payments for select
  using (public.get_my_role() in ('admin', 'manager'));

create policy "payments_system_insert" on public.payments for insert with check (true);
create policy "payments_system_update" on public.payments for update using (true);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_profiles_updated_at   before update on public.profiles   for each row execute function public.handle_updated_at();
create trigger set_products_updated_at   before update on public.products   for each row execute function public.handle_updated_at();
create trigger set_categories_updated_at before update on public.categories for each row execute function public.handle_updated_at();
create trigger set_campaigns_updated_at  before update on public.campaigns  for each row execute function public.handle_updated_at();
create trigger set_orders_updated_at     before update on public.orders     for each row execute function public.handle_updated_at();
create trigger set_payments_updated_at   before update on public.payments   for each row execute function public.handle_updated_at();

-- ============================================================
-- VIEWS
-- ============================================================
create or replace view public.products_with_discount as
select
  p.*,
  c.id            as campaign_id,
  c.title_sq      as campaign_title_sq,
  c.title_en      as campaign_title_en,
  c.discount_type,
  c.discount_value,
  case
    when c.discount_type = 'percentage' then round(p.price * (1 - c.discount_value / 100), 2)
    when c.discount_type = 'fixed'      then greatest(p.price - c.discount_value, 0)
    else p.price
  end as effective_price
from public.products p
left join public.campaign_products cp on cp.product_id = p.id
left join public.campaigns c
  on c.id = cp.campaign_id
  and c.is_active = true
  and now() between c.starts_at and c.ends_at
where p.is_active = true;

create or replace view public.order_summary as
select
  o.*,
  count(oi.id)  as item_count,
  p.status      as payment_status_detail
from public.orders o
left join public.order_items oi on oi.order_id = o.id
left join public.payments p     on p.order_id  = o.id
group by o.id, p.status;

-- ============================================================
-- SEED — Categories
-- ============================================================
insert into public.categories (name_sq, name_en, slug, description_sq, description_en, audience_type, sort_order) values
  ('Pastrimi i Shtëpisë', 'Home Cleaning',       'pastrimi-shtepia',   'Produkte për pastrim shtëpie',           'Products for home cleaning',           'home',     1),
  ('Higjienë Personale',  'Personal Hygiene',     'higjiena-personale', 'Produkte higjiene personale',             'Personal hygiene products',            'both',     2),
  ('Detergjentë',         'Detergents',           'detergjente',        'Detergjentë dhe lëngje larëse',           'Detergents and washing liquids',       'both',     3),
  ('Pastrimi Industrial', 'Industrial Cleaning',  'pastrimi-industrial','Produkte pastrimi profesional',           'Professional cleaning products',       'business', 4),
  ('Dezinfektues',        'Disinfectants',        'dezinfektues',       'Dezinfektues dhe antiseptikë',            'Disinfectants and antiseptics',        'both',     5),
  ('Letër & Tissue',      'Paper & Tissue',       'leter-tissue',       'Letër tualeti, faculeta dhe servieta',    'Toilet paper, tissues and napkins',    'both',     6),
  ('Furnitura Hoteli',    'Hotel Supplies',       'furnitura-hoteli',   'Produkte për hotele dhe restorante',      'Products for hotels and restaurants',  'business', 7),
  ('Pajiset Pastrimit',   'Cleaning Equipment',   'pajiset-pastrimit',  'Pajisje dhe vegla pastrimi',              'Cleaning tools and equipment',         'both',     8);

-- ============================================================
-- SEED — Sample Products
-- ============================================================
insert into public.products (sku, name_sq, name_en, slug, description_sq, description_en, category_id, audience_type, price, stock, unit, is_featured, is_best_seller) values
  ('PRO-001', 'Detergjent Larës Rrobave Premium', 'Premium Laundry Detergent', 'pro-001',
   'Detergjent me formulë të avancuar për heqjen e njollave.',
   'Advanced formula detergent for stain removal.',
   (select id from public.categories where slug = 'detergjente'), 'both', 2.50, 150, 'kg', true, true),

  ('PRO-002', 'Lëng Larës Enësh Lemon Fresh', 'Lemon Fresh Dish Washing Liquid', 'pro-002',
   'Lëng larës enësh me aromë limoni.',
   'Lemon scented dish washing liquid.',
   (select id from public.categories where slug = 'detergjente'), 'both', 1.80, 200, 'L', true, false),

  ('PRO-003', 'Dezinfektues Sipërfaqesh Klori', 'Surface Disinfectant Chlorine', 'pro-003',
   'Dezinfektues profesional me klor. Eliminon 99.9% të baktereve.',
   'Professional chlorine disinfectant. Eliminates 99.9% of bacteria.',
   (select id from public.categories where slug = 'dezinfektues'), 'both', 3.20, 120, 'L', false, true),

  ('PRO-004', 'Letër Tualeti Premium 3 Shtresa', 'Premium 3-Ply Toilet Paper', 'pro-004',
   'Letër tualeti me 3 shtresa. Paketa 12 role.',
   '3-ply toilet paper. Pack of 12 rolls.',
   (select id from public.categories where slug = 'leter-tissue'), 'both', 4.50, 300, 'paketa', true, true),

  ('PRO-005', 'Xhel Dore Antibakterial', 'Antibacterial Hand Gel', 'pro-005',
   'Xhel dore antibakterial me alkool 70%.',
   'Antibacterial hand gel with 70% alcohol.',
   (select id from public.categories where slug = 'higjiena-personale'), 'both', 1.50, 500, 'ml', true, true),

  ('PRO-006', 'Pastrues Banjo Profesional', 'Professional Bathroom Cleaner', 'pro-006',
   'Pastrues banjo për heqjen e gurëzit dhe njollave.',
   'Bathroom cleaner for removing limescale and water stains.',
   (select id from public.categories where slug = 'pastrimi-shtepia'), 'home', 2.90, 180, 'L', false, false),

  ('PRO-007', 'Shampo Hotelerie 30ml', 'Hotel Shampoo 30ml', 'pro-007',
   'Shampo miniaturë e cilësisë së lartë. Paketa 100 cope.',
   'Premium miniature shampoo for hotels. Pack of 100 pieces.',
   (select id from public.categories where slug = 'furnitura-hoteli'), 'business', 35.00, 50, 'paketa/100', false, false),

  ('PRO-008', 'Mop Industrial me Dorezë', 'Industrial Mop with Handle', 'pro-008',
   'Mop profesional me dorezë çeliku inox.',
   'Professional mop with stainless steel handle.',
   (select id from public.categories where slug = 'pajiset-pastrimit'), 'business', 18.50, 75, 'cope', false, false),

  ('PRO-009', 'Pastrues Kuzhinë Degreaser', 'Kitchen Degreaser Cleaner', 'pro-009',
   'Pastrues industrial për kuzhinë. Heq yndyrën e fortë.',
   'Industrial kitchen cleaner. Removes heavy grease.',
   (select id from public.categories where slug = 'pastrimi-industrial'), 'business', 5.80, 90, 'L', false, true),

  ('PRO-010', 'Faculeta Letre Dore Z-Fold', 'Z-Fold Paper Hand Towels', 'pro-010',
   'Faculeta letre Z-fold. Paketa 3000 cope.',
   'Z-fold paper hand towels. Pack of 3000 pieces.',
   (select id from public.categories where slug = 'leter-tissue'), 'business', 22.00, 60, 'paketa', false, true),

  ('PRO-011', 'Pastrues Xhami Crystal Clear', 'Crystal Clear Glass Cleaner', 'pro-011',
   'Pastrues xhami pa rripa. Lë sipërfaqen me shkëlqim.',
   'Streak-free glass cleaner. Leaves surfaces sparkling.',
   (select id from public.categories where slug = 'pastrimi-shtepia'), 'both', 2.20, 160, 'L', false, false),

  ('PRO-012', 'Sapun Dore Liquid Aloevera', 'Liquid Hand Soap Aloevera', 'pro-012',
   'Sapun dore me aloe vera. I butë për lëkurën.',
   'Hand soap with aloe vera. Gentle on skin.',
   (select id from public.categories where slug = 'higjiena-personale'), 'both', 2.80, 220, 'L', true, false);
