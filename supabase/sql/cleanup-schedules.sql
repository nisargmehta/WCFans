create extension if not exists pg_cron with schema extensions;

do $$
declare
  job record;
begin
  for job in
    select jobid
    from cron.job
    where jobname in (
      'sync-rss-news-every-3-hours',
      'sync-fixtures-daily',
      'sync-match-details-every-minute',
      'sync-fixture-previews-every-6-hours',
      'sync-standings-daily'
    )
    or command like '%/functions/v1/sync-rss-news%'
    or command like '%/functions/v1/sync-fixtures%'
    or command like '%/functions/v1/sync-match-details%'
    or command like '%/functions/v1/sync-fixture-previews%'
    or command like '%/functions/v1/sync-standings%'
  loop
    perform cron.unschedule(job.jobid);
  end loop;
end $$;

select jobid, jobname, schedule, command
from cron.job
order by jobid;
