-- Run this after deploying the Edge Functions and replacing YOUR_FUNCTION_BEARER_TOKEN.
-- Use a token authorized to invoke Edge Functions. Keep it in a secured SQL editor session, not in git.

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
      'sync-fixture-previews-every-6-hours',
      'sync-standings-daily'
    )
    or command like '%/functions/v1/sync-rss-news%'
    or command like '%/functions/v1/sync-fixtures%'
    or command like '%/functions/v1/sync-fixture-previews%'
    or command like '%/functions/v1/sync-standings%'
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
      'Authorization', 'Bearer YOUR_FUNCTION_BEARER_TOKEN',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

select cron.schedule(
  'sync-fixture-previews-every-6-hours',
  '0 */6 * * *',
  $$
  select net.http_post(
    url := 'https://qhkglztddsowhgjqskqz.supabase.co/functions/v1/sync-fixture-previews',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_FUNCTION_BEARER_TOKEN',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

select cron.schedule(
  'sync-standings-daily',
  '20 8 * * *',
  $$
  select net.http_post(
    url := 'https://qhkglztddsowhgjqskqz.supabase.co/functions/v1/sync-standings',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_FUNCTION_BEARER_TOKEN',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
