-- StreamPay subscription integration.
-- Adds a phone column to shops, a plan catalog, per-shop subscription state,
-- and an audit trail for StreamPay API interactions.

alter table public.shops
  add column if not exists phone text
    check (phone is null or phone ~ '^\+9665[0-9]{8}$');

create table if not exists public.plans (
  id                   text primary key,
  tier                 smallint not null check (tier in (1, 2, 3)),
  interval             text not null check (interval in ('monthly', 'annual')),
  price_sar            numeric(10, 2) not null,
  streampay_product_id text unique,
  created_at           timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id                        uuid primary key default gen_random_uuid(),
  shop_id                   uuid not null references public.shops(id) on delete cascade,
  user_id                   uuid not null references auth.users(id) on delete cascade,
  plan_id                   text not null references public.plans(id),
  streampay_consumer_id     text not null,
  streampay_payment_link_id text,
  streampay_subscription_id text,
  streampay_invoice_id      text,
  streampay_payment_id      text,
  status                    text not null default 'pending'
    check (status in ('pending', 'active', 'past_due', 'canceled', 'failed', 'expired')),
  current_period_end        timestamptz,
  last_synced_at            timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create unique index if not exists subscriptions_active_per_shop
  on public.subscriptions(shop_id)
  where status in ('pending', 'active', 'past_due');

create index if not exists subscriptions_user_id_idx
  on public.subscriptions(user_id);

create table if not exists public.payment_attempts (
  id              uuid primary key default gen_random_uuid(),
  subscription_id uuid references public.subscriptions(id) on delete cascade,
  kind            text not null
    check (kind in ('create_link', 'verify_payment', 'get_subscription', 'create_consumer', 'sync_product')),
  streampay_id    text,
  status          text,
  amount_sar      numeric(10, 2),
  raw             jsonb,
  created_at      timestamptz not null default now()
);

alter table public.plans             enable row level security;
alter table public.subscriptions     enable row level security;
alter table public.payment_attempts  enable row level security;

drop policy if exists plans_public_read on public.plans;
create policy plans_public_read on public.plans
  for select using (true);

drop policy if exists subs_owner_read on public.subscriptions;
create policy subs_owner_read on public.subscriptions
  for select using (user_id = auth.uid());

drop policy if exists attempts_owner_read on public.payment_attempts;
create policy attempts_owner_read on public.payment_attempts
  for select using (
    exists (
      select 1 from public.subscriptions s
      where s.id = subscription_id and s.user_id = auth.uid()
    )
  );

-- Seed plan catalog. Annual = monthly * 12 * 0.8 (20% discount).
insert into public.plans (id, tier, interval, price_sar) values
  ('tier1_monthly', 1, 'monthly',   80.00),
  ('tier1_annual',  1, 'annual',   768.00),
  ('tier2_monthly', 2, 'monthly',  150.00),
  ('tier2_annual',  2, 'annual',  1440.00),
  ('tier3_monthly', 3, 'monthly',  300.00),
  ('tier3_annual',  3, 'annual',  2880.00)
on conflict (id) do nothing;
