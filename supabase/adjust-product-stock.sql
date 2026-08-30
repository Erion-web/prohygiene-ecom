create or replace function public.adjust_product_stock(p_product_id uuid, p_delta integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer;
begin
  if p_delta < 0 then
    update public.products
    set stock = stock + p_delta
    where id = p_product_id and stock >= abs(p_delta);
  else
    update public.products
    set stock = stock + p_delta
    where id = p_product_id;
  end if;

  get diagnostics updated_count = row_count;
  return updated_count > 0;
end;
$$;

notify pgrst, 'reload schema';
