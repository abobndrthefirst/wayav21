-- Idempotency support for points-update + backfill hashing placeholder.
--
-- 1. Adds UNIQUE(shop_id, client_request_id) to activity_log so a second
--    call with the same idempotency key fails at the DB level, which the
--    edge function catches and short-circuits.
-- 2. Leaves apple_auth_token rows in-place. The apple-wallet-public
--    function now WRITES hashed values. Plaintext rows from before the
--    rollout will be silently rotated on the next pass re-issue. If you
--    want to force rotation, TRUNCATE apple_auth_token and bump program
--    versions to invalidate outstanding passes.

begin;

-- ── activity_log idempotency ──────────────────────────────────────────
alter table public.activity_log
  add column if not exists client_request_id text;

-- Partial unique index — nulls allowed, but any actual value must be unique
-- per shop. Keeps older rows (which have no client_request_id) happy.
create unique index if not exists activity_log_idempotency_uq
  on public.activity_log(shop_id, client_request_id)
  where client_request_id is not null;

-- ── apple_device_registrations — dead-device tracking ─────────────────
alter table public.apple_device_registrations
  add column if not exists last_apns_status int;
alter table public.apple_device_registrations
  add column if not exists last_apns_at timestamptz;

create index if not exists apple_dev_reg_status_idx
  on public.apple_device_registrations(last_apns_status, last_apns_at);

commit;
