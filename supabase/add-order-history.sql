-- Manual (admin-created) orders can have their prices edited; every admin change is logged.

alter table public.orders
  add column if not exists source text not null default 'web' check (source in ('web', 'admin'));

create table if not exists public.order_history (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  actor_id    uuid,
  actor_label text not null,
  summary     text not null,
  changes     jsonb not null default '[]',
  created_at  timestamptz not null default now()
);

create index if not exists order_history_order_id_idx on public.order_history(order_id, created_at desc);

alter table public.order_history enable row level security;

create policy "order_history_admin_select"
  on public.order_history for select
  using (public.get_my_role() in ('admin', 'manager'));

create policy "order_history_admin_insert"
  on public.order_history for insert
  with check (public.get_my_role() in ('admin', 'manager'));

-- To allow price editing on an older manual order, mark it once:
--   update public.orders set source = 'admin' where order_number = 'ORD-XXXXXXXX-XXXXXX';

notify pgrst, 'reload schema';
