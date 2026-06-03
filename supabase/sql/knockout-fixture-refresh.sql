-- Optional: run this near the end of the group stage if you want automated
-- fixture refreshes while knockout teams are being resolved.
-- It registers one daily job, but the HTTP call is guarded until June 27, 2026.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

do $$
declare
  job record;
begin
  for job in
    select jobid
    from cron.job
    where jobname = 'sync-fixtures-knockout-refresh'
    or command like '%/functions/v1/sync-fixtures%'
  loop
    perform cron.unschedule(job.jobid);
  end loop;
end $$;

select cron.schedule(
  'sync-fixtures-knockout-refresh',
  '10 8 * * *',
  $$
  select net.http_post(
    url := 'https://qhkglztddsowhgjqskqz.supabase.co/functions/v1/sync-fixtures',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_FUNCTION_BEARER_TOKEN',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  )
  where now() >= timestamptz '2026-06-27 00:00:00+00';
  $$
);
