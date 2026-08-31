create table if not exists public.homepage_packages (
  id         uuid primary key default gen_random_uuid(),
  audience   text not null check (audience in ('home', 'office', 'horeca')),
  image_url  text not null,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.homepage_packages alter column image_url set not null;
create unique index if not exists homepage_packages_audience_uidx
  on public.homepage_packages (audience);

alter table public.homepage_packages enable row level security;

drop policy if exists "homepage_packages_public_select" on public.homepage_packages;
create policy "homepage_packages_public_select"
  on public.homepage_packages for select using (is_active = true);

drop policy if exists "homepage_packages_admin_all" on public.homepage_packages;
create policy "homepage_packages_admin_all"
  on public.homepage_packages for all
  using (public.get_my_role() in ('admin', 'manager'));

notify pgrst, 'reload schema';
