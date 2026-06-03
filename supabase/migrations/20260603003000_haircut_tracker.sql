create table if not exists public.haircut_tracker (
  league_id integer not null,
  season integer not null,
  team_id integer not null,
  team_name text not null,
  team_logo text,
  group_name text,
  form text,
  wins_in_a_row integer not null default 0,
  can_cut_hair boolean not null default false,
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (league_id, season, team_id)
);

create index if not exists haircut_tracker_streak_idx on public.haircut_tracker (wins_in_a_row desc);
create index if not exists haircut_tracker_group_idx on public.haircut_tracker (group_name);
create index if not exists haircut_tracker_updated_at_idx on public.haircut_tracker (updated_at desc);

alter table public.haircut_tracker enable row level security;

drop policy if exists "Public can read haircut tracker" on public.haircut_tracker;
create policy "Public can read haircut tracker"
  on public.haircut_tracker
  for select
  using (true);
