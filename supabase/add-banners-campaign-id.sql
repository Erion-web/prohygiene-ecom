alter table public.banners
  add column if not exists campaign_id uuid references public.campaigns(id) on delete set null;

create index if not exists banners_campaign_id_idx on public.banners (campaign_id);

notify pgrst, 'reload schema';
