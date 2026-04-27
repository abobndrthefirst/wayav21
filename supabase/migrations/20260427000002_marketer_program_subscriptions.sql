-- Marketer affiliate program — table 2/4: merchant_subscriptions.
--
-- A merchant_subscription is a public lead-capture record submitted via
-- the /subscribe page. Anyone can submit (the form is anonymous), so
-- there are no client-side RLS policies — all writes go through the
-- submit-merchant-subscription edge function (service_role) which
-- validates input and resolves any referral_code into a marketer_id.
--
-- Status flow (all transitions handled in Supabase Studio for MVP):
--   pending  → admin reviews the lead
--   active   → admin confirms the merchant signed up + activated
--             (this transition fires the commission auto-create trigger
--              defined in migration 03)
--   rejected → not a fit; no commission paid
--   cancelled → withdrew before activation; no commission paid
--
-- Indexes are tuned for: marketer dashboard joins, admin filtering by
-- status, dedupe lookups by phone/email.

begin;

do $$ begin
  create type merchant_subscription_status as enum (
    'pending', 'active', 'rejected', 'cancelled'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.merchant_subscriptions (
  id                uuid primary key default gen_random_uuid(),
  business_name     text not null,
  contact_name      text not null,
  phone             text not null,
  email             text not null,
  city              text not null,
  business_category text not null,
  referral_code     char(4) check (referral_code is null or referral_code ~ '^[A-Z]{4}$'),
  marketer_id       uuid references public.marketers(id) on delete set null,
  status            merchant_subscription_status not null default 'pending',
  admin_notes       text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists merchant_subs_marketer_idx
  on public.merchant_subscriptions(marketer_id) where marketer_id is not null;
create index if not exists merchant_subs_status_idx
  on public.merchant_subscriptions(status);
create index if not exists merchant_subs_email_idx
  on public.merchant_subscriptions(email);
create index if not exists merchant_subs_phone_idx
  on public.merchant_subscriptions(phone);

alter table public.merchant_subscriptions enable row level security;

-- No client policies: writes via submit-merchant-subscription (service_role),
-- reads happen via marketer_referrals_summary() RPC (defined in migration 04)
-- and admin Supabase Studio access.

commit;
