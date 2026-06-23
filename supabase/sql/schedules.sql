-- Run this after deploying the Edge Functions and replacing YOUR_SUPABASE_FUNCTION_JWT.
-- Use the project's anon JWT or service-role JWT so pg_cron can invoke Edge Functions.
-- Keep that token in a secured SQL editor session, not in git.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

do $$
declare
  job record;
begin
  for job in
    select jobid
    from cron.job
    where jobname in (
      'sync-rss-news-every-3-hours',
      'sync-match-details-every-minute',
      'sync-match-details-when-active',
      'sync-fixture-previews-every-6-hours',
      'sync-standings-daily',
      'sync-standings-every-10-minutes',
      'cleanup-news-articles-daily'
    )
    or command like '%/functions/v1/sync-rss-news%'
    or command like '%/functions/v1/sync-match-details%'
    or command like '%/functions/v1/sync-fixtures%'
    or command like '%/functions/v1/sync-fixture-previews%'
    or command like '%/functions/v1/sync-standings%'
    or command like '%delete from public.news_articles%'
  loop
    perform cron.unschedule(job.jobid);
  end loop;
end $$;

select cron.schedule(
  'sync-rss-news-every-3-hours',
  '0 */3 * * *',
  $$
  select net.http_post(
    url := 'https://qhkglztddsowhgjqskqz.supabase.co/functions/v1/sync-rss-news',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SUPABASE_FUNCTION_JWT',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

select cron.schedule(
  'sync-match-details-when-active',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://qhkglztddsowhgjqskqz.supabase.co/functions/v1/sync-match-details',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SUPABASE_FUNCTION_JWT',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  )
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
  $$
);

select cron.schedule(
  'cleanup-news-articles-daily',
  '30 8 * * *',
  $$
  delete from public.news_articles
  where coalesce(published_at, created_at) < now() - interval '1 day';
  $$
);

select cron.schedule(
  'sync-standings-every-10-minutes',
  '*/10 * * * *',
  $$
  select net.http_post(
    url := 'https://qhkglztddsowhgjqskqz.supabase.co/functions/v1/sync-standings',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SUPABASE_FUNCTION_JWT',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

select jobid, jobname, schedule
from cron.job
where jobname in (
  'sync-rss-news-every-3-hours',
  'sync-match-details-when-active',
  'sync-standings-every-10-minutes',
  'cleanup-news-articles-daily'
)
order by jobname;

-- Use this to confirm the RSS job is actually firing and whether authorization failed.
select jobid, runid, job_pid, database, username, command, status, return_message, start_time, end_time
from cron.job_run_details
where command like '%/functions/v1/sync-rss-news%'
order by start_time desc
limit 10;
