alter table public.fixtures
  add column if not exists source text not null default 'local';

create index if not exists fixtures_source_kickoff_at_idx on public.fixtures (source, kickoff_at);
