create table if not exists public.standings (
  league_id integer not null,
  season integer not null,
  team_id integer not null,
  team_name text not null,
  team_logo text,
  group_name text,
  rank integer,
  points integer,
  goals_diff integer,
  form text,
  status text,
  description text,
  all_played integer,
  all_win integer,
  all_draw integer,
  all_lose integer,
  goals_for integer,
  goals_against integer,
  raw_payload jsonb not null default '{}'::jsonb,
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (league_id, season, team_id)
);

create index if not exists standings_league_season_rank_idx on public.standings (league_id, season, rank);
create index if not exists standings_group_rank_idx on public.standings (group_name, rank);
create index if not exists standings_updated_at_idx on public.standings (updated_at desc);

alter table public.standings enable row level security;

drop policy if exists "Public can read standings" on public.standings;
create policy "Public can read standings"
  on public.standings
  for select
  using (true);
