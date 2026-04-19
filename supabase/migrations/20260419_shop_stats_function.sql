-- Single-call stats aggregator for a shop. Powers the dashboard home +
-- data tabs once a shop is production-ready (account_status = 'active').
-- Trial shops still see demo numbers on the client — this function is
-- only called for activated shops.
--
-- Returns a JSON object:
--   {
--     customers:        int,   -- distinct customer_passes
--     scans:            int,   -- activity_log rows where action='scan'
--     rewards_redeemed: int,   -- activity_log rows where action='reward'
--     total_points:     int,   -- sum of positive points in activity_log
--     rewards_sent:     int,   -- rewards_balance sum across passes (approx)
--     repeat_rate_pct:  int    -- share of customers with >1 scan
--   }

create or replace function public.shop_stats(_shop_id uuid)
returns jsonb
language sql
security definer
stable
as $$
  with
    passes as (
      select cp.id, cp.customer_phone, cp.rewards
      from public.customer_passes cp
      where cp.shop_id = _shop_id
    ),
    scans as (
      select customer_name, count(*) as c
      from public.activity_log
      where shop_id = _shop_id and action = 'scan'
      group by customer_name
    ),
    rewards as (
      select count(*) as n
      from public.activity_log
      where shop_id = _shop_id and action = 'reward'
    ),
    points as (
      select coalesce(sum(points), 0) as p
      from public.activity_log
      where shop_id = _shop_id and points > 0
    )
  select jsonb_build_object(
    'customers',        (select count(*) from passes),
    'scans',            (select coalesce(sum(c), 0) from scans),
    'rewards_redeemed', (select n from rewards),
    'total_points',     (select p from points),
    'rewards_sent',     (select coalesce(sum(rewards), 0) from passes),
    'repeat_rate_pct',
      case when (select count(*) from scans) = 0 then 0
      else (
        (select count(*) from scans where c > 1)::numeric
        / (select count(*) from scans)::numeric * 100
      )::int
      end
  );
$$;

grant execute on function public.shop_stats(uuid) to authenticated, service_role;
