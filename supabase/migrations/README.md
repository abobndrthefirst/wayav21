# Waya Supabase Migrations

These migrations encode Waya's production schema, row-level security, and
scheduled jobs. They are **idempotent** — every `CREATE` / `ALTER` uses
`IF NOT EXISTS`, so running them twice is safe.

## How to apply

### First time (linking the repo to your Supabase project)

```bash
npx supabase@latest login
npx supabase@latest link --project-ref unnheqshkxpbflozechm
```

### Every time you add a migration

```bash
npx supabase@latest db push
```

The CLI reads files in `supabase/migrations/` in filename-sorted order and
applies anything that isn't recorded in `supabase_migrations.schema_migrations`.

### Manual (via SQL editor)

If you don't want to set up the CLI yet, paste each file (in order) into the
Supabase SQL Editor and run it.

## File order

| # | File | What it does |
|---|------|--------------|
| 1 | `20260415_0001_schema_baseline.sql` | Creates `shops`, `loyalty_programs`, `customer_passes`, `activity_log`, `apple_device_registrations`. |
| 2 | `20260415_0002_rls_policies.sql` | Enables + forces RLS and writes per-table policies scoped to `auth.uid()`. |
| 3 | `20260415_0003_idempotency_and_hashing.sql` | Adds `activity_log.client_request_id` UNIQUE + APNs status columns. |
| 4 | `20260415_0004_shop_monthly_stats.sql` | Replaces the old `get_monthly_growth` function with a materialized view + hourly refresh. |
| 5 | `20260415_0005_schedule_apple_cleanup.sql` | Schedules nightly cleanup of dead Apple device registrations via pg_cron + pg_net. Requires GUC secrets (see file header). |
| 6 | `20260415_0006_events_table.sql` | Unified `events` table for business + tech + security events (card_issued, card_failed, apns_push_failed, rate_limited, etc.) with RLS, severity-tiered retention, and nightly prune cron. |

## Required project secrets / env

Run in your terminal after `supabase link`:

```bash
# Edge function secrets
supabase secrets set WAYA_HASH_PEPPER=<long random hex string>
supabase secrets set WAYA_ENROLLMENT_SECRET=<long random hex string>
supabase secrets set WAYA_CRON_SECRET=<long random hex string>
supabase secrets set UPSTASH_REDIS_REST_URL=https://xxxx.upstash.io
supabase secrets set UPSTASH_REDIS_REST_TOKEN=<upstash token>
supabase secrets set SENTRY_DSN=<deno sentry dsn>
supabase secrets set ALLOWED_ORIGINS=   # optional, comma-separated extras

# Postgres-side GUCs needed by migration 0005
# (run inside the SQL editor as a superuser)
alter database postgres set "app.waya_cron_secret" = '<same WAYA_CRON_SECRET>';
alter database postgres set "app.waya_cron_endpoint" =
  'https://<project>.supabase.co/functions/v1/apple-device-cleanup';
```

## Vercel env vars (Project → Settings → Environment Variables)

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_SENTRY_DSN
VITE_SENTRY_ENVIRONMENT=production
```
