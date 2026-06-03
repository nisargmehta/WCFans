create table if not exists public.news_articles (
  id text primary key,
  headline text not null,
  summary text,
  image_url text,
  category text,
  source text,
  url text not null unique,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fixtures (
  match_id text primary key,
  kickoff_at timestamptz not null,
  home_team text not null,
  away_team text not null,
  group_name text,
  round_name text,
  ground text,
  api_football_fixture_id integer unique,
  home_api_football_team_id integer,
  away_api_football_team_id integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fixture_previews (
  match_id text primary key references public.fixtures(match_id) on delete cascade,
  generated_at timestamptz not null default now(),
  refresh_label text not null default 'Prematch preview refreshed',
  head_to_head_summary text,
  head_to_head_sources jsonb not null default '[]'::jsonb,
  players_to_watch jsonb not null default '[]'::jsonb,
  injuries jsonb not null default '[]'::jsonb,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists news_articles_published_at_idx on public.news_articles (published_at desc);
create index if not exists fixtures_kickoff_at_idx on public.fixtures (kickoff_at);
create index if not exists fixtures_api_football_fixture_id_idx on public.fixtures (api_football_fixture_id);
create index if not exists fixture_previews_updated_at_idx on public.fixture_previews (updated_at desc);

alter table public.news_articles enable row level security;
alter table public.fixtures enable row level security;
alter table public.fixture_previews enable row level security;

drop policy if exists "Public can read news articles" on public.news_articles;
create policy "Public can read news articles"
  on public.news_articles
  for select
  using (true);

drop policy if exists "Public can read fixtures" on public.fixtures;
create policy "Public can read fixtures"
  on public.fixtures
  for select
  using (true);

drop policy if exists "Public can read fixture previews" on public.fixture_previews;
create policy "Public can read fixture previews"
  on public.fixture_previews
  for select
  using (true);
