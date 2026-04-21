-- Pass designer upgrade: columns the card builder needs but the baseline never created.
-- Safe to re-run; uses IF NOT EXISTS and idempotent backfills.

-- 1. is_active: used by the public-read RLS policy (20260415000010) and by
--    PassDesignerPage.handleSave. Column was referenced in policy + app code
--    but never created in the schema baseline.
ALTER TABLE loyalty_programs
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- 2. reward_icon_url: stores the selected emoji-as-PNG data URL or a Supabase
--    Storage URL. Flows into Apple .pkpass as strip.png / thumbnail.png.
ALTER TABLE loyalty_programs
  ADD COLUMN IF NOT EXISTS reward_icon_url text;

-- 3. card_gradient: optional two-stop gradient for designer preview.
--    Wallet passes render the flat card_color (wallets don't support CSS gradients),
--    so this is preview-only but round-trips through saves.
--    Shape: {"from":"#10B981","to":"#059669","angle":135} or null.
ALTER TABLE loyalty_programs
  ADD COLUMN IF NOT EXISTS card_gradient jsonb;

-- 4. pass_language: which language the wallet labels render in.
--    'auto' means let the pass include both en.lproj + ar.lproj so the OS picks.
ALTER TABLE loyalty_programs
  ADD COLUMN IF NOT EXISTS pass_language text NOT NULL DEFAULT 'auto';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'loyalty_programs_pass_language_check'
  ) THEN
    ALTER TABLE loyalty_programs
      ADD CONSTRAINT loyalty_programs_pass_language_check
      CHECK (pass_language IN ('en', 'ar', 'auto'));
  END IF;
END $$;

-- Backfill: any rows that existed before is_active was added should be active.
UPDATE loyalty_programs SET is_active = true WHERE is_active IS NULL;

-- Helpful for the public-read policy that filters by is_active + is_published.
CREATE INDEX IF NOT EXISTS idx_loyalty_programs_active_published
  ON loyalty_programs (is_active, is_published)
  WHERE is_active = true AND is_published = true;
