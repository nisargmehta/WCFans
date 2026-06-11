create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_type text not null,
  event_name text not null,
  feature_area text,
  page_view text,
  target_id text,
  target_label text,
  metadata jsonb not null default '{}'::jsonb,
  visitor_id text,
  session_id text,
  url text,
  referrer text
);

create index if not exists analytics_events_created_at_idx on public.analytics_events (created_at desc);
create index if not exists analytics_events_event_type_idx on public.analytics_events (event_type);
create index if not exists analytics_events_event_name_idx on public.analytics_events (event_name);
create index if not exists analytics_events_feature_area_idx on public.analytics_events (feature_area);
create index if not exists analytics_events_visitor_id_idx on public.analytics_events (visitor_id);

alter table public.analytics_events enable row level security;

drop policy if exists "Public can insert analytics events" on public.analytics_events;
create policy "Public can insert analytics events"
  on public.analytics_events
  for insert
  with check (event_type in ('click', 'app_launch'));
