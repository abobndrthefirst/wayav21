-- Shop-level account status, derived from the most-recent subscription.
-- Lets the app answer "is this shop production-ready?" in one column lookup
-- without joining subscriptions + evaluating expiry windows every time.
--
-- State machine:
--   trial                  default on signup, never paid
--   active                 has a current paid subscription
--   past_due               payment failing, grace period
--   canceled               user canceled after paying (access until period end)
--   payment_failed         initial payment failed
--   resubscribe_required   was active once, subscription ended, needs re-sub
--
-- A Postgres trigger on `subscriptions` keeps this in sync — edge functions
-- don't have to touch this column directly.

alter table public.shops
  add column if not exists account_status text not null default 'trial'
    check (account_status in (
      'trial', 'active', 'past_due', 'canceled',
      'payment_failed', 'resubscribe_required'
    )),
  add column if not exists first_activated_at timestamptz,
  add column if not exists demo_cleared_at timestamptz;

create index if not exists shops_account_status_idx on public.shops(account_status);

-- Hook: called the first time a shop becomes `active`. Wipe or reset any
-- demo / placeholder data that was present during the trial. Currently a
-- no-op; extend with DELETE statements as product decides what counts as
-- "fake". Examples of where you might reset:
--   delete from public.loyalty_programs where shop_id = _shop_id and is_demo;
--   update public.shops set reward_threshold = 10 where id = _shop_id;
create or replace function public.clear_demo_data_for_shop(_shop_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- TODO (product): add cleanup statements here. Until one is defined,
  -- we only stamp the timestamp so we never re-run this for the same shop.
  update public.shops
  set demo_cleared_at = now(),
      updated_at = now()
  where id = _shop_id
    and demo_cleared_at is null;
end;
$$;

-- Trigger function: map subscription status → shop.account_status.
create or replace function public.sync_shop_account_status()
returns trigger
language plpgsql
security definer
as $$
declare
  _new_status text;
  _shop_first_activated_at timestamptz;
begin
  -- Derive the shop-level status from the mutated subscription row.
  _new_status := case NEW.status
    when 'active'   then 'active'
    when 'past_due' then 'past_due'
    when 'canceled' then 'canceled'
    when 'failed'   then 'payment_failed'
    when 'expired'  then null  -- handled below, depends on history
    when 'pending'  then null  -- ignore; don't flip status on pending insert
    else null
  end;

  -- For expired: if the shop was ever active before, treat as resubscribe.
  -- Otherwise leave whatever status they already have (typically 'trial').
  if NEW.status = 'expired' then
    select first_activated_at into _shop_first_activated_at
    from public.shops where id = NEW.shop_id;
    if _shop_first_activated_at is not null then
      _new_status := 'resubscribe_required';
    end if;
  end if;

  -- First transition to active: stamp first_activated_at and run the
  -- demo-data cleanup hook. Both are one-shot — idempotent via COALESCE
  -- and the `demo_cleared_at is null` guard.
  if NEW.status = 'active' then
    update public.shops
    set first_activated_at = coalesce(first_activated_at, now()),
        updated_at = now()
    where id = NEW.shop_id;
    perform public.clear_demo_data_for_shop(NEW.shop_id);
  end if;

  if _new_status is not null then
    update public.shops
    set account_status = _new_status,
        updated_at = now()
    where id = NEW.shop_id;
  end if;

  return NEW;
end;
$$;

drop trigger if exists subscriptions_sync_shop_status on public.subscriptions;
create trigger subscriptions_sync_shop_status
  after insert or update of status on public.subscriptions
  for each row execute function public.sync_shop_account_status();

-- Backfill existing shops based on the most recent subscription row each has.
update public.shops s
set account_status = case
    when sub.status = 'active'   then 'active'
    when sub.status = 'past_due' then 'past_due'
    when sub.status = 'canceled' then 'canceled'
    when sub.status = 'failed'   then 'payment_failed'
    when sub.status = 'expired' and exists (
      select 1 from public.subscriptions s2
      where s2.shop_id = s.id and s2.status = 'active'
    ) then 'resubscribe_required'
    else 'trial'
  end,
  first_activated_at = (
    select min(created_at)
    from public.subscriptions
    where shop_id = s.id and status = 'active'
  )
from (
  select distinct on (shop_id)
    shop_id, status, created_at
  from public.subscriptions
  order by shop_id, created_at desc
) sub
where sub.shop_id = s.id;
