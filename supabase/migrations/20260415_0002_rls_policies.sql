-- Row-Level Security for all Waya tables.
--
-- Model:
--   • A merchant user owns exactly one `shops` row (shops.user_id = auth.uid()).
--   • All per-merchant data (programs, passes, activity, apple regs) scopes
--     through shop_id → shops.user_id.
--   • The `service_role` always bypasses RLS — edge functions use the
--     service-role key and are free to read/write across shops.
--   • The `anon` role has NO access to any of these tables through the REST API.
--     The only public surface is the signed edge functions (wallet-public,
--     apple-passkit, etc.) which run as service_role.

begin;

-- ── Enable RLS ─────────────────────────────────────────────────────────
alter table public.shops                      enable row level security;
alter table public.loyalty_programs           enable row level security;
alter table public.customer_passes            enable row level security;
alter table public.activity_log               enable row level security;
alter table public.apple_device_registrations enable row level security;

alter table public.shops                      force row level security;
alter table public.loyalty_programs           force row level security;
alter table public.customer_passes            force row level security;
alter table public.activity_log               force row level security;
alter table public.apple_device_registrations force row level security;

-- Drop old policies if they exist (idempotent)
do $$
declare r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('shops','loyalty_programs','customer_passes',
                        'activity_log','apple_device_registrations')
  loop
    execute format('drop policy if exists %I on %I.%I',
                   r.policyname, r.schemaname, r.tablename);
  end loop;
end$$;

-- ── shops ──────────────────────────────────────────────────────────────
-- A merchant can read/write only their own shop row. Can insert only with
-- their own user_id.
create policy shops_select_own on public.shops
  for select to authenticated
  using (user_id = auth.uid());

create policy shops_insert_own on public.shops
  for insert to authenticated
  with check (user_id = auth.uid());

create policy shops_update_own on public.shops
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy shops_delete_own on public.shops
  for delete to authenticated
  using (user_id = auth.uid());

-- ── loyalty_programs ───────────────────────────────────────────────────
-- Readable/writable only by the merchant who owns the parent shop.
create policy programs_select_own on public.loyalty_programs
  for select to authenticated
  using (exists (
    select 1 from public.shops s
    where s.id = loyalty_programs.shop_id and s.user_id = auth.uid()
  ));

create policy programs_insert_own on public.loyalty_programs
  for insert to authenticated
  with check (exists (
    select 1 from public.shops s
    where s.id = loyalty_programs.shop_id and s.user_id = auth.uid()
  ));

create policy programs_update_own on public.loyalty_programs
  for update to authenticated
  using (exists (
    select 1 from public.shops s
    where s.id = loyalty_programs.shop_id and s.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.shops s
    where s.id = loyalty_programs.shop_id and s.user_id = auth.uid()
  ));

create policy programs_delete_own on public.loyalty_programs
  for delete to authenticated
  using (exists (
    select 1 from public.shops s
    where s.id = loyalty_programs.shop_id and s.user_id = auth.uid()
  ));

-- ── customer_passes ────────────────────────────────────────────────────
-- Merchants see only the passes tied to their own shops. Writes come from
-- service_role (edge functions) so no INSERT policy for authenticated.
create policy passes_select_own on public.customer_passes
  for select to authenticated
  using (exists (
    select 1 from public.shops s
    where s.id = customer_passes.shop_id and s.user_id = auth.uid()
  ));

create policy passes_update_own on public.customer_passes
  for update to authenticated
  using (exists (
    select 1 from public.shops s
    where s.id = customer_passes.shop_id and s.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.shops s
    where s.id = customer_passes.shop_id and s.user_id = auth.uid()
  ));

-- ── activity_log ───────────────────────────────────────────────────────
-- Read-only for merchants (service_role writes).
create policy activity_select_own on public.activity_log
  for select to authenticated
  using (exists (
    select 1 from public.shops s
    where s.id = activity_log.shop_id and s.user_id = auth.uid()
  ));

-- ── apple_device_registrations ─────────────────────────────────────────
-- Merchants can read registrations for their own shops' passes; writes are
-- exclusively service_role via the apple-passkit edge function.
create policy apple_reg_select_own on public.apple_device_registrations
  for select to authenticated
  using (exists (
    select 1
    from public.customer_passes p
    join public.shops s on s.id = p.shop_id
    where p.apple_serial = apple_device_registrations.serial_number
      and s.user_id = auth.uid()
  ));

commit;
