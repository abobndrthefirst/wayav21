-- Admin Design Studio: shared card-template library.
-- Admins (see public.platform_admins) generate premium card aesthetics via
-- Gemini in the new admin-design-studio edge function and save them here.
-- Once is_published = true, every merchant sees the template in their pass
-- designer alongside the eight built-ins shipped in templates.js.
--
-- Safe to re-run.

create table if not exists public.card_templates (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  prompt          text,
  theme           jsonb not null,
  background_url  text,
  preview_url     text,
  is_published    boolean not null default false,
  created_by_email text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_card_templates_published_created
  on public.card_templates (is_published, created_at desc);

alter table public.card_templates enable row level security;

drop policy if exists "card_templates select published or admin"  on public.card_templates;
drop policy if exists "card_templates insert admin only"          on public.card_templates;
drop policy if exists "card_templates update admin only"          on public.card_templates;
drop policy if exists "card_templates delete admin only"          on public.card_templates;

-- Anyone signed in can read PUBLISHED templates (so merchants can pick them).
-- Admins additionally see every draft.
create policy "card_templates select published or admin"
  on public.card_templates
  for select
  to authenticated
  using (is_published = true or public.is_platform_admin());

create policy "card_templates insert admin only"
  on public.card_templates
  for insert
  to authenticated
  with check (public.is_platform_admin());

create policy "card_templates update admin only"
  on public.card_templates
  for update
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy "card_templates delete admin only"
  on public.card_templates
  for delete
  to authenticated
  using (public.is_platform_admin());

-- Keep updated_at fresh on every row update.
create or replace function public.tg_card_templates_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_card_templates_touch_updated_at on public.card_templates;
create trigger trg_card_templates_touch_updated_at
  before update on public.card_templates
  for each row execute function public.tg_card_templates_touch_updated_at();

comment on table public.card_templates is
  'Admin-curated card design library. Generated via Gemini in the admin-design-studio edge function. Published rows surface as additional presets in the merchant pass designer.';

comment on column public.card_templates.theme is
  'Shape: { card_color: hex, text_color: hex, gradient?: { from: hex, to: hex, angle: 0-360 }, accent?: hex }. Mirrors the keys consumed by useDesignState.js.';
