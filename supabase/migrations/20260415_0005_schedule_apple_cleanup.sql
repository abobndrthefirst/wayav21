-- Schedules the nightly apple-device-cleanup edge function via pg_cron + pg_net.
-- The cleanup function itself is at supabase/functions/apple-device-cleanup.
--
-- Before applying this migration, set two project secrets:
--   supabase secrets set WAYA_CRON_SECRET=<long random string>
--   supabase secrets set WAYA_CRON_ENDPOINT=<https://xxxx.supabase.co/functions/v1/apple-device-cleanup>
--
-- And in SQL editor (one-time, because pg_cron extension jobs live in the
-- Postgres role, not the edge runtime), run:
--   alter database postgres set "app.waya_cron_secret" = '<same secret>';
--   alter database postgres set "app.waya_cron_endpoint" = '<same url>';

begin;

select cron.schedule(
  'nightly-apple-device-cleanup',
  '30 3 * * *',  -- 03:30 UTC ~= 06:30 Riyadh
  $$
  select net.http_post(
    url := current_setting('app.waya_cron_endpoint', true),
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.waya_cron_secret', true),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

commit;
