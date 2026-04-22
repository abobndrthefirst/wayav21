-- Public wallet landing (/w/:programId) needs anonymous SELECT on the
-- program row (and its shop) so the card preview can render before the
-- customer submits their name/phone. The signed enrollment token in the
-- URL is the real gate on pass issuance — reading the program itself is
-- safe to expose for active programs only.
--
-- Note: Postgres does not support `CREATE POLICY IF NOT EXISTS`, so we
-- drop-then-create to make this migration idempotent.

drop policy if exists "public read active programs" on loyalty_programs;
create policy "public read active programs"
  on loyalty_programs for select
  to anon
  using (is_active = true);

drop policy if exists "public read shops of active programs" on shops;
create policy "public read shops of active programs"
  on shops for select
  to anon
  using (exists (
    select 1 from loyalty_programs
    where loyalty_programs.shop_id = shops.id
      and loyalty_programs.is_active = true
  ));
