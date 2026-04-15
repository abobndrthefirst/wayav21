-- ─────────────────────────────────────────────────────────────────────────────
-- 0009 · Wallet notifications service
--
-- v1 scope: manual merchant broadcasts only. Birthday, geo, win-back, and
-- redemption-confirm are tracked as "coming soon" in the UI and will land in
-- subsequent migrations that reuse this schema.
--
-- Tables:
--   notification_campaigns — merchant-authored send (title/body/audience)
--   notification_sends     — one row per delivery target (pass) for analytics
--   notification_quotas    — running counters per merchant × period
--
-- Delivery reuses wallet_update_jobs (0007). A new job kind 'wallet_message'
-- fans out to apple + google via the existing queue, so retries + backoff
-- come for free.
--
-- Quota enforcement: send-notification edge fn checks + atomically increments
-- notification_quotas before enqueuing. Admin-panel-editable tier limits live
-- in notification_tier_limits.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Extend wallet_update_jobs.kind to include 'wallet_message' ─────────────
do $$ begin
  alter table public.wallet_update_jobs drop constraint if exists wallet_update_jobs_kind_check;
  alter table public.wallet_update_jobs
    add constraint wallet_update_jobs_kind_check
    check (kind in ('apple_apns','google_wallet','wallet_message'));
exception when others then null;
end $$;

-- ─── Tier limits (admin-editable) ────────────────────────────────────────────
create table if not exists public.notification_tier_limits (
  tier               text primary key check (tier in ('free','starter','gold','enterprise')),
  weekly_broadcasts  int  not null default 0,
  monthly_broadcasts int  not null default 0,
  birthday_enabled   bool not null default false,
  geo_enabled        bool not null default false,
  winback_enabled    bool not null default false,
  updated_at         timestamptz not null default now()
);

insert into public.notification_tier_limits (tier, weekly_broadcasts, monthly_broadcasts, birthday_enabled, geo_enabled, winback_enabled)
values
  ('free',       0, 1,  false, false, false),
  ('starter',    1, 4,  true,  true,  false),
  ('gold',       4, 16, true,  true,  true),
  ('enterprise', 999, 9999, true, true, true)
on conflict (tier) do nothing;

-- ─── Shops: add tier column if missing ──────────────────────────────────────
alter table public.shops
  add column if not exists notification_tier text not null default 'free'
    check (notification_tier in ('free','starter','gold','enterprise'));

-- ─── Campaigns ──────────────────────────────────────────────────────────────
create table if not exists public.notification_campaigns (
  id            uuid primary key default gen_random_uuid(),
  shop_id       uuid not null references public.shops(id) on delete cascade,
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),

  kind          text not null default 'broadcast'
                  check (kind in ('broadcast','birthday','winback','redemption','geo')),

  -- Content
  title         text not null check (length(title) between 1 and 80),
  body          text not null check (length(body) between 1 and 240),
  deep_link     text,

  -- Audience filter (null = all cardholders for this shop)
  audience_tier text,                               -- e.g. filter to gold customers
  audience_tag  text,                               -- freeform segment tag

  -- Lifecycle
  scheduled_at  timestamptz,                        -- null = send now
  status        text not null default 'queued'
                  check (status in ('draft','queued','sending','sent','failed','cancelled')),
  sent_at       timestamptz,
  recipient_count int not null default 0,
  delivered_count int not null default 0,
  failed_count    int not null default 0
);

create index if not exists notif_campaigns_shop_idx
  on public.notification_campaigns (shop_id, created_at desc);

-- ─── Sends (one per recipient) ──────────────────────────────────────────────
create table if not exists public.notification_sends (
  id                uuid primary key default gen_random_uuid(),
  campaign_id       uuid not null references public.notification_campaigns(id) on delete cascade,
  customer_pass_id  uuid not null references public.customer_passes(id) on delete cascade,
  shop_id           uuid not null references public.shops(id) on delete cascade,
  platform          text not null check (platform in ('apple','google')),
  status            text not null default 'pending'
                      check (status in ('pending','delivered','failed','skipped')),
  last_error        text,
  delivered_at      timestamptz,
  created_at        timestamptz not null default now()
);

create index if not exists notif_sends_campaign_idx
  on public.notification_sends (campaign_id);
create index if not exists notif_sends_pass_idx
  on public.notification_sends (customer_pass_id, created_at desc);

-- ─── Quota tracking ─────────────────────────────────────────────────────────
-- Period is 'YYYY-WW' or 'YYYY-MM'. We track both weekly + monthly counters.
create table if not exists public.notification_quotas (
  shop_id    uuid not null references public.shops(id) on delete cascade,
  period_key text not null,                        -- '2026-W16' or '2026-04'
  scope      text not null check (scope in ('weekly','monthly')),
  used_count int  not null default 0,
  updated_at timestamptz not null default now(),
  primary key (shop_id, scope, period_key)
);

create index if not exists notif_quotas_shop_idx
  on public.notification_quotas (shop_id, updated_at desc);

-- ─── Helper: current period keys ────────────────────────────────────────────
create or replace function public.notif_current_period(scope text)
returns text
language sql
immutable
as $$
  select case scope
    when 'weekly'  then to_char(now(), 'IYYY-"W"IW')
    when 'monthly' then to_char(now(), 'YYYY-MM')
  end;
$$;

-- ─── Quota check + increment (atomic, SECURITY DEFINER) ─────────────────────
-- Returns jsonb { allowed: bool, weekly_used, weekly_limit, monthly_used, monthly_limit, reason }.
-- Callers: send-notification edge fn.
create or replace function public.notif_check_and_increment(
  p_shop_id uuid,
  p_amount  int default 1
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_tier    text;
  v_wlim    int;
  v_mlim    int;
  v_wk      text := notif_current_period('weekly');
  v_mo      text := notif_current_period('monthly');
  v_wused   int;
  v_mused   int;
begin
  select notification_tier into v_tier from shops where id = p_shop_id;
  if v_tier is null then
    return jsonb_build_object('allowed', false, 'reason', 'SHOP_NOT_FOUND');
  end if;

  select weekly_broadcasts, monthly_broadcasts
    into v_wlim, v_mlim
  from notification_tier_limits
  where tier = v_tier;

  -- Read current usage
  select coalesce(used_count, 0) into v_wused
  from notification_quotas
  where shop_id = p_shop_id and scope = 'weekly' and period_key = v_wk;
  v_wused := coalesce(v_wused, 0);

  select coalesce(used_count, 0) into v_mused
  from notification_quotas
  where shop_id = p_shop_id and scope = 'monthly' and period_key = v_mo;
  v_mused := coalesce(v_mused, 0);

  if v_wused + p_amount > v_wlim then
    return jsonb_build_object(
      'allowed', false, 'reason', 'WEEKLY_QUOTA_EXCEEDED',
      'weekly_used', v_wused, 'weekly_limit', v_wlim,
      'monthly_used', v_mused, 'monthly_limit', v_mlim,
      'tier', v_tier
    );
  end if;
  if v_mused + p_amount > v_mlim then
    return jsonb_build_object(
      'allowed', false, 'reason', 'MONTHLY_QUOTA_EXCEEDED',
      'weekly_used', v_wused, 'weekly_limit', v_wlim,
      'monthly_used', v_mused, 'monthly_limit', v_mlim,
      'tier', v_tier
    );
  end if;

  -- Atomic upsert of both counters
  insert into notification_quotas (shop_id, scope, period_key, used_count, updated_at)
  values (p_shop_id, 'weekly', v_wk, p_amount, now())
  on conflict (shop_id, scope, period_key)
    do update set used_count = notification_quotas.used_count + p_amount,
                  updated_at = now();

  insert into notification_quotas (shop_id, scope, period_key, used_count, updated_at)
  values (p_shop_id, 'monthly', v_mo, p_amount, now())
  on conflict (shop_id, scope, period_key)
    do update set used_count = notification_quotas.used_count + p_amount,
                  updated_at = now();

  return jsonb_build_object(
    'allowed', true,
    'weekly_used', v_wused + p_amount, 'weekly_limit', v_wlim,
    'monthly_used', v_mused + p_amount, 'monthly_limit', v_mlim,
    'tier', v_tier
  );
end
$fn$;

revoke all on function public.notif_check_and_increment(uuid, int) from public, anon, authenticated;
grant execute on function public.notif_check_and_increment(uuid, int) to service_role;

-- ─── RLS ────────────────────────────────────────────────────────────────────
alter table public.notification_campaigns enable row level security;
alter table public.notification_campaigns force  row level security;
alter table public.notification_sends     enable row level security;
alter table public.notification_sends     force  row level security;
alter table public.notification_quotas    enable row level security;
alter table public.notification_quotas    force  row level security;
alter table public.notification_tier_limits enable row level security;
alter table public.notification_tier_limits force  row level security;

-- Merchant can read + insert campaigns they own (writes also go through the
-- edge fn for quota enforcement; direct inserts are a fallback for drafts).
drop policy if exists nc_select_own on public.notification_campaigns;
create policy nc_select_own on public.notification_campaigns for select
  using (shop_id in (select id from public.shops where user_id = auth.uid()));

drop policy if exists nc_insert_own on public.notification_campaigns;
create policy nc_insert_own on public.notification_campaigns for insert
  with check (shop_id in (select id from public.shops where user_id = auth.uid()));

drop policy if exists nc_update_own on public.notification_campaigns;
create policy nc_update_own on public.notification_campaigns for update
  using (shop_id in (select id from public.shops where user_id = auth.uid()));

-- Merchant can read their own sends (debugging)
drop policy if exists ns_select_own on public.notification_sends;
create policy ns_select_own on public.notification_sends for select
  using (shop_id in (select id from public.shops where user_id = auth.uid()));

-- Merchant can read their own quota usage
drop policy if exists nq_select_own on public.notification_quotas;
create policy nq_select_own on public.notification_quotas for select
  using (shop_id in (select id from public.shops where user_id = auth.uid()));

-- Tier limits are world-readable (UI shows "X of Y" to merchants)
drop policy if exists ntl_select_all on public.notification_tier_limits;
create policy ntl_select_all on public.notification_tier_limits for select
  using (true);

-- ─── Retention: keep sends 90 days, campaigns 1 year ────────────────────────
do $$ begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    if exists (select 1 from cron.job where jobname = 'notifications-prune') then
      perform cron.unschedule('notifications-prune');
    end if;
    perform cron.schedule(
      'notifications-prune',
      '45 3 * * *',
      $prune$
      delete from public.notification_sends     where created_at < now() - interval '90 days';
      delete from public.notification_campaigns where created_at < now() - interval '365 days';
      delete from public.notification_quotas    where updated_at < now() - interval '365 days';
      $prune$
    );
  end if;
end $$;
