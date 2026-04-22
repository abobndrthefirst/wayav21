-- Backfill rewards_balance from the legacy `rewards` column.
--
-- The previously-deployed points-update edge function wrote accumulated
-- rewards into the legacy `rewards` column, while the redeem path and
-- the Scan & Redeem UI read from `rewards_balance`. The result was
-- customers who earned rewards could never spend them — the button
-- stayed disabled because rewards_balance was still 0.
--
-- After deploying the corrected edge function (which writes
-- rewards_balance consistently), this one-time backfill copies any
-- earned-but-unreflected reward counts over so existing customers
-- don't lose rewards they already earned.

update public.customer_passes
set rewards_balance = rewards
where rewards > 0 and rewards_balance < rewards;
