-- Sub-accounts for shops: one additional staff member per shop (cashier or
-- branch manager) with their own auth login. The shop owner remains the
-- primary auth.users record on public.shops.user_id; members sit in a
-- separate join table so RLS can grant them scoped access without turning
-- them into shop owners.
--
-- MVP limit: exactly 1 sub-account per shop. Enforced by a partial unique
-- index on shop_id. Upgrade path: drop the index when we lift the limit.
--
-- Roles don't gate behavior yet — just stored for future role-based UI.

begin;

create table if not exists public.shop_members (
  id          uuid primary key default gen_random_uuid(),
  shop_id     uuid not null references public.shops(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  role        text not null check (role in ('branch_manager', 'cashier')),
  created_at  timestamptz not null default now(),
  unique (user_id)                        -- a user can only be a member of one shop
);

-- 1-per-shop rule, MVP constraint. Drop this index when we allow multiple.
create unique index if not exists shop_members_one_per_shop_idx
  on public.shop_members(shop_id);

create index if not exists shop_members_shop_idx on public.shop_members(shop_id);

-- RLS: owners read/write members of their own shops. Members read their own row.
alter table public.shop_members enable row level security;

drop policy if exists "owners manage members" on public.shop_members;
create policy "owners manage members"
  on public.shop_members for all
  to authenticated
  using (
    exists (select 1 from public.shops where shops.id = shop_members.shop_id and shops.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.shops where shops.id = shop_members.shop_id and shops.user_id = auth.uid())
  );

drop policy if exists "members read self" on public.shop_members;
create policy "members read self"
  on public.shop_members for select
  to authenticated
  using (user_id = auth.uid());

commit;
