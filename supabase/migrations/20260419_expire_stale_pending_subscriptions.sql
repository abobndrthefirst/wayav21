-- Auto-expire pending subscriptions that never completed checkout within
-- 10 minutes. Runs every minute via pg_cron so dead sessions don't linger
-- and block the shop from starting a fresh checkout. Also invoked lazily
-- from streampay-get-status so a user who returns sees the fresh state
-- immediately.

create or replace function public.expire_stale_pending_subscriptions()
returns int
language sql
security definer
as $$
  with updated as (
    update public.subscriptions
    set status = 'expired', updated_at = now()
    where status = 'pending'
      and created_at < now() - interval '10 minutes'
    returning id
  )
  select count(*)::int from updated;
$$;

-- Schedule: every minute. pg_cron's minimum resolution is 1 min, which
-- is plenty for a 10-min expiry window.
select cron.schedule(
  'expire-stale-pending-subscriptions',
  '* * * * *',
  $$ select public.expire_stale_pending_subscriptions(); $$
);
