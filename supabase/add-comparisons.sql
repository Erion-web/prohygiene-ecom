-- ============================================================
-- Migration: Competitor price comparison
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

create table if not exists public.competitors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  catalog_url text not null,
  is_active boolean not null default true,
  selector_card text,
  selector_name text,
  selector_price text,
  selector_link text,
  selector_next_page text,
  scrape_interval_hours int not null default 168,
  last_scraped_at timestamptz,
  last_success_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.scrape_runs (
  id uuid primary key default gen_random_uuid(),
  competitor_id uuid not null references public.competitors(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'running', 'completed', 'failed')),
  cursor jsonb not null default '{}'::jsonb,
  pages_processed int not null default 0,
  products_upserted int not null default 0,
  error_message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists scrape_runs_competitor_idx on public.scrape_runs(competitor_id);
create index if not exists scrape_runs_status_idx on public.scrape_runs(status);

create table if not exists public.competitor_products (
  id uuid primary key default gen_random_uuid(),
  competitor_id uuid not null references public.competitors(id) on delete cascade,
  external_sku text,
  name text not null,
  price numeric,
  currency text not null default 'EUR',
  product_url text not null,
  price_raw text,
  scraped_at timestamptz not null default now(),
  matched_product_id uuid references public.products(id) on delete set null,
  match_confidence numeric,
  unique (competitor_id, product_url)
);

create index if not exists competitor_products_competitor_idx on public.competitor_products(competitor_id);
create index if not exists competitor_products_matched_idx on public.competitor_products(matched_product_id);
create index if not exists competitor_products_name_idx on public.competitor_products using gin (to_tsvector('simple', name));

create table if not exists public.competitor_price_history (
  id uuid primary key default gen_random_uuid(),
  competitor_product_id uuid not null references public.competitor_products(id) on delete cascade,
  price numeric not null,
  recorded_at timestamptz not null default now()
);

create index if not exists competitor_price_history_product_idx
  on public.competitor_price_history(competitor_product_id, recorded_at desc);

create table if not exists public.comparison_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'Bisedë e re',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists comparison_threads_user_idx
  on public.comparison_threads(user_id, updated_at desc);

create table if not exists public.comparison_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.comparison_threads(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'tool')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists comparison_messages_thread_idx
  on public.comparison_messages(thread_id, created_at asc);

alter table public.competitors enable row level security;
alter table public.scrape_runs enable row level security;
alter table public.competitor_products enable row level security;
alter table public.competitor_price_history enable row level security;
alter table public.comparison_threads enable row level security;
alter table public.comparison_messages enable row level security;

create policy "competitors_admin_all"
  on public.competitors for all
  using (public.get_my_role() in ('admin', 'manager'));

create policy "scrape_runs_admin_all"
  on public.scrape_runs for all
  using (public.get_my_role() in ('admin', 'manager'));

create policy "competitor_products_admin_all"
  on public.competitor_products for all
  using (public.get_my_role() in ('admin', 'manager'));

create policy "competitor_price_history_admin_select"
  on public.competitor_price_history for select
  using (public.get_my_role() in ('admin', 'manager'));

create policy "comparison_threads_admin_all"
  on public.comparison_threads for all
  using (public.get_my_role() in ('admin', 'manager'))
  with check (public.get_my_role() in ('admin', 'manager'));

create policy "comparison_messages_admin_all"
  on public.comparison_messages for all
  using (public.get_my_role() in ('admin', 'manager'))
  with check (public.get_my_role() in ('admin', 'manager'));

insert into public.app_settings (key, value) values
  ('comparison_ai', '{"model":"deepseek-chat","temperature":0.2}'::jsonb)
on conflict (key) do nothing;
