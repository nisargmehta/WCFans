-- Replaces the blind every-minute sync-match-details HTTP call with a guarded
-- schedule that only invokes the Edge Function around active fixture windows.
-- It preserves the existing cron command so the stored Authorization header is reused.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

do $$
declare
  existing_command text;
  guarded_command text;
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

  if existing_command ilike '%football_data_match_id is not null%'
    and existing_command ilike '%kickoff_at between now()%'
  then
    guarded_command := existing_command;
  else
    guarded_command := regexp_replace(existing_command, ';\s*$', '') || $guard$
  where exists (
    select 1
    from public.fixtures
    where football_data_match_id is not null
      and coalesce(status, '') not in ('FINISHED', 'AWARDED', 'CANCELLED', 'CANCELED', 'POSTPONED', 'SUSPENDED')
      and kickoff_at between now() - interval '180 minutes' and now() + interval '60 minutes'
  );
$guard$;
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
