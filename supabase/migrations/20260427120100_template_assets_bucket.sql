-- Public-read storage bucket for AI-generated card backgrounds and previews
-- saved by the admin Design Studio. Mirrors the existing program-assets bucket
-- pattern (which was created via dashboard) but does it through SQL so the
-- setup is reproducible across staging / preview branches.
--
-- Bucket name: template-assets
-- Visibility:  public read (so wallets can fetch background URLs without auth)
-- Write:       admins only, via is_platform_admin()
--
-- Safe to re-run.

insert into storage.buckets (id, name, public)
values ('template-assets', 'template-assets', true)
on conflict (id) do update
  set public = excluded.public;

drop policy if exists "template-assets read public"     on storage.objects;
drop policy if exists "template-assets insert admin"    on storage.objects;
drop policy if exists "template-assets update admin"    on storage.objects;
drop policy if exists "template-assets delete admin"    on storage.objects;

create policy "template-assets read public"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'template-assets');

create policy "template-assets insert admin"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'template-assets' and public.is_platform_admin());

create policy "template-assets update admin"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'template-assets' and public.is_platform_admin())
  with check (bucket_id = 'template-assets' and public.is_platform_admin());

create policy "template-assets delete admin"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'template-assets' and public.is_platform_admin());
