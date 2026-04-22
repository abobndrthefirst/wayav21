-- find_customer_pass — fuzzy phone lookup for the Scan & Redeem merchant tab.
-- Security definer so the shop owner doesn't have to chain through
-- customer_passes + loyalty_programs RLS, and to sidestep the PostgREST
-- quirk where `+` in an .or() filter gets URL-decoded as a space.
--
-- Matches on:
--   1. Exact stored value of customer_phone
--   2. Normalized +966-prefixed form
--   3. Digit-only string
--   4. Last 9 digits (local part after country code)
--
-- Returns the same JSON shape the Scan & Redeem client already expects,
-- including the embedded loyalty_programs sub-object.

create or replace function public.find_customer_pass(_shop_id uuid, _phone text)
returns jsonb
language plpgsql
security definer
stable
as $$
declare
  result jsonb;
  digits_only text;
  normalized text;
  local9 text;
begin
  if not exists (
    select 1 from public.shops
    where id = _shop_id and user_id = auth.uid()
  ) then
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
