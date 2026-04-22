-- Fix shop_stats so the home dashboard shows real numbers.
--
-- The previous version of the function counted activity_log rows where
-- action IN ('scan', 'reward'), but the current points-update edge function
-- writes action='add_stamp' for increments and action='redeem_reward' for
-- redemptions. The stats were consistently 0. It also summed the legacy
-- `rewards` column on customer_passes, which the edge function no longer
-- writes — `rewards_balance` is the source of truth.
--
-- New definitions:
--   scans            = count of add_stamp events
--   rewards_redeemed = count of redeem_reward events
--   rewards_sent     = total rewards ever earned = sum(rewards_balance) +
--                      rewards_redeemed  (unredeemed + historical redemptions)
--   repeat_rate_pct  = share of customers with more than one add_stamp event

create or replace function public.shop_stats(_shop_id uuid)
returns jsonb
language sql
security definer
stable
as $$
  with
    passes as (
      select cp.id, cp.customer_phone, cp.rewards_balance
      from public.customer_passes cp
      where cp.shop_id = _shop_id
    ),
    scans as (
      select customer_name, count(*) as c
      from public.activity_log
      where shop_id = _shop_id and action = 'add_stamp'
      group by customer_name
    ),
    redeemed as (
      select count(*) as n
      from public.activity_log
      where shop_id = _shop_id and action = 'redeem_reward'
    ),
    points as (
      select coalesce(sum(points), 0) as p
      from public.activity_log
      where shop_id = _shop_id and points > 0
    )
  select jsonb_build_object(
    'customers',        (select count(*) from passes),
    'scans',            (select coalesce(sum(c), 0) from scans),
    'rewards_redeemed', (select n from redeemed),
    'total_points',     (select p from points),
    'rewards_sent',     (select coalesce(sum(rewards_balance), 0) from passes) + (select n from redeemed),
    'repeat_rate_pct',
      case when (select count(*) from scans) = 0 then 0
      else (
        (select count(*) from scans where c > 1)::numeric
        / (select count(*) from scans)::numeric * 100
      )::int
      end
  );
$$;
