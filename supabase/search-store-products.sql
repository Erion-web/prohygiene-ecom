create or replace function public.search_store_products(
  search_query text,
  result_limit int default 8
)
returns table (
  id uuid,
  slug text,
  sku text,
  name_sq text,
  name_en text,
  price numeric,
  sale_price numeric,
  stock int,
  unit text,
  image_url text,
  audience_type text,
  listing_type text,
  available_for_lease boolean,
  is_featured boolean,
  is_best_seller boolean,
  vat_rate numeric,
  category_id uuid,
  category_slug text,
  category_name_sq text,
  category_name_en text
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  q text;
  lim int;
begin
  q := trim(regexp_replace(coalesce(search_query, ''), '[%_,()]', ' ', 'g'));
  q := regexp_replace(q, '\s+', ' ', 'g');

  if length(q) < 2 then
    return;
  end if;

  lim := greatest(1, least(coalesce(result_limit, 8), 100));

  return query
  select
    p.id,
    p.slug,
    p.sku,
    p.name_sq,
    p.name_en,
    p.price,
    p.sale_price,
    p.stock,
    p.unit,
    p.image_url,
    p.audience_type,
    p.listing_type,
    p.available_for_lease,
    p.is_featured,
    p.is_best_seller,
    p.vat_rate,
    c.id,
    c.slug,
    c.name_sq,
    c.name_en
  from public.products p
  left join public.categories c on c.id = p.category_id and c.is_active = true
  where p.is_active = true
    and p.listing_type = 'sale'
    and (
      p.name_sq ilike '%' || q || '%'
      or p.name_en ilike '%' || q || '%'
      or p.sku ilike '%' || q || '%'
    )
  order by
    case
      when p.name_sq ilike q || '%' then 0
      when p.name_en ilike q || '%' then 1
      when p.sku ilike q || '%' then 2
      else 3
    end,
    p.name_sq asc
  limit lim;
end;
$$;

grant execute on function public.search_store_products(text, int) to anon, authenticated;
