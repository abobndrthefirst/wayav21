-- Sub-accounts couldn't find customers via Scan & Redeem because the
-- shop-scoped SECURITY DEFINER functions only authorized the shop owner
-- (shops.user_id = auth.uid()). Extend them to ALSO authorize members
-- via public.is_shop_member(_shop_id).
--
-- Affected:
--   find_customer_pass — phone lookup from Scan & Redeem
--   shop_customers     — customer list with rewards_used counts
--
-- platform_metrics stays admin-only (unchanged).

begin;

-- ── find_customer_pass (allow owners + members) ─────────────────────────
create or replace function public.find_customer_pass(_shop_id uuid, _phone text)
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  result jsonb;
  digits_only text;
  normalized text;
  local9 text;
begin
  if not (public.is_shop_owner(_shop_id) or public.is_shop_member(_shop_id)) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  digits_only := regexp_replace(coalesce(_phone, ''), '[^0-9]', '', 'g');
  if length(digits_only) = 0 then
    return null;
  end if;

  if length(digits_only) >= 9 then
    local9 := right(digits_only, 9);
    normalized := '+966' || local9;
  else
    local9 := digits_only;
    normalized := digits_only;
  end if;

  select jsonb_build_object(
    'id',              cp.id,
    'customer_name',   cp.customer_name,
    'customer_phone',  cp.customer_phone,
    'points',          cp.points,
    'stamps',          cp.stamps,
    'tier',            cp.tier,
    'rewards_balance', cp.rewards_balance,
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
  )
  into result
  from public.customer_passes cp
  left join public.loyalty_programs lp on lp.id = cp.program_id
  where cp.shop_id = _shop_id
    and (
      cp.customer_phone = _phone
      or cp.customer_phone = normalized
      or regexp_replace(coalesce(cp.customer_phone, ''), '[^0-9]', '', 'g') = digits_only
      or right(regexp_replace(coalesce(cp.customer_phone, ''), '[^0-9]', '', 'g'), 9) = local9
    )
  order by cp.updated_at desc nulls last
  limit 1;

  return result;
end;
$$;

grant execute on function public.find_customer_pass(uuid, text) to authenticated, service_role;

-- ── shop_customers (allow owners + members) ────────────────────────────
create or replace function public.shop_customers(_shop_id uuid)
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  result jsonb;
begin
  if not (public.is_shop_owner(_shop_id) or public.is_shop_member(_shop_id)) then
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

grant execute on function public.shop_customers(uuid) to authenticated, service_role;

commit;
