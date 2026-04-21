-- Add rewards_balance to customer_passes for reward accumulation loop.
-- When stamps >= stamps_required or points >= reward_threshold,
-- rewards_balance increments and stamps/points reset to the remainder.
-- redeem_reward decrements it.
begin;

alter table public.customer_passes
  add column if not exists rewards_balance int not null default 0;

comment on column public.customer_passes.rewards_balance is
  'Number of unredeemed rewards earned. Increments each time threshold is crossed, decrements on redeem_reward action.';

-- Backfill from the legacy `rewards` column. At the time of this migration
-- no redemption path has ever successfully decremented anything (the column
-- didn't exist), so rewards_balance starts equal to rewards for every row
-- that has earned anything. Idempotent — only runs on fresh rows.
update public.customer_passes
set rewards_balance = rewards
where rewards > 0 and rewards_balance = 0;

commit;
