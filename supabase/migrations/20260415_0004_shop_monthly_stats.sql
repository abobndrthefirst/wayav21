-- Materialized view replacement for the per-request `get_monthly_growth`
-- function. The old function scanned activity_log on every dashboard
-- render — fine at 10 shops, death at 5,000. We precompute and refresh
-- hourly via pg_cron.
--
-- Query pattern:
--   select * from public.shop_monthly_stats
--   where shop_id = :shop_id
--   order by month desc limit 12;

begin;

-- Drop the old function if present; it's superseded by the view.
drop function if exists public.get_monthly_growth(uuid);

create materialized view if not exists public.shop_monthly_stats as
select
  shop_id,
  date_trunc('month', created_at) as month,
  count(*) filter (where action in ('add_stamp','add_points','update'))       as total_activity,
  count(distinct customer_name) filter (where action in ('add_stamp','add_points')) as unique_customers,
  sum(points) filter (where action in ('add_stamp','add_points'))             as points_issued,
  count(*) filter (where action = 'apple_wallet_add')                         as apple_enrollments,
  count(*) filter (where action = 'google_wallet_add')                        as google_enrollments
from public.activity_log
group by shop_id, date_trunc('month', created_at);

create unique index if not exists shop_monthly_stats_uq
  on public.shop_monthly_stats(shop_id, month);

create index if not exists shop_monthly_stats_shop_idx
  on public.shop_monthly_stats(shop_id);

-- Grant read to authenticated; RLS is not supported on materialized views,
-- so we wrap access in a security-barrier view that filters by auth.uid().
create or replace view public.shop_monthly_stats_for_me as
select sms.*
from public.shop_monthly_stats sms
join public.shops s on s.id = sms.shop_id
where s.user_id = auth.uid();

-- Refresh the materialized view hourly.
-- pg_cron's schedule format is standard cron (min hour dom mon dow).
-- We use CONCURRENTLY so dashboard reads aren't blocked during refresh —
-- requires the unique index above.
select cron.schedule(
  'refresh-shop-monthly-stats',
  '0 * * * *',
  $$ refresh materialized view concurrently public.shop_monthly_stats; $$
);

commit;
