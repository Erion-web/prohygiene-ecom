do $$
declare
  r record;
begin
  for r in
    select c.conname
    from pg_constraint c
    where c.conrelid = 'public.orders'::regclass
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ~* '\mstatus\M'
      and pg_get_constraintdef(c.oid) !~* 'payment_status'
  loop
    execute format('alter table public.orders drop constraint if exists %I', r.conname);
  end loop;
end $$;

update public.orders
set status = 'processing'
where status in ('confirmed', 'shipped');

update public.orders
set status = 'completed'
where status in ('delivered', 'completed');

update public.orders
set status = 'pending'
where status is null
   or status not in ('pending', 'processing', 'completed');

alter table public.orders
  drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check
  check (status in ('pending', 'processing', 'completed'));
