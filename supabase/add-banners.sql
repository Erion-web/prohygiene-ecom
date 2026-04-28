-- Banners table
create table if not exists public.banners (
  id         uuid primary key default gen_random_uuid(),
  image_url  text not null,
  is_active  boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz default now()
);

alter table public.banners enable row level security;

create policy "Admin full access" on public.banners
  for all using (public.get_my_role() in ('admin', 'manager'));

create policy "Public read active" on public.banners
  for select using (is_active = true);

-- Storage bucket for banners (run if bucket doesn't exist yet)
insert into storage.buckets (id, name, public)
values ('banner-images', 'banner-images', true)
on conflict do nothing;

create policy "Admin upload banner-images" on storage.objects
  for insert with check (
    bucket_id = 'banner-images'
    and public.get_my_role() in ('admin', 'manager')
  );

create policy "Admin manage banner-images" on storage.objects
  for all using (
    bucket_id = 'banner-images'
    and public.get_my_role() in ('admin', 'manager')
  );

create policy "Public view banner-images" on storage.objects
  for select using (bucket_id = 'banner-images');
