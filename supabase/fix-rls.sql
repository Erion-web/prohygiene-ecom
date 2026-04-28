-- ============================================================
-- FIX: Infinite recursion in RLS policies
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Drop all the recursive policies
drop policy if exists "Public profiles are viewable by owner and admin" on public.profiles;
drop policy if exists "Admins can view all profiles"                    on public.profiles;
drop policy if exists "Users can update own profile"                    on public.profiles;
drop policy if exists "Admins can manage categories"                    on public.categories;
drop policy if exists "Admins can manage products"                      on public.products;
drop policy if exists "Admins can manage campaigns"                     on public.campaigns;
drop policy if exists "Admins can manage campaign products"             on public.campaign_products;
drop policy if exists "Admins can manage campaign categories"           on public.campaign_categories;
drop policy if exists "Admins can view all orders"                      on public.orders;
drop policy if exists "Admins can update orders"                        on public.orders;
drop policy if exists "Admins can view all order items"                 on public.order_items;
drop policy if exists "Admins can view all payments"                    on public.payments;

-- 2. Security-definer helper — runs WITHOUT triggering RLS, breaking the loop
create or replace function public.get_my_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- 3. Re-create policies using the function (no recursion)

-- profiles
create policy "profiles_select"
  on public.profiles for select
  using (auth.uid() = id or public.get_my_role() in ('admin', 'manager'));

create policy "profiles_update"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles_insert"
  on public.profiles for insert
  with check (auth.uid() = id);

-- categories
create policy "categories_admin_all"
  on public.categories for all
  using (public.get_my_role() in ('admin', 'manager'));

-- products
create policy "products_admin_all"
  on public.products for all
  using (public.get_my_role() in ('admin', 'manager'));

-- campaigns
create policy "campaigns_admin_all"
  on public.campaigns for all
  using (public.get_my_role() in ('admin', 'manager'));

-- campaign_products
create policy "campaign_products_admin_all"
  on public.campaign_products for all
  using (public.get_my_role() in ('admin', 'manager'));

-- campaign_categories
create policy "campaign_categories_admin_all"
  on public.campaign_categories for all
  using (public.get_my_role() in ('admin', 'manager'));

-- orders
create policy "orders_admin_select"
  on public.orders for select
  using (public.get_my_role() in ('admin', 'manager'));

create policy "orders_admin_update"
  on public.orders for update
  using (public.get_my_role() in ('admin', 'manager'));

-- order_items
create policy "order_items_admin_select"
  on public.order_items for select
  using (public.get_my_role() in ('admin', 'manager'));

-- payments
create policy "payments_admin_select"
  on public.payments for select
  using (public.get_my_role() in ('admin', 'manager'));

-- ============================================================
-- Also set erion@gen-z.digital as admin while we're here
-- ============================================================
update auth.users
set raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
where email = 'erion@gen-z.digital';

insert into public.profiles (id, email, full_name, role, customer_type)
select id, email, email, 'admin', 'individual'
from auth.users
where email = 'erion@gen-z.digital'
on conflict (id) do update set role = 'admin';
