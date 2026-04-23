-- Fix: infinite recursion between shops.RLS and shop_members.RLS.
--
-- Previous state:
--   shop_members "owners manage members" references shops RLS
--   shops "members read own shop"        references shop_members RLS
-- → Postgres refused every query on shop_members with 42P17.
--
-- Fix: wrap both checks in SECURITY DEFINER functions so they evaluate
-- without re-entering RLS on the referenced table.

begin;

create or replace function public.is_shop_owner(p_shop_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.shops
    where id = p_shop_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_shop_member(p_shop_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.shop_members
    where shop_id = p_shop_id and user_id = auth.uid()
  );
$$;

grant execute on function public.is_shop_owner(uuid) to authenticated;
grant execute on function public.is_shop_member(uuid) to authenticated;

-- Rewrite the circular policies to use the helpers

drop policy if exists "owners manage members" on public.shop_members;
create policy "owners manage members"
  on public.shop_members for all
  to authenticated
  using (public.is_shop_owner(shop_id))
  with check (public.is_shop_owner(shop_id));

drop policy if exists "members read own shop" on public.shops;
create policy "members read own shop"
  on public.shops for select
  to authenticated
  using (public.is_shop_member(id));

drop policy if exists "members read shop programs" on public.loyalty_programs;
create policy "members read shop programs"
  on public.loyalty_programs for select
  to authenticated
  using (public.is_shop_member(shop_id));

drop policy if exists "members read shop passes" on public.customer_passes;
create policy "members read shop passes"
  on public.customer_passes for select
  to authenticated
  using (public.is_shop_member(shop_id));

drop policy if exists "members update shop passes" on public.customer_passes;
create policy "members update shop passes"
  on public.customer_passes for update
  to authenticated
  using (public.is_shop_member(shop_id));

drop policy if exists "members insert shop passes" on public.customer_passes;
create policy "members insert shop passes"
  on public.customer_passes for insert
  to authenticated
  with check (public.is_shop_member(shop_id));

drop policy if exists "members read shop activity" on public.activity_log;
create policy "members read shop activity"
  on public.activity_log for select
  to authenticated
  using (public.is_shop_member(shop_id));

drop policy if exists "members insert shop activity" on public.activity_log;
create policy "members insert shop activity"
  on public.activity_log for insert
  to authenticated
  with check (public.is_shop_member(shop_id));

commit;
