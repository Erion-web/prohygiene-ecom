-- Newsletter subscriber pool
create table public.newsletter_subscribers (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  unsubscribe_token uuid not null default uuid_generate_v4(),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;

-- Anyone can subscribe (footer form, guests included)
create policy "newsletter_public_insert" on public.newsletter_subscribers
  for insert with check (true);

-- Only admins/managers can list subscribers; sending and unsubscribe go
-- through server routes using the service role key, which bypasses RLS.
create policy "newsletter_admin_select" on public.newsletter_subscribers
  for select using (public.get_my_role() in ('admin', 'manager'));

create index newsletter_subscribers_active_idx on public.newsletter_subscribers(is_active);
