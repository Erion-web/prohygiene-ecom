create or replace function public.protect_profiles_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
      raise exception 'Cannot change profile role';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.protect_profiles_role();

drop policy if exists "payments_system_insert" on public.payments;
drop policy if exists "payments_system_update" on public.payments;

drop policy if exists "orders_public_insert" on public.orders;
drop policy if exists "order_items_public_insert" on public.order_items;

notify pgrst, 'reload schema';
