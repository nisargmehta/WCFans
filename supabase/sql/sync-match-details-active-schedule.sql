-- Replaces the blind every-minute sync-match-details HTTP call with a guarded
-- schedule that only invokes the Edge Function around active fixture windows.
-- It preserves the existing cron command so the stored Authorization header is reused.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

do $$
declare
  existing_command text;
  guarded_command text;
  old_guard text;
  current_guard text;
  new_guard text;
  job record;
begin
  select command
  into existing_command
  from cron.job
  where jobname in ('sync-match-details-every-minute', 'sync-match-details-when-active')
    or command like '%/functions/v1/sync-match-details%'
  order by case
    when jobname = 'sync-match-details-every-minute' then 0
    when jobname = 'sync-match-details-when-active' then 1
    else 2
  end
  limit 1;

  if existing_command is null then
    raise exception 'Could not find an existing sync-match-details cron command to preserve.';
  end if;

  old_guard := $old$
  where exists (
    select 1
    from public.fixtures
    where football_data_match_id is not null
      and coalesce(status, '') not in ('FINISHED', 'AWARDED', 'CANCELLED', 'CANCELED', 'POSTPONED', 'SUSPENDED')
      and kickoff_at between now() - interval '180 minutes' and now() + interval '60 minutes'
  );
$old$;

  current_guard := $current$
  where exists (
    select 1
    from public.fixtures
    where football_data_match_id is not null
      and (
        (
          coalesce(status, '') not in ('FINISHED', 'AWARDED', 'CANCELLED', 'CANCELED', 'POSTPONED', 'SUSPENDED')
          and kickoff_at between now() - interval '180 minutes' and now() + interval '60 minutes'
        )
        or (
          status = 'FINISHED'
          and (home_score is null or away_score is null)
          and kickoff_at between now() - interval '24 hours' and now()
        )
      )
  );
$current$;

  new_guard := $new$
  where exists (
    select 1
    from public.fixtures
    where football_data_match_id is not null
      and (
        (
          coalesce(status, '') not in ('FINISHED', 'AWARDED', 'CANCELLED', 'CANCELED', 'POSTPONED', 'SUSPENDED')
          and kickoff_at between now() - interval '180 minutes' and now() + interval '60 minutes'
        )
        or (
          status in ('IN_PLAY', 'PAUSED', 'SUSPENDED')
          and kickoff_at between now() - interval '48 hours' and now()
        )
        or (
          status = 'FINISHED'
          and (home_score is null or away_score is null)
          and kickoff_at between now() - interval '24 hours' and now()
        )
      )
  );
$new$;

  if existing_command ilike '%interval ''48 hours''%'
  then
    guarded_command := existing_command;
  elsif existing_command ilike '%status = ''FINISHED''%'
    and existing_command ilike '%home_score is null or away_score is null%'
  then
    guarded_command := replace(existing_command, current_guard, new_guard);
  elsif existing_command ilike '%football_data_match_id is not null%'
    and existing_command ilike '%kickoff_at between now()%'
  then
    guarded_command := replace(existing_command, old_guard, new_guard);
  else
    guarded_command := regexp_replace(existing_command, ';\s*$', '') || new_guard;
  end if;

  for job in
    select jobid
    from cron.job
    where jobname in ('sync-match-details-every-minute', 'sync-match-details-when-active')
      or command like '%/functions/v1/sync-match-details%'
  loop
    perform cron.unschedule(job.jobid);
  end loop;

  perform cron.schedule(
    'sync-match-details-when-active',
    '* * * * *',
    guarded_command
  );
end $$;

select jobid, jobname, schedule, command
from cron.job
where jobname = 'sync-match-details-when-active';
