-- Admin-only data console RPCs.
-- Powers the dashboard `Data` tab: per-store counters, store picker,
-- and a date-filtered customer list.
--
-- All three functions are gated by public.is_platform_admin() — defense
-- in depth on top of the existing RLS that scopes customer_passes /
-- activity_log to the merchant who owns the shop.

-- ──────────────────────────────────────────────────────────────────────
-- 1. Counters: customers (lifetime + in-range), sales, redemptions.
--    Optional shop_id filter; null = all stores.
-- ──────────────────────────────────────────────────────────────────────

create or replace function public.platform_data_counters(
  _shop_id uuid          default null,
  _start   timestamptz   default null,
  _end     timestamptz   default null
)
returns table (
  customers_total     bigint,
  customers_in_range  bigint,
  sales_count         bigint,
  redemptions_count   bigint
)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
    select
      (select count(*)
         from public.customer_passes cp
        where (_shop_id is null or cp.shop_id = _shop_id)),
      (select count(*)
         from public.customer_passes cp
        where (_shop_id is null or cp.shop_id = _shop_id)
          and (_start is null or cp.created_at >= _start)
          and (_end   is null or cp.created_at <  _end)),
      (select count(*)
         from public.activity_log al
        where al.action = 'add_stamp'
          and (_shop_id is null or al.shop_id = _shop_id)
          and (_start is null or al.created_at >= _start)
          and (_end   is null or al.created_at <  _end)),
      (select count(*)
         from public.activity_log al
        where al.action = 'redeem_reward'
          and (_shop_id is null or al.shop_id = _shop_id)
          and (_start is null or al.created_at >= _start)
          and (_end   is null or al.created_at <  _end));
end;
$$;

revoke all on function public.platform_data_counters(uuid, timestamptz, timestamptz) from public;
grant execute on function public.platform_data_counters(uuid, timestamptz, timestamptz) to authenticated;

-- ──────────────────────────────────────────────────────────────────────
-- 2. Store picker: every shop with its owner email, sorted by name.
-- ──────────────────────────────────────────────────────────────────────

create or replace function public.platform_shops_list()
returns table (
  shop_id     uuid,
  name        text,
  owner_email text
)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
    select s.id, s.name, u.email::text
      from public.shops s
      left join auth.users u on u.id = s.user_id
     order by lower(coalesce(s.name, '')) asc;
end;
$$;

revoke all on function public.platform_shops_list() from public;
grant execute on function public.platform_shops_list() to authenticated;

-- ──────────────────────────────────────────────────────────────────────
-- 3. Re-publish platform_customers_list with optional shop + date filters.
--    Existing zero-arg callers (AdminMetricsPage) keep working via defaults.
--    Postgres won't change a function's return shape via CREATE OR REPLACE,
--    and signature-overloaded variants would silently shadow each other —
--    drop both forms first.
-- ──────────────────────────────────────────────────────────────────────

drop function if exists public.platform_customers_list();
drop function if exists public.platform_customers_list(uuid, timestamptz, timestamptz);

create or replace function public.platform_customers_list(
  _shop_id uuid          default null,
  _start   timestamptz   default null,
  _end     timestamptz   default null
)
returns table (
  shop_id          uuid,
  business_name    text,
  owner_email      text,
  program_id       uuid,
  program_name     text,
  customer_pass_id uuid,
  customer_name    text,
  customer_phone   text,
  customer_gender  text,
  stamps           int,
  points           int,
  rewards_balance  int,
  last_visit_at    timestamptz,
  created_at       timestamptz
)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
    select
      s.id,
      s.name,
      u.email::text,
      lp.id,
      lp.name,
      cp.id,
      cp.customer_name,
      cp.customer_phone,
      cp.customer_gender,
      cp.stamps,
      cp.points,
      cp.rewards_balance,
      cp.last_visit_at,
      cp.created_at
    from public.customer_passes cp
    left join public.shops            s  on s.id  = cp.shop_id
    left join public.loyalty_programs lp on lp.id = cp.program_id
    left join auth.users              u  on u.id  = s.user_id
    where (_shop_id is null or cp.shop_id = _shop_id)
      and (_start   is null or cp.created_at >= _start)
      and (_end     is null or cp.created_at <  _end)
    order by cp.created_at desc;
end;
$$;

revoke all on function public.platform_customers_list(uuid, timestamptz, timestamptz) from public;
grant execute on function public.platform_customers_list(uuid, timestamptz, timestamptz) to authenticated;
