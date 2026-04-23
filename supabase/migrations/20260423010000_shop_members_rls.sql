-- RLS policies for sub-account access. Members (cashier / branch_manager)
-- need to read their shop, its loyalty_programs, customer_passes, and
-- activity_log so the Scan & Redeem screen renders. Owners remain governed
-- by the existing "*_own" policies.
--
-- Writes (points-update, redeem, etc.) go through the service-role edge
-- functions, so write policies are intentionally scoped to READ + the
-- activity_log audit insert that the Scan UI does directly.

begin;

-- shops: members can SELECT the shop they belong to.
drop policy if exists "members read own shop" on public.shops;
create policy "members read own shop"
  on public.shops for select
  to authenticated
  using (
    exists (
      select 1 from public.shop_members
      where shop_members.shop_id = shops.id
        and shop_members.user_id = auth.uid()
    )
  );

-- loyalty_programs: members can SELECT programs of their shop.
drop policy if exists "members read shop programs" on public.loyalty_programs;
create policy "members read shop programs"
  on public.loyalty_programs for select
  to authenticated
  using (
    exists (
      select 1 from public.shop_members
      where shop_members.shop_id = loyalty_programs.shop_id
        and shop_members.user_id = auth.uid()
    )
  );

-- customer_passes: members can SELECT and UPDATE passes of their shop
-- (UPDATE is needed if the Scan UI writes stamps/points directly — the
-- edge function path uses service_role so this is belt-and-suspenders).
drop policy if exists "members read shop passes" on public.customer_passes;
create policy "members read shop passes"
  on public.customer_passes for select
  to authenticated
  using (
    exists (
      select 1 from public.shop_members
      where shop_members.shop_id = customer_passes.shop_id
        and shop_members.user_id = auth.uid()
    )
  );

drop policy if exists "members update shop passes" on public.customer_passes;
create policy "members update shop passes"
  on public.customer_passes for update
  to authenticated
  using (
    exists (
      select 1 from public.shop_members
      where shop_members.shop_id = customer_passes.shop_id
        and shop_members.user_id = auth.uid()
    )
  );

drop policy if exists "members insert shop passes" on public.customer_passes;
create policy "members insert shop passes"
  on public.customer_passes for insert
  to authenticated
  with check (
    exists (
      select 1 from public.shop_members
      where shop_members.shop_id = customer_passes.shop_id
        and shop_members.user_id = auth.uid()
    )
  );

-- activity_log: members can SELECT + INSERT (the Scan UI writes audit rows).
drop policy if exists "members read shop activity" on public.activity_log;
create policy "members read shop activity"
  on public.activity_log for select
  to authenticated
  using (
    exists (
      select 1 from public.shop_members
      where shop_members.shop_id = activity_log.shop_id
        and shop_members.user_id = auth.uid()
    )
  );

drop policy if exists "members insert shop activity" on public.activity_log;
create policy "members insert shop activity"
  on public.activity_log for insert
  to authenticated
  with check (
    exists (
      select 1 from public.shop_members
      where shop_members.shop_id = activity_log.shop_id
        and shop_members.user_id = auth.uid()
    )
  );

commit;
