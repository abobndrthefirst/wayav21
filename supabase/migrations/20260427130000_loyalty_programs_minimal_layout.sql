-- AI-templated cards (Hello Kitty / Cyberpunk / Witcher / etc.) opt into a
-- credit-card-style wallet pass: just holder name + brand mark in the corner +
-- QR. No stamp counter, no reward labels, no shop label visible on the front.
-- Stamps still tracked in customer_passes; merchants see counts on the dashboard.
--
-- Existing merchant cards default to false, preserving the current stamp pass.
-- Safe to re-run.

ALTER TABLE public.loyalty_programs
  ADD COLUMN IF NOT EXISTS minimal_layout boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.loyalty_programs.minimal_layout IS
  'When true, apple-wallet-public and google-wallet-public emit a stripped pass: holder name + AI background + QR only. Set automatically when the merchant picks an admin-curated AI template in the Pass Designer.';
