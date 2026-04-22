-- Extend shop_customers to include a per-row `rewards_used` count so the
-- customers modal can show both "rewards available" (unredeemed) and
-- "rewards used" (historical redemptions). Counts redeem_reward rows in
-- activity_log matching the shop + customer_name.

create or replace function public.shop_customers(_shop_id uuid)
returns jsonb
language plpgsql
security definer
stable
as $$
declare
  result jsonb;
begin
  if not exists (
    select 1 from public.shops
    where id = _shop_id and user_id = auth.uid()
  ) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select coalesce(jsonb_agg(row order by last_visit desc nulls last), '[]'::jsonb)
  into result
  from (
    select jsonb_build_object(
      'id',              cp.id,
      'customer_name',   cp.customer_name,
      'customer_phone',  cp.customer_phone,
      'points',          cp.points,
      'stamps',          cp.stamps,
      'tier',            cp.tier,
      'rewards_balance', cp.rewards_balance,
      'rewards_used', (
        select count(*)::int
        from public.activity_log al
        where al.shop_id = cp.shop_id
          and al.customer_name = cp.customer_name
          and al.action = 'redeem_reward'
      ),
      'last_visit_at',   cp.last_visit_at,
      'loyalty_programs', case
        when lp.id is null then null
        else jsonb_build_object(
          'name',             lp.name,
          'loyalty_type',     lp.loyalty_type,
          'stamps_required',  lp.stamps_required,
          'reward_threshold', lp.reward_threshold
        )
      end
    ) as row,
    cp.last_visit_at as last_visit
    from public.customer_passes cp
    left join public.loyalty_programs lp on lp.id = cp.program_id
    where cp.shop_id = _shop_id
  ) s;

  return result;
end;
$$;
