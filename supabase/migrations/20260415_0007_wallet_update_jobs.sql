-- ─────────────────────────────────────────────────────────────────────────────
-- 0007 · wallet_update_jobs — async push pipeline
--
-- Problem: `points-update` currently does APNs + Google Wallet pushes INLINE
-- on the merchant's request. That means:
--   · merchant waits 200–2000ms for every stamp (slow UX)
--   · any APNs hiccup / Google Wallet 5xx surfaces as a merchant error
--   · a shop with 50 registered devices = 50 sequential outbound requests
--
-- Fix: points-update now WRITES to this jobs table and returns immediately.
-- A worker edge function (`process-wallet-jobs`), run on a cron, claims
-- pending jobs and performs the pushes. Failed jobs are retried with
-- exponential backoff up to `max_attempts`.
--
-- Concurrency: workers claim rows with SELECT ... FOR UPDATE SKIP LOCKED so
-- multiple worker invocations never step on each other.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.wallet_update_jobs (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),

  -- What kind of push. We create one row per delivery target so partial
  -- failures (Apple OK, Google 5xx) are retried independently.
  kind              text not null check (kind in ('apple_apns','google_wallet')),

  -- What pass this job is for
  customer_pass_id  uuid references public.customer_passes(id) on delete cascade,
  shop_id           uuid references public.shops(id) on delete cascade,

  -- Target-specific payload. For apple_apns we store the push_token; for
  -- google_wallet the object_id. These are snapshotted here so the worker
  -- doesn't need to re-query (registrations can change between enqueue & run).
  payload           jsonb not null default '{}'::jsonb,

  -- Scheduling
  run_after         timestamptz not null default now(),
  status            text not null default 'pending'
                      check (status in ('pending','processing','done','failed','dead')),
  attempts          int  not null default 0,
  max_attempts      int  not null default 5,

  -- Diagnostics
  last_error        text,
  last_error_code   text,
  started_at        timestamptz,
  finished_at       timestamptz,

  -- Idempotency — optional dedupe key tied to the originating mutation
  idempotency_key   text
);

-- Worker needs to find pending jobs whose run_after is due.
create index if not exists wallet_update_jobs_due_idx
  on public.wallet_update_jobs (run_after)
  where status = 'pending';

-- Ops lookup by pass
create index if not exists wallet_update_jobs_pass_idx
  on public.wallet_update_jobs (customer_pass_id, created_at desc);

-- Dedupe (don't enqueue two identical apple pushes for the same mutation)
create unique index if not exists wallet_update_jobs_idemp_uq
  on public.wallet_update_jobs (kind, customer_pass_id, idempotency_key)
  where idempotency_key is not null and status in ('pending','processing');

-- ─── RLS ─────────────────────────────────────────────────────────────────────
-- Writers are service_role only (bypasses RLS). We only expose a read policy
-- for admins/merchants who own the shop — this is a nice-to-have for debugging.
alter table public.wallet_update_jobs enable row level security;
alter table public.wallet_update_jobs force  row level security;

drop policy if exists wallet_update_jobs_select_own on public.wallet_update_jobs;
create policy wallet_update_jobs_select_own
  on public.wallet_update_jobs for select
  using (
    shop_id in (select id from public.shops where user_id = auth.uid())
  );

-- ─── Claim function ──────────────────────────────────────────────────────────
-- Atomically claims up to `batch_size` pending jobs whose run_after is due.
-- Uses FOR UPDATE SKIP LOCKED so concurrent worker invocations never collide.
-- Returns the claimed rows; caller then does the actual push work.
create or replace function public.claim_wallet_update_jobs(batch_size int default 25)
returns setof public.wallet_update_jobs
language plpgsql
security definer
set search_path = public
as $fn$
begin
  return query
  with claimed as (
    select id
      from public.wallet_update_jobs
     where status = 'pending'
       and run_after <= now()
     order by run_after asc
     limit batch_size
     for update skip locked
  )
  update public.wallet_update_jobs w
     set status      = 'processing',
         started_at  = now(),
         attempts    = w.attempts + 1
    from claimed
   where w.id = claimed.id
   returning w.*;
end
$fn$;

revoke all on function public.claim_wallet_update_jobs(int) from public, anon, authenticated;
grant execute on function public.claim_wallet_update_jobs(int) to service_role;

-- ─── Retention ───────────────────────────────────────────────────────────────
-- Keep successful jobs 7 days, failed/dead jobs 30 days for ops review.
-- Scheduled in migration 0005's pattern — reuse pg_cron + pg_net if available.

do $$ begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    -- Unschedule existing to make the migration idempotent
    perform cron.unschedule('wallet-update-jobs-prune') where exists (
      select 1 from cron.job where jobname = 'wallet-update-jobs-prune'
    );
    perform cron.schedule(
      'wallet-update-jobs-prune',
      '30 3 * * *',
      $prune$
      delete from public.wallet_update_jobs
       where (status = 'done'    and finished_at < now() - interval '7 days')
          or (status in ('failed','dead') and finished_at < now() - interval '30 days');
      $prune$
    );
  end if;
end $$;
