-- Keep only: pending, processing, completed
-- Run in Supabase Dashboard → SQL Editor

update public.orders
set status = 'processing'
where status in ('confirmed', 'shipped');

update public.orders
set status = 'completed'
where status = 'delivered';

update public.orders
set status = 'pending'
where status = 'cancelled';

alter table public.orders
  drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check
  check (status in ('pending', 'processing', 'completed'));
