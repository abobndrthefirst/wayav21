-- Platform-wide metrics for the Waya admin dashboard at /admin/metrics.
-- security definer + hard-coded admin allowlist so the underlying queries
-- can read auth.users and every shop's data, but callers must be on the
-- allowlist. Add emails to the array as more admins come online.

create or replace function public.platform_metrics()
returns jsonb
language plpgsql
security definer
stable
as $$
declare
  admin_emails text[] := array[
    'sultanhhaidar@gmail.com',
    'hello@trywaya.com'
  ];
  caller_email text;
begin
  select email into caller_email from auth.users where id = auth.uid();
  if caller_email is null or not (caller_email = any(admin_emails)) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'users_total',       (select count(*) from auth.users),
    'users_confirmed',   (select count(*) from auth.users where email_confirmed_at is not null),
    'users_7d',          (select count(*) from auth.users where created_at > now() - interval '7 days'),
    'users_24h',         (select count(*) from auth.users where created_at > now() - interval '24 hours'),
    'shops_total',       (select count(*) from public.shops),
    'shops_active',      (select count(*) from public.shops where account_status in ('on_trial','active')),
    'shops_with_cards',  (select count(distinct shop_id) from public.customer_passes),
    'cards_total',       (select count(*) from public.customer_passes),
    'cards_7d',          (select count(*) from public.customer_passes where created_at > now() - interval '7 days'),
    'cards_24h',         (select count(*) from public.customer_passes where created_at > now() - interval '24 hours'),
    'visits_total',      (select count(*) from public.activity_log where action = 'add_stamp'),
    'visits_7d',         (select count(*) from public.activity_log where action = 'add_stamp' and created_at > now() - interval '7 days'),
    'visits_24h',        (select count(*) from public.activity_log where action = 'add_stamp' and created_at > now() - interval '24 hours'),
    'rewards_redeemed',  (select count(*) from public.activity_log where action = 'redeem_reward'),
    'rewards_redeemed_7d',(select count(*) from public.activity_log where action = 'redeem_reward' and created_at > now() - interval '7 days'),
    'rewards_earned_total',
        (select count(*) from public.activity_log where action = 'redeem_reward')
      + (select coalesce(sum(rewards_balance), 0) from public.customer_passes),
    'last_activity_at',  (select max(created_at) from public.activity_log),
    'computed_at',       now()
  );
end;
$$;

grant execute on function public.platform_metrics() to authenticated;
