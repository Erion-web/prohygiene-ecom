alter table public.lease_contracts
  add column if not exists contract_number integer;

with numbered as (
  select id, row_number() over (order by created_at, id) as n
  from public.lease_contracts
  where contract_number is null
)
update public.lease_contracts c
set contract_number = numbered.n
from numbered
where c.id = numbered.id;

create unique index if not exists lease_contracts_number_uidx
  on public.lease_contracts (contract_number);

notify pgrst, 'reload schema';
