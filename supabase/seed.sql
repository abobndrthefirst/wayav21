-- Seed data for the staging Supabase branch.
--
-- This file runs automatically on `supabase db reset` and on fresh branch
-- creation (when Supabase Branching is enabled). It is NEVER applied to the
-- production project — seed.sql runs only against non-prod branches.
--
-- Creates:
--   1. A demo auth user (demo-merchant@trywaya.test / staging-demo-password)
--   2. A shop owned by that user
--   3. Two loyalty programs (points + stamp)
--   4. Five customer passes at varied balances
--   5. A few activity_log rows so /admin/events is non-empty on first visit
--
-- Credentials are intentionally visible and weak. This DB contains no real
-- customer data; this is a throwaway env. Do not reuse this pattern on prod.

begin;

-- ── 1. demo merchant auth user ─────────────────────────────────────────
-- Fixed UUID so the shop row below can reference it without a subquery.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, recovery_sent_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated', 'authenticated',
  'demo-merchant@trywaya.test',
  crypt('staging-demo-password', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"staging_seed":true}',
  now(), now(),
  '', '', '', ''
) on conflict (id) do nothing;

-- ── 2. demo shop ──────────────────────────────────────────────────────
insert into public.shops (id, user_id, name, card_color, reward_threshold, reward_description)
values (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Demo Café (Staging)',
  '#10B981',
  10,
  'Free drink on the 10th stamp'
) on conflict (id) do nothing;

-- ── 3. two loyalty programs ───────────────────────────────────────────
insert into public.loyalty_programs
  (id, shop_id, name, loyalty_type, reward_threshold, stamps_required, reward_title, card_color, is_published)
values
  ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222222',
   'Coffee Stamps', 'stamp', 10, 10, 'Free drink', '#8B5CF6', true),
  ('33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222222',
   'Points Rewards', 'points', 100, 10, '100pts = SAR 10 off', '#F59E0B', true)
on conflict (id) do nothing;

-- ── 4. five demo customer passes with varied progress ─────────────────
insert into public.customer_passes
  (program_id, shop_id, customer_name, customer_phone, points, stamps, last_visit_at)
values
  ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222222',
   'Sara A.',     '+966500000101', 0,  2, now() - interval '2 days'),
  ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222222',
   'Omar T.',     '+966500000102', 0,  9, now() - interval '1 hour'),
  ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222222',
   'Layla H.',    '+966500000103', 0, 10, now() - interval '3 days'),
  ('33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222222',
   'Khalid M.',   '+966500000104', 45, 0, now() - interval '5 hours'),
  ('33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222222',
   'Noor S.',     '+966500000105', 130, 0, now() - interval '12 hours')
on conflict (program_id, customer_phone) do nothing;

-- ── 5. a few activity_log rows so /admin/events isn't empty on first load
insert into public.activity_log (shop_id, customer_name, action, points)
values
  ('22222222-2222-2222-2222-222222222222', 'Sara A.',   'stamp', 1),
  ('22222222-2222-2222-2222-222222222222', 'Omar T.',   'stamp', 1),
  ('22222222-2222-2222-2222-222222222222', 'Layla H.',  'reward_redeemed', 0),
  ('22222222-2222-2222-2222-222222222222', 'Khalid M.', 'points_added', 15),
  ('22222222-2222-2222-2222-222222222222', 'Noor S.',   'points_added', 30);

commit;
