-- SalesRadar AI production schema
create extension if not exists pgcrypto;

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null unique,
  industry text not null default 'auto_glass',
  home_city text,
  state text not null default 'AZ',
  timezone text not null default 'America/Phoenix',
  phone text,
  website text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.territories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  city text not null,
  state text not null default 'AZ',
  radius_miles integer not null default 35 check (radius_miles between 1 and 250),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.watch_rules (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  service text not null,
  include_terms text[] not null default '{}',
  exclude_terms text[] not null default '{}',
  min_intent_score integer not null default 70 check (min_intent_score between 0 and 100),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.source_connections (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  provider text not null,
  status text not null default 'disconnected' check (status in ('disconnected','connected','error','paused')),
  external_account_label text,
  last_synced_at timestamptz,
  last_error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, provider)
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
  created_at timestamptz not null default now(),
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
  city text,
  state text,
  mobile_service boolean not null default false,
  vehicle text,
  ai_reason text,
  suggested_reply text,
  status text not null default 'new' check (status in ('new','contacted','quoted','booked','won','lost')),
  estimated_value numeric(10,2) check (estimated_value is null or estimated_value >= 0),
  won_revenue numeric(10,2) check (won_revenue is null or won_revenue >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  contacted_at timestamptz,
  won_at timestamptz
);

create table if not exists public.lead_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists businesses_owner_idx on public.businesses (owner_id);
create index if not exists territories_business_idx on public.territories (business_id);
create index if not exists watch_rules_business_idx on public.watch_rules (business_id, active);
create index if not exists source_connections_business_idx on public.source_connections (business_id, status);
create index if not exists signals_observed_idx on public.signals (observed_at desc);
create index if not exists leads_business_score_idx on public.leads (business_id, lead_score desc, created_at desc);
create index if not exists leads_status_idx on public.leads (business_id, status, created_at desc);
create index if not exists leads_signal_idx on public.leads (signal_id);
create index if not exists lead_events_lead_idx on public.lead_events (lead_id, created_at desc);
create index if not exists lead_events_business_idx on public.lead_events (business_id, created_at desc);
create index if not exists lead_events_actor_idx on public.lead_events (actor_user_id) where actor_user_id is not null;

alter table public.businesses enable row level security;
alter table public.territories enable row level security;
alter table public.watch_rules enable row level security;
alter table public.source_connections enable row level security;
alter table public.signals enable row level security;
alter table public.leads enable row level security;
alter table public.lead_events enable row level security;

create policy businesses_select_own on public.businesses for select to authenticated using ((select auth.uid()) = owner_id);
create policy businesses_insert_own on public.businesses for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy businesses_update_own on public.businesses for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

create policy territories_select_own on public.territories for select to authenticated using (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid())));
create policy territories_insert_own on public.territories for insert to authenticated with check (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid())));
create policy territories_update_own on public.territories for update to authenticated using (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid()))) with check (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid())));
create policy territories_delete_own on public.territories for delete to authenticated using (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid())));

create policy watch_rules_select_own on public.watch_rules for select to authenticated using (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid())));
create policy watch_rules_insert_own on public.watch_rules for insert to authenticated with check (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid())));
create policy watch_rules_update_own on public.watch_rules for update to authenticated using (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid()))) with check (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid())));
create policy watch_rules_delete_own on public.watch_rules for delete to authenticated using (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid())));

create policy source_connections_select_own on public.source_connections for select to authenticated using (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid())));
create policy source_connections_update_own on public.source_connections for update to authenticated using (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid()))) with check (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid())));

create policy signals_deny_authenticated_select on public.signals for select to authenticated using (false);

create policy leads_select_own on public.leads for select to authenticated using (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid())));
create policy leads_update_own on public.leads for update to authenticated using (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid()))) with check (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid())));

create policy lead_events_select_own on public.lead_events for select to authenticated using (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid())));

create or replace function public.set_updated_at() returns trigger language plpgsql security invoker set search_path = public as $$ begin new.updated_at = now(); return new; end; $$;
revoke all on function public.set_updated_at() from public;
grant execute on function public.set_updated_at() to authenticated;

create trigger businesses_set_updated_at before update on public.businesses for each row execute function public.set_updated_at();
create trigger watch_rules_set_updated_at before update on public.watch_rules for each row execute function public.set_updated_at();
create trigger source_connections_set_updated_at before update on public.source_connections for each row execute function public.set_updated_at();
create trigger leads_set_updated_at before update on public.leads for each row execute function public.set_updated_at();

-- Raw signals and lead creation remain server-only: no anon/authenticated INSERT policy is granted.