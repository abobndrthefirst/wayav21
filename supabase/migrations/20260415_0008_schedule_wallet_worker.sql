-- ─────────────────────────────────────────────────────────────────────────────
-- 0008 · Schedule the wallet-jobs worker
--
-- Invokes the `process-wallet-jobs` edge function every 30 seconds via
-- pg_cron + pg_net. Worker claims up to 25 jobs per tick and dispatches
-- APNs / Google Wallet pushes.
--
-- Requires (set via Supabase SQL editor as superuser, once):
--   alter database postgres set "app.waya_cron_secret" = '<WAYA_CRON_SECRET>';
--   alter database postgres set "app.waya_worker_endpoint" =
--     'https://<project>.supabase.co/functions/v1/process-wallet-jobs';
--
-- pg_cron can't run at sub-minute cadence with traditional '* * * * *'
-- cron syntax, so we use the interval form ('30 seconds') which pg_cron
-- supports as of v1.5.
-- ─────────────────────────────────────────────────────────────────────────────

do $outer$
declare
  secret text := current_setting('app.waya_cron_secret', true);
  endpoint text := current_setting('app.waya_worker_endpoint', true);
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron')
     and exists (select 1 from pg_extension where extname = 'pg_net')
     and secret is not null
     and endpoint is not null
  then
    perform cron.unschedule('wallet-jobs-worker') where exists (
      select 1 from cron.job where jobname = 'wallet-jobs-worker'
    );

    -- pg_cron supports '30 seconds' format for sub-minute schedules.
    perform cron.schedule(
      'wallet-jobs-worker',
      '30 seconds',
      format(
        $body$select net.http_post(
          url := %L,
          headers := jsonb_build_object(
            'Authorization', %L,
            'Content-Type', 'application/json'
          ),
          body := '{}'::jsonb,
          timeout_milliseconds := 25000
        );$body$,
        endpoint,
        'Bearer ' || secret
      )
    );
  end if;
end $outer$;
