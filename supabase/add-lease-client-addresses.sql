create table if not exists public.lease_client_addresses (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.lease_clients(id) on delete cascade,
  label text not null default 'Kryesore',
  city text not null,
  address text not null default '',
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists lease_client_addresses_client_idx
  on public.lease_client_addresses (client_id);

alter table public.lease_client_addresses enable row level security;

drop policy if exists lease_client_addresses_admin_all on public.lease_client_addresses;
create policy lease_client_addresses_admin_all
  on public.lease_client_addresses for all
  using (public.get_my_role() in ('admin', 'manager'));

insert into public.lease_client_addresses (client_id, label, city, address, is_primary)
select
  id,
  'Kryesore',
  coalesce(nullif(city, ''), 'Prishtinë'),
  coalesce(address, ''),
  true
from public.lease_clients c
where not exists (
  select 1 from public.lease_client_addresses a where a.client_id = c.id
);
