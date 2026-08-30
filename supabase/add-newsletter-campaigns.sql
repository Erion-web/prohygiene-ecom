create table if not exists public.newsletter_campaigns (
  id uuid primary key default uuid_generate_v4(),
  subject text not null,
  message text not null,
  audience_count integer not null default 0,
  sent_at timestamptz not null default now(),
  sent_by uuid references public.profiles(id) on delete set null
);

alter table public.newsletter_campaigns enable row level security;

drop policy if exists "newsletter_campaigns_admin_all" on public.newsletter_campaigns;
create policy "newsletter_campaigns_admin_all"
  on public.newsletter_campaigns for all
  using (public.get_my_role() in ('admin', 'manager'));

create index if not exists newsletter_campaigns_sent_at_idx
  on public.newsletter_campaigns (sent_at desc);
