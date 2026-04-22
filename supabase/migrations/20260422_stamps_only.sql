-- Waya is now a stamps-only, QR-only product. Force any legacy rows
-- (points / tiered / coupon programs, non-QR barcodes) onto the happy path
-- so the simplified edge functions never hit a case they no longer handle.

UPDATE loyalty_programs
SET loyalty_type = 'stamp'
WHERE loyalty_type <> 'stamp';

UPDATE loyalty_programs
SET barcode_type = 'QR'
WHERE barcode_type IS DISTINCT FROM 'QR';
