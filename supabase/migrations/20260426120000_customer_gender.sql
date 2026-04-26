-- Add gender to customer_passes for opt-in demographic insight on the
-- merchant's customer list. Three explicit values to keep analytics
-- consistent; any other value is rejected at the DB level.

alter table public.customer_passes
  add column if not exists customer_gender text;

-- Drop and recreate the check so this migration is re-runnable in case
-- a partial earlier attempt left an orphan constraint.
alter table public.customer_passes
  drop constraint if exists customer_passes_customer_gender_check;

alter table public.customer_passes
  add constraint customer_passes_customer_gender_check
  check (customer_gender is null or customer_gender in ('male', 'female', 'prefer_not'));

comment on column public.customer_passes.customer_gender is
  'Self-reported at enrollment. Optional. One of: male, female, prefer_not. NULL = customer skipped the question.';

-- Re-publish the platform customers RPC so the admin metrics dashboard
-- surfaces the new column. Postgres won't change a function's return-type
-- shape via CREATE OR REPLACE — we have to drop first.
drop function if exists public.platform_customers_list();

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
      u.email,
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
    order by cp.created_at desc;
end;
$$;

grant execute on function public.platform_customers_list() to authenticated;
