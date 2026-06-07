alter table public.fixtures
  add column if not exists football_data_match_id integer unique,
  add column if not exists home_football_data_team_id integer,
  add column if not exists away_football_data_team_id integer,
  add column if not exists status text,
  add column if not exists minute integer,
  add column if not exists home_score integer,
  add column if not exists away_score integer,
  add column if not exists score_winner text,
  add column if not exists raw_payload jsonb not null default '{}'::jsonb;

create index if not exists fixtures_football_data_match_id_idx on public.fixtures (football_data_match_id);
create index if not exists fixtures_status_kickoff_at_idx on public.fixtures (status, kickoff_at);
