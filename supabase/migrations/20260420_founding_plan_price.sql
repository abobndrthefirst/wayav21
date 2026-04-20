-- Founding plan pricing: shift tier1 monthly to 85 SAR.
--
-- Why: landing page now shows a single "باقة التأسيس / Founding Plan" card
-- at 85 SAR. Clicking its CTA routes to /billing?plan=tier1_monthly which
-- the StreamPay checkout edge function validates against this table.
-- If the price row is out of sync with what the UI advertises, customers
-- would see a different amount at checkout.
--
-- After running this, re-run the streampay-sync-products edge function so
-- StreamPay's product catalog reflects the new amount.
update public.plans
   set price_sar = 85.00,
       streampay_product_id = null  -- force re-sync so StreamPay picks up new price
 where id = 'tier1_monthly';

-- Keep annual roughly in line with the 20% discount convention used at seed time
-- (85 * 12 * 0.8 = 816). Drop the streampay_product_id so sync re-creates it.
update public.plans
   set price_sar = 816.00,
       streampay_product_id = null
 where id = 'tier1_annual';
