alter table public.fixtures
  add column if not exists match_details_last_checked_at timestamptz,
  add column if not exists match_details_synced_at timestamptz,
  add column if not exists match_details_last_updated_at timestamptz,
  add column if not exists home_formation text,
  add column if not exists away_formation text,
  add column if not exists home_lineup jsonb not null default '[]'::jsonb,
  add column if not exists away_lineup jsonb not null default '[]'::jsonb,
  add column if not exists home_bench jsonb not null default '[]'::jsonb,
  add column if not exists away_bench jsonb not null default '[]'::jsonb,
  add column if not exists home_statistics jsonb not null default '{}'::jsonb,
  add column if not exists away_statistics jsonb not null default '{}'::jsonb,
  add column if not exists goals jsonb not null default '[]'::jsonb,
  add column if not exists bookings jsonb not null default '[]'::jsonb,
  add column if not exists substitutions jsonb not null default '[]'::jsonb,
  add column if not exists penalties jsonb not null default '[]'::jsonb,
  add column if not exists score_detail jsonb not null default '{}'::jsonb,
  add column if not exists match_details_raw_payload jsonb not null default '{}'::jsonb;

do $$
begin
  if exists (
    select 1
    from information_schema.table_constraints
    where constraint_schema = 'public'
      and table_name = 'fixture_previews'
      and constraint_name = 'fixture_previews_match_id_fkey'
  ) then
    alter table public.fixture_previews
      drop constraint fixture_previews_match_id_fkey;
  end if;
end $$;

alter table public.fixture_previews
  add constraint fixture_previews_match_id_fkey
  foreign key (match_id)
  references public.fixtures(match_id)
  on update cascade
  on delete cascade;

update public.fixtures as fixture
set match_id = fixture.football_data_match_id::text
where fixture.source = 'football-data'
  and fixture.football_data_match_id is not null
  and fixture.match_id = 'football-data-' || fixture.football_data_match_id::text
  and not exists (
    select 1
    from public.fixtures existing_fixture
    where existing_fixture.match_id = fixture.football_data_match_id::text
  );

create index if not exists fixtures_match_details_due_idx
  on public.fixtures (kickoff_at, status, match_details_last_checked_at)
  where football_data_match_id is not null;
