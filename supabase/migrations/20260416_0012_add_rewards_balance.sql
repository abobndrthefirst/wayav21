-- Add rewards_balance to customer_passes for reward accumulation loop.
-- When stamps >= stamps_required or points >= reward_threshold,
-- rewards_balance increments and stamps/points reset to the remainder.
begin;

alter table public.customer_passes
  add column if not exists rewards_balance int not null default 0;

comment on column public.customer_passes.rewards_balance is
  'Number of unredeemed rewards earned. Increments each time threshold is crossed.';

commit;
