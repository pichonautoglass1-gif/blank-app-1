-- SalesRadar AI MVP schema
create extension if not exists pgcrypto;

create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  industry text not null default 'auto_glass',
  home_city text,
  state text default 'AZ',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists territories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  city text not null,
  state text not null default 'AZ',
  radius_miles integer default 35,
  created_at timestamptz not null default now()
);

create table if not exists signals (
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

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  signal_id uuid references signals(id) on delete set null,
  service text,
  lead_score integer not null check (lead_score between 0 and 100),
  purchase_intent numeric(4,3),
  urgency numeric(4,3),
  location text,
  mobile_service boolean default false,
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

create index if not exists leads_business_score_idx on leads (business_id, lead_score desc, created_at desc);
create index if not exists signals_observed_idx on signals (observed_at desc);

alter table businesses enable row level security;
alter table territories enable row level security;
alter table leads enable row level security;

create policy "owners read businesses" on businesses for select using (auth.uid() = owner_id);
create policy "owners read territories" on territories for select using (exists (select 1 from businesses b where b.id = business_id and b.owner_id = auth.uid()));
create policy "owners read leads" on leads for select using (exists (select 1 from businesses b where b.id = business_id and b.owner_id = auth.uid()));
