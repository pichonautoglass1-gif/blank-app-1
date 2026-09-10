-- SalesRadar AI MVP schema
create extension if not exists pgcrypto;

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  industry text not null default 'auto_glass',
  home_city text,
  state text default 'AZ',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.territories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  city text not null,
  state text not null default 'AZ',
  radius_miles integer not null default 35 check (radius_miles between 1 and 250),
  created_at timestamptz not null default now()
);

create table if not exists public.signals (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  source_post_id text,
  source_url text,
  author_public_id text,
  body text not null,
  city text,
  state text,
  observed_at timestamptz not null default now(),
  raw jsonb not null default '{}'::jsonb,
  unique(source, source_post_id)
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  signal_id uuid references public.signals(id) on delete set null,
  service text,
  lead_score integer not null check (lead_score between 0 and 100),
  purchase_intent numeric(4,3) check (purchase_intent between 0 and 1),
  urgency numeric(4,3) check (urgency between 0 and 1),
  location text,
  mobile_service boolean not null default false,
  vehicle text,
  ai_reason text,
  suggested_reply text,
  status text not null default 'new' check (status in ('new','contacted','quoted','booked','won','lost')),
  estimated_value numeric(10,2),
  won_revenue numeric(10,2),
  created_at timestamptz not null default now(),
  contacted_at timestamptz,
  won_at timestamptz
);

create index if not exists leads_business_score_idx on public.leads (business_id, lead_score desc, created_at desc);
create index if not exists signals_observed_idx on public.signals (observed_at desc);

alter table public.businesses enable row level security;
alter table public.territories enable row level security;
alter table public.signals enable row level security;
alter table public.leads enable row level security;

create policy "owners read businesses"
on public.businesses for select
to authenticated
using ((select auth.uid()) = owner_id);

create policy "owners update businesses"
on public.businesses for update
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create policy "owners read territories"
on public.territories for select
to authenticated
using (exists (
  select 1 from public.businesses b
  where b.id = business_id and b.owner_id = (select auth.uid())
));

create policy "owners manage territories"
on public.territories for all
to authenticated
using (exists (
  select 1 from public.businesses b
  where b.id = business_id and b.owner_id = (select auth.uid())
))
with check (exists (
  select 1 from public.businesses b
  where b.id = business_id and b.owner_id = (select auth.uid())
));

-- Raw signals are intentionally server-only. RLS is enabled with no anon/authenticated policy.
-- Ingestion workers may write using a server-side secret key that is never exposed to browsers.

create policy "owners read leads"
on public.leads for select
to authenticated
using (exists (
  select 1 from public.businesses b
  where b.id = business_id and b.owner_id = (select auth.uid())
));

create policy "owners update leads"
on public.leads for update
to authenticated
using (exists (
  select 1 from public.businesses b
  where b.id = business_id and b.owner_id = (select auth.uid())
))
with check (exists (
  select 1 from public.businesses b
  where b.id = business_id and b.owner_id = (select auth.uid())
));
