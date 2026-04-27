-- Marketer affiliate program — table 3/4: commissions.
--
-- One commission row per merchant_subscription that gets attributed to a
-- marketer AND moves to status='active'. The auto-create trigger fires on
-- both inserts (rare: a subscription created already-active) and on status
-- transitions to 'active'. amount_sar starts NULL — the admin sets it
-- manually in Supabase Studio when reviewing each commission for MVP.
--
-- Status flow (admin-managed):
--   pending   → auto-created when subscription becomes active
--   approved  → admin set the amount and confirmed it's owed
--   paid      → admin recorded the payout (sets paid_at)
--   cancelled → won't be paid (refund, fraud, withdrawal)
--
-- RLS lets the marketer read commissions tied to their own marketer row.
-- No insert/update policies — all mutations are admin-only via Studio.

begin;

do $$ begin
  create type marketer_commission_status as enum (
    'pending', 'approved', 'paid', 'cancelled'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.commissions (
  id                       uuid primary key default gen_random_uuid(),
  marketer_id              uuid not null references public.marketers(id) on delete cascade,
  merchant_subscription_id uuid not null unique references public.merchant_subscriptions(id) on delete cascade,
  amount_sar               numeric(10, 2),
  status                   marketer_commission_status not null default 'pending',
  paid_at                  timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists commissions_marketer_idx on public.commissions(marketer_id);
create index if not exists commissions_status_idx   on public.commissions(status);

create or replace function public.create_pending_commission_on_active()
returns trigger
language plpgsql
as $$
begin
  if new.marketer_id is not null
     and new.status = 'active'
     and (
       tg_op = 'INSERT'
       or old.status is distinct from 'active'
       or old.marketer_id is distinct from new.marketer_id
     )
  then
    insert into public.commissions (marketer_id, merchant_subscription_id)
      values (new.marketer_id, new.id)
      on conflict (merchant_subscription_id) do nothing;
  end if;
  return new;
end $$;

drop trigger if exists merchant_subs_create_commission on public.merchant_subscriptions;
create trigger merchant_subs_create_commission
  after insert or update of status, marketer_id on public.merchant_subscriptions
  for each row execute function public.create_pending_commission_on_active();

alter table public.commissions enable row level security;

drop policy if exists "marketer reads own commissions" on public.commissions;
create policy "marketer reads own commissions"
  on public.commissions for select
  to authenticated
  using (
    exists (
      select 1 from public.marketers
      where marketers.id = commissions.marketer_id
        and marketers.user_id = auth.uid()
    )
  );

commit;
