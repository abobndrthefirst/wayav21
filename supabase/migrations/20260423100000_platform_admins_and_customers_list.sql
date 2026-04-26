-- Platform admins: single source of truth replacing the hard-coded allowlist
-- that previously lived in both SQL and the React client. Case-insensitive
-- email match via lower(). Add new admins with INSERT.

create table if not exists public.platform_admins (
  email       text primary key,
  added_at    timestamptz not null default now(),
  added_by    text
);

alter table public.platform_admins enable row level security;
-- no policies -> only service role / security-definer functions can read.

insert into public.platform_admins (email) values
  ('sultanhhaidar@gmail.com'),
  ('hello@trywaya.com')
on conflict (email) do nothing;

-- Boolean helper: is the current JWT user on the admin list?
-- Exposed to authenticated so the client can gate UI without reading the table.
create or replace function public.is_platform_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.platform_admins pa
    join auth.users u on lower(u.email) = lower(pa.email)
    where u.id = auth.uid()
  );
$$;

grant execute on function public.is_platform_admin() to authenticated;

-- Re-point platform_metrics() at the table via is_platform_admin()
create or replace function public.platform_metrics()
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'users_total',        (select count(*) from auth.users),
    'users_confirmed',    (select count(*) from auth.users where email_confirmed_at is not null),
    'users_7d',           (select count(*) from auth.users where created_at > now() - interval '7 days'),
    'users_24h',          (select count(*) from auth.users where created_at > now() - interval '24 hours'),
    'shops_total',        (select count(*) from public.shops),
    'shops_active',       (select count(*) from public.shops where account_status in ('on_trial','active')),
    'shops_with_cards',   (select count(distinct shop_id) from public.customer_passes),
    'cards_total',        (select count(*) from public.customer_passes),
    'cards_7d',           (select count(*) from public.customer_passes where created_at > now() - interval '7 days'),
    'cards_24h',          (select count(*) from public.customer_passes where created_at > now() - interval '24 hours'),
    'visits_total',       (select count(*) from public.activity_log where action = 'add_stamp'),
    'visits_7d',          (select count(*) from public.activity_log where action = 'add_stamp' and created_at > now() - interval '7 days'),
    'visits_24h',         (select count(*) from public.activity_log where action = 'add_stamp' and created_at > now() - interval '24 hours'),
    'rewards_redeemed',   (select count(*) from public.activity_log where action = 'redeem_reward'),
    'rewards_redeemed_7d',(select count(*) from public.activity_log where action = 'redeem_reward' and created_at > now() - interval '7 days'),
    'rewards_earned_total',
        (select count(*) from public.activity_log where action = 'redeem_reward')
      + (select coalesce(sum(rewards_balance), 0) from public.customer_passes),
    'last_activity_at',   (select max(created_at) from public.activity_log),
    'computed_at',        now()
  );
end;
$$;

grant execute on function public.platform_metrics() to authenticated;

-- Admin-only view: every customer_pass joined with shop + program + owner email.
-- Used by the Admin Metrics dashboard to power the business/customer table +
-- CSV export. Returns whole table rather than paginating because current scale
-- is <100k rows; revisit if that changes.
create or replace function public.platform_customers_list()
returns table (
  shop_id          uuid,
  business_name    text,
  owner_email      text,
  program_id       uuid,
  program_name     text,
  customer_pass_id uuid,
  customer_name    text,
  customer_phone   text,
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
      u.email,
      lp.id,
      lp.name,
      cp.id,
      cp.customer_name,
      cp.customer_phone,
      cp.stamps,
      cp.points,
      cp.rewards_balance,
      cp.last_visit_at,
      cp.created_at
    from public.customer_passes cp
    left join public.shops            s  on s.id  = cp.shop_id
    left join public.loyalty_programs lp on lp.id = cp.program_id
    left join auth.users              u  on u.id  = s.user_id
    order by cp.created_at desc;
end;
$$;

grant execute on function public.platform_customers_list() to authenticated;
