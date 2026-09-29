-- Run after add-comparisons.sql if competitors table already exists
alter table public.competitors
  add column if not exists products_api_url text,
  add column if not exists json_catalog_config jsonb not null default '{}'::jsonb;
