-- Per-brand price gating: when true, guests (not logged in) see the product
-- but not its price/add-to-cart — used for SUCITESA to require an account.
alter table public.brands
  add column if not exists hide_price_unless_authenticated boolean not null default false;

-- search_store_products is called directly from the browser (anon key, no
-- Next.js server route in between), so it's the one surface where the price
-- gate has to be enforced inside Postgres itself using auth.uid() — that's
-- the only way to guarantee a gated price never reaches an anonymous caller,
-- since there's no server-side app code in the loop to filter it afterward.
-- CREATE OR REPLACE can't change a function's return columns, so drop first.
drop function if exists public.search_store_products(text, int);

create function public.search_store_products(
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
  brand_id uuid,
  category_id uuid,
  category_slug text,
  category_name_sq text,
  category_name_en text,
  price_hidden boolean
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  q text;
  lim int;
  is_authed boolean;
begin
  q := trim(regexp_replace(coalesce(search_query, ''), '[%_,()]', ' ', 'g'));
  q := regexp_replace(q, '\s+', ' ', 'g');

  if length(q) < 2 then
    return;
  end if;

  lim := greatest(1, least(coalesce(result_limit, 8), 100));
  is_authed := auth.uid() is not null;

  return query
  select
    p.id,
    p.slug,
    p.sku,
    p.name_sq,
    p.name_en,
    case when not is_authed and coalesce(b.hide_price_unless_authenticated, false) then null else p.price end,
    case when not is_authed and coalesce(b.hide_price_unless_authenticated, false) then null else p.sale_price end,
    p.stock,
    p.unit,
    p.image_url,
    p.audience_type,
    p.listing_type,
    p.available_for_lease,
    p.is_featured,
    p.is_best_seller,
    p.vat_rate,
    p.brand_id,
    c.id,
    c.slug,
    c.name_sq,
    c.name_en,
    (not is_authed and coalesce(b.hide_price_unless_authenticated, false))
  from public.products p
  left join public.categories c on c.id = p.category_id and c.is_active = true
  left join public.brands b on b.id = p.brand_id
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
