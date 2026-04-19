-- New "on_trial" status: the shop has a real, usable account (no fake data,
-- full product access) for a free introductory window. When the window
-- passes they flip to resubscribe_required and must pay to continue.
--
-- To change the trial length, edit public.waya_trial_days() — one-line
-- SQL change, no app deploy needed.

-- ── 1. Single source of truth for the trial window ────────────────────────
-- Edit the integer below to change how long new shops stay on_trial.
create or replace function public.waya_trial_days()
returns int
language sql
immutable
as $$ select 60 $$;  -- 2 months (60 days). Edit this and the change is live.

grant execute on function public.waya_trial_days() to authenticated, service_role;

-- ── 2. Extend the account_status enum with 'on_trial' + drop legacy 'trial' ─
-- Drop the OLD constraint FIRST (it still lists 'trial' in its allowed
-- values) so the UPDATE below can move rows to 'on_trial' without
-- violating it. Then rename rows, then add the new constraint.
alter table public.shops
  drop constraint if exists shops_account_status_check;

update public.shops
set account_status = 'on_trial'
where account_status = 'trial';

alter table public.shops
  add constraint shops_account_status_check
  check (account_status in (
    'on_trial', 'active', 'past_due', 'canceled',
    'payment_failed', 'resubscribe_required'
  ));

alter table public.shops
  alter column account_status set default 'on_trial';

-- ── 3. Convenience column: trial_ends_at, computed from created_at ────────
-- A plain generated column would fail because the expression would use a
-- mutable function call; keep it as a regular column and maintain on write
-- via a trigger. Also backfill for existing rows.
alter table public.shops
  add column if not exists trial_ends_at timestamptz;

update public.shops
set trial_ends_at = created_at + (public.waya_trial_days() || ' days')::interval
where trial_ends_at is null;

create or replace function public.set_shop_trial_ends_at()
returns trigger
language plpgsql
as $$
begin
  if NEW.trial_ends_at is null then
    NEW.trial_ends_at :=
      coalesce(NEW.created_at, now())
      + (public.waya_trial_days() || ' days')::interval;
  end if;
  return NEW;
end;
$$;

drop trigger if exists shops_set_trial_ends_at on public.shops;
create trigger shops_set_trial_ends_at
  before insert on public.shops
  for each row execute function public.set_shop_trial_ends_at();

-- ── 4. Expire trials: on_trial → resubscribe_required past the window ────
create or replace function public.expire_on_trial_shops()
returns int
language sql
security definer
as $$
  with expired as (
    update public.shops
    set account_status = 'resubscribe_required',
        updated_at = now()
    where account_status = 'on_trial'
      and trial_ends_at is not null
      and trial_ends_at < now()
    returning id
  )
  select count(*)::int from expired;
$$;

-- Scheduled: daily at 04:00 UTC (~07:00 Riyadh). The check is cheap — a
-- single UPDATE with an index-backed WHERE — so running daily is fine.
-- Reactively, streampay-get-status will also flip an expired shop on read.
select cron.unschedule('expire-on-trial-shops')
where exists (select 1 from cron.job where jobname = 'expire-on-trial-shops');

select cron.schedule(
  'expire-on-trial-shops',
  '0 4 * * *',
  $$ select public.expire_on_trial_shops(); $$
);

create index if not exists shops_trial_ends_at_idx
  on public.shops(trial_ends_at)
  where account_status = 'on_trial';
