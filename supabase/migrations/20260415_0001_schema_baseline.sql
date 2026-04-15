-- Baseline schema migration for Waya.
--
-- Supabase migrations must be idempotent (this file may run against an
-- already-live DB). We use CREATE IF NOT EXISTS / ALTER ... ADD COLUMN IF
-- NOT EXISTS throughout so re-running is safe.
--
-- Table set:
--   shops                        — one row per merchant (1:1 with auth.users)
--   loyalty_programs             — one or more programs per shop
--   customer_passes              — one row per (program, customer_phone)
--   activity_log                 — audit trail of stamps/points/adds
--   apple_device_registrations   — Apple PassKit push-token registry

begin;

create extension if not exists "pgcrypto";   -- gen_random_uuid
create extension if not exists "pg_cron";    -- scheduled jobs
create extension if not exists "pg_net";     -- http_post for cron → edge fn

-- ── shops ─────────────────────────────────────────────────────────────
create table if not exists public.shops (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  name           text not null,
  logo_url       text,
  card_color     text default '#10B981',
  reward_threshold int default 10,
  reward_description text,
  locations      jsonb default '[]'::jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (user_id)
);

create index if not exists shops_user_id_idx on public.shops(user_id);

-- ── loyalty_programs ──────────────────────────────────────────────────
create table if not exists public.loyalty_programs (
  id                uuid primary key default gen_random_uuid(),
  shop_id           uuid not null references public.shops(id) on delete cascade,
  name              text not null,
  loyalty_type      text not null default 'points'
                    check (loyalty_type in ('points','stamp','tiered','coupon')),
  reward_threshold  int default 10,
  stamps_required   int default 10,
  reward_title      text,
  reward_description text,
  card_color        text default '#10B981',
  text_color        text default '#FFFFFF',
  logo_url          text,
  background_url    text,
  terms             text,
  expires_at        timestamptz,
  tiers             jsonb,
  coupon_code       text,
  coupon_discount   text,
  google_maps_url   text,
  website_url       text,
  phone             text,
  address           text,
  is_published      boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists loyalty_programs_shop_id_idx on public.loyalty_programs(shop_id);

-- ── customer_passes ───────────────────────────────────────────────────
create table if not exists public.customer_passes (
  id                 uuid primary key default gen_random_uuid(),
  program_id         uuid references public.loyalty_programs(id) on delete cascade,
  shop_id            uuid references public.shops(id) on delete cascade,
  customer_name      text,
  customer_phone     text,
  points             int not null default 0,
  stamps             int not null default 0,
  tier               text,
  google_object_id   text,
  apple_serial       text unique,
  apple_auth_token   text,   -- HASHED after migration 0003; was plaintext before.
  last_visit_at      timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (program_id, customer_phone)
);

create index if not exists customer_passes_program_phone_idx
  on public.customer_passes(program_id, customer_phone);
create index if not exists customer_passes_shop_idx
  on public.customer_passes(shop_id);
create index if not exists customer_passes_apple_serial_idx
  on public.customer_passes(apple_serial);

-- ── activity_log ──────────────────────────────────────────────────────
create table if not exists public.activity_log (
  id                 uuid primary key default gen_random_uuid(),
  shop_id            uuid not null references public.shops(id) on delete cascade,
  customer_name      text,
  action             text not null,
  points             int default 0,
  client_request_id  text,
  created_at         timestamptz not null default now()
);

-- ── apple_device_registrations ────────────────────────────────────────
create table if not exists public.apple_device_registrations (
  id                        uuid primary key default gen_random_uuid(),
  device_library_identifier text not null,
  pass_type_identifier      text not null,
  serial_number             text not null,
  push_token                text not null,
  last_apns_status          int,
  last_apns_at              timestamptz,
  created_at                timestamptz not null default now(),
  unique (device_library_identifier, pass_type_identifier, serial_number)
);

create index if not exists apple_dev_reg_serial_idx
  on public.apple_device_registrations(serial_number);
create index if not exists apple_dev_reg_cleanup_idx
  on public.apple_device_registrations(last_apns_status, last_apns_at);

commit;
