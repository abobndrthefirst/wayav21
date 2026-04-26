-- Poster system upgrade.
-- 1. business_type on loyalty_programs — drives the reward emoji + future copy logic
--    on the printable poster templates (cafe, salon, gym, etc.).
-- 2. poster_scans — append-only table that logs which poster template each
--    enrollment came from, so we can rank template performance across all merchants.
--
-- Safe to re-run: every step is idempotent.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. business_type on loyalty_programs
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.loyalty_programs
  ADD COLUMN IF NOT EXISTS business_type text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'loyalty_programs_business_type_check'
  ) THEN
    ALTER TABLE public.loyalty_programs
      ADD CONSTRAINT loyalty_programs_business_type_check
      CHECK (business_type IS NULL OR business_type IN (
        'coffee','restaurant','salon','barber','gym','retail','clinic','bakery','sweets','other'
      ));
  END IF;
END $$;

COMMENT ON COLUMN public.loyalty_programs.business_type IS
  'Drives poster emoji + copy variants. NULL = no preference, falls back to gift emoji. One of: coffee, restaurant, salon, barber, gym, retail, clinic, bakery, sweets, other.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. poster_scans — public-insertable, admin-readable scan log
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.poster_scans (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id   uuid NOT NULL REFERENCES public.loyalty_programs(id) ON DELETE CASCADE,
  template_id  text NOT NULL,
  user_agent   text,
  scanned_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_poster_scans_program_template
  ON public.poster_scans (program_id, template_id, scanned_at DESC);

CREATE INDEX IF NOT EXISTS idx_poster_scans_template_time
  ON public.poster_scans (template_id, scanned_at DESC);

ALTER TABLE public.poster_scans ENABLE ROW LEVEL SECURITY;

-- The /w/:programId landing page is anonymous — anyone with a valid program_id
-- can log a scan. This is fine because the data is purely additive (no PII)
-- and bounded by the program FK.
DROP POLICY IF EXISTS "anyone can insert poster scans"   ON public.poster_scans;
DROP POLICY IF EXISTS "shop owners read their scans"     ON public.poster_scans;
DROP POLICY IF EXISTS "platform admins read all scans"   ON public.poster_scans;

CREATE POLICY "anyone can insert poster scans"
  ON public.poster_scans
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Shop owners can read scans for programs they own.
CREATE POLICY "shop owners read their scans"
  ON public.poster_scans
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.loyalty_programs lp
      JOIN public.shops s ON s.id = lp.shop_id
      WHERE lp.id = poster_scans.program_id
        AND s.user_id = auth.uid()
    )
  );

-- Platform admins read everything (for the global template-performance view).
CREATE POLICY "platform admins read all scans"
  ON public.poster_scans
  FOR SELECT
  TO authenticated
  USING (public.is_platform_admin());

COMMENT ON TABLE public.poster_scans IS
  'Append-only scan log. One row per /w/:programId page load that arrived with ?src=<template_id>. Used to rank poster template performance.';

COMMENT ON COLUMN public.poster_scans.template_id IS
  'Matches the key in ProgramQR.posters[] in src/components/ProgramsList.jsx (bold, minimal, tent, confession, receipt, share, etc.).';
