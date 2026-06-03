-- Run this after deploying the Edge Functions and replacing YOUR_FUNCTION_BEARER_TOKEN.
-- Use a token authorized to invoke Edge Functions. Keep it in a secured SQL editor session, not in git.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.unschedule('sync-rss-news-every-3-hours')
where exists (select 1 from cron.job where jobname = 'sync-rss-news-every-3-hours');

select cron.unschedule('sync-fixture-previews-every-6-hours')
where exists (select 1 from cron.job where jobname = 'sync-fixture-previews-every-6-hours');

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
