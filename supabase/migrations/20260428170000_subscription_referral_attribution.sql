-- Subscription referral attribution.
--
-- Lets a paying merchant credit a marketer at /billing time. The flow:
--   1. Merchant types a 4-letter referral code in the BillingPage.
--   2. streampay-create-checkout resolves the code → marketer_id and stores
--      it on the new pending row in `subscriptions`.
--   3. When streampay-verify-payment marks the subscription `active`, the
--      trigger below inserts a row in `commissions` (status=pending) so the
--      marketer's dashboard reflects the referral immediately.
--
-- The existing commission flow (via `merchant_subscriptions` lead form,
-- migration 20260427000003) is untouched. `commissions` now supports two
-- mutually-exclusive sources: a lead-form merchant_subscription_id or a
-- paid-billing subscription_id.
--
-- Depends on: marketers, commissions, merchant_subscriptions
--             (migration 20260427000001..03).

begin;

-- ── 1. Subscriptions: add referral_code + marketer_id ──────────────────
alter table public.subscriptions
  add column if not exists referral_code char(4)
    check (referral_code is null or referral_code ~ '^[A-Z]{4}$'),
  add column if not exists marketer_id uuid
    references public.marketers(id) on delete set null;

create index if not exists subscriptions_marketer_idx
  on public.subscriptions(marketer_id) where marketer_id is not null;

-- ── 2. Commissions: support paid-billing source ───────────────────────
alter table public.commissions
  alter column merchant_subscription_id drop not null,
  add column if not exists subscription_id uuid
    references public.subscriptions(id) on delete cascade;

-- Exactly one source must be set.
do $$ begin
  alter table public.commissions
    add constraint commissions_one_source_chk check (
      (merchant_subscription_id is not null and subscription_id is null) or
      (merchant_subscription_id is null     and subscription_id is not null)
    );
exception when duplicate_object then null;
end $$;

create unique index if not exists commissions_subscription_id_uidx
  on public.commissions(subscription_id) where subscription_id is not null;

-- ── 3. Trigger: auto-create commission when paid sub becomes active ───
create or replace function public.create_commission_on_subscription_active()
returns trigger
language plpgsql
as $$
begin
  if new.marketer_id is not null
     and new.status = 'active'
     and (
       tg_op = 'INSERT'
       or old.status is distinct from 'active'
       or old.marketer_id is distinct from new.marketer_id
     )
  then
    insert into public.commissions (marketer_id, subscription_id)
      values (new.marketer_id, new.id)
      on conflict (subscription_id) do nothing;
  end if;
  return new;
end $$;

drop trigger if exists subscriptions_create_commission on public.subscriptions;
create trigger subscriptions_create_commission
  after insert or update of status, marketer_id on public.subscriptions
  for each row execute function public.create_commission_on_subscription_active();

-- ── 4. Marketer dashboard: include paid-billing referrals ─────────────
-- Drops the existing function (return-type widens to text for status
-- columns to UNION the lead-form enum with the subscription text status)
-- and republishes with both sources. JS callers compare statuses as
-- plain strings, so text and the old enum types are interchangeable.
-- A new `source` column distinguishes 'lead' (anonymous /subscribe form)
-- from 'subscription' (paying merchant who entered a code at /billing).

drop function if exists public.marketer_referrals_summary();

create or replace function public.marketer_referrals_summary()
returns table (
  subscription_id     uuid,
  source              text,
  business_name       text,
  phone               text,
  signup_date         timestamptz,
  subscription_status text,
  commission_amount   numeric,
  commission_status   text,
  paid_at             timestamptz
)
language sql
security definer
set search_path = public
as $$
  select ms.id                              as subscription_id,
         'lead'::text                       as source,
         ms.business_name,
         ms.phone,
         ms.created_at                      as signup_date,
         ms.status::text                    as subscription_status,
         c.amount_sar                       as commission_amount,
         c.status::text                     as commission_status,
         c.paid_at
  from public.marketers m
  join public.merchant_subscriptions ms on ms.marketer_id = m.id
  left join public.commissions c on c.merchant_subscription_id = ms.id
  where m.user_id = auth.uid()

  union all

  select s.id                               as subscription_id,
         'subscription'::text               as source,
         coalesce(sh.name, '—')             as business_name,
         coalesce(sh.phone, '')             as phone,
         s.created_at                       as signup_date,
         s.status                           as subscription_status,
         c.amount_sar                       as commission_amount,
         c.status::text                     as commission_status,
         c.paid_at
  from public.marketers m
  join public.subscriptions s on s.marketer_id = m.id
  left join public.shops sh on sh.id = s.shop_id
  left join public.commissions c on c.subscription_id = s.id
  where m.user_id = auth.uid()

  order by 5 desc;
$$;

revoke all on function public.marketer_referrals_summary() from public;
grant execute on function public.marketer_referrals_summary() to authenticated;

commit;
