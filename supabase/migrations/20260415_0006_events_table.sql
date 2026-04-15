-- Unified event log for business + tech events.
-- This is the canonical "what happened" stream — separate from activity_log
-- (which is merchant-facing CRUD audit) and from Supabase's edge logs
-- (which are ephemeral and not queryable at scale).
--
-- Query patterns:
--   - Dashboard "recent failures" card: where severity in ('error','critical')
--     and shop_id = :shop_id order by created_at desc limit 20
--   - Ops/health dashboard: count by event_type per hour
--   - Customer support: where customer_phone_hash = :hash order by created_at
--
-- Write patterns:
--   - Edge functions call logEvent() (see _shared/events.ts) — never throws;
--     a failed insert must not break the user-facing flow.

begin;

create table if not exists public.events (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),

  -- What happened
  event_type     text        not null,           -- e.g. 'card_issued', 'card_failed', 'apns_push_failed'
  category       text        not null,           -- 'business' | 'tech' | 'security'
  severity       text        not null default 'info', -- 'info' | 'warn' | 'error' | 'critical'
  source         text        not null,           -- edge function name, e.g. 'apple-wallet-public'

  -- Who / what it's attached to (all nullable — some events have no shop)
  shop_id        uuid        references public.shops(id)             on delete set null,
  program_id     uuid        references public.loyalty_programs(id)  on delete set null,
  customer_pass_id uuid      references public.customer_passes(id)   on delete set null,

  -- Public-surface context (never PII — hashed phone, truncated UA)
  client_ip      text,                           -- x-forwarded-for first hop
  user_agent     text,                           -- truncated to 256 chars at insert

  -- Freeform detail
  message        text,                           -- short human-readable summary
  error_code     text,                           -- stable code for grouping (e.g. 'APNS_410', 'RATE_LIMITED')
  metadata       jsonb       not null default '{}'::jsonb,

  -- Idempotency guard for retries (nullable; only enforced when provided)
  request_id     text,

  constraint events_category_chk check (category in ('business','tech','security')),
  constraint events_severity_chk check (severity in ('info','warn','error','critical'))
);

-- Indexes tuned for the read patterns above.
create index if not exists events_shop_created_idx
  on public.events (shop_id, created_at desc);

create index if not exists events_type_created_idx
  on public.events (event_type, created_at desc);

create index if not exists events_severity_created_idx
  on public.events (severity, created_at desc)
  where severity in ('error','critical');

create index if not exists events_program_created_idx
  on public.events (program_id, created_at desc)
  where program_id is not null;

-- Partial UNIQUE on request_id (per event_type) — lets callers pass an
-- idempotency key without forcing one on every write.
create unique index if not exists events_request_id_uq
  on public.events (event_type, request_id)
  where request_id is not null;

-- RLS: merchants see only their own shop's events; service_role writes all.
alter table public.events enable row level security;
alter table public.events force row level security;

drop policy if exists events_select_own on public.events;
create policy events_select_own on public.events
  for select to authenticated
  using (
    shop_id is not null
    and exists (
      select 1 from public.shops s
      where s.id = events.shop_id and s.user_id = auth.uid()
    )
  );

-- No insert / update / delete policies for authenticated — only service_role
-- (which bypasses RLS by design) can write. Keeps the log tamper-evident
-- from the client side.

-- Retention: events older than 90 days get pruned nightly so the table
-- doesn't grow unbounded. Critical events are kept 1 year for postmortems.
select cron.schedule(
  'nightly-events-prune',
  '15 3 * * *',  -- 03:15 UTC
  $$
  delete from public.events
  where (severity in ('info','warn') and created_at < now() - interval '90 days')
     or (severity in ('error','critical') and created_at < now() - interval '365 days');
  $$
);

commit;
