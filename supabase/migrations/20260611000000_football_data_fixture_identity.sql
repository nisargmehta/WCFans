update public.fixtures as fixture
set match_id = fixture.football_data_match_id::text
where fixture.source = 'football-data'
  and fixture.football_data_match_id is not null
  and fixture.match_id is distinct from fixture.football_data_match_id::text
  and not exists (
    select 1
    from public.fixtures existing_fixture
    where existing_fixture.match_id = fixture.football_data_match_id::text
  );
