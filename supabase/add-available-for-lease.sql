alter table public.products
  add column if not exists available_for_lease boolean not null default false;

update public.products
set available_for_lease = true
where listing_type = 'lease'
  and available_for_lease = false;

create index if not exists products_available_for_lease_idx
  on public.products (available_for_lease)
  where available_for_lease = true;
