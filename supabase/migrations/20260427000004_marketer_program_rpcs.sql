-- Marketer affiliate program — table 4/4: RPCs (no new tables).
--
-- lookup_marketer_by_code(p_code) — anonymous endpoint that lets the
-- public /subscribe form validate a referral code without exposing the
-- marketers table. Returns the marketer's id (or NULL). Granted to anon
-- AND authenticated so both server-side (edge fn with anon key) and
-- client-side calls work.
--
-- marketer_referrals_summary() — joined view of the calling marketer's
-- subscriptions + commissions. Used to render the dashboard table and
-- compute the stats cards client-side. SECURITY DEFINER so it can read
-- merchant_subscriptions (which has no client RLS policy) but the WHERE
-- clause restricts results to rows owned by the calling auth.uid().

begin;

create or replace function public.lookup_marketer_by_code(p_code text)
returns uuid
language sql
security definer
set search_path = public
as $$
  select id from public.marketers where referral_code = upper(p_code) limit 1;
$$;

revoke all on function public.lookup_marketer_by_code(text) from public;
grant execute on function public.lookup_marketer_by_code(text) to anon, authenticated;

create or replace function public.marketer_referrals_summary()
returns table (
  subscription_id     uuid,
  business_name       text,
  phone               text,
  signup_date         timestamptz,
  subscription_status merchant_subscription_status,
  commission_amount   numeric,
  commission_status   marketer_commission_status,
  paid_at             timestamptz
)
language sql
security definer
set search_path = public
as $$
  select ms.id,
         ms.business_name,
         ms.phone,
         ms.created_at,
         ms.status,
         c.amount_sar,
         c.status,
         c.paid_at
  from public.marketers m
  join public.merchant_subscriptions ms on ms.marketer_id = m.id
  left join public.commissions c on c.merchant_subscription_id = ms.id
  where m.user_id = auth.uid()
  order by ms.created_at desc;
$$;

revoke all on function public.marketer_referrals_summary() from public;
grant execute on function public.marketer_referrals_summary() to authenticated;

commit;
