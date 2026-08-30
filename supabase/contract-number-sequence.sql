create sequence if not exists public.lease_contracts_number_seq;

select setval(
  'public.lease_contracts_number_seq',
  coalesce((select max(contract_number) from public.lease_contracts), 0)
);

create or replace function public.set_lease_contract_number()
returns trigger
language plpgsql
as $$
begin
  if new.contract_number is null then
    new.contract_number := nextval('public.lease_contracts_number_seq');
  end if;
  return new;
end;
$$;

drop trigger if exists lease_contracts_set_number on public.lease_contracts;
create trigger lease_contracts_set_number
  before insert on public.lease_contracts
  for each row execute function public.set_lease_contract_number();

notify pgrst, 'reload schema';
