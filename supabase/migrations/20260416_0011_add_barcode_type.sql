-- Add barcode_type column to loyalty_programs
-- Controls which barcode format is rendered on Apple/Google Wallet passes
begin;

alter table public.loyalty_programs
  add column if not exists barcode_type text not null default 'QR'
  check (barcode_type in ('QR', 'CODE128', 'AZTEC', 'PDF417', 'NONE'));

comment on column public.loyalty_programs.barcode_type is
  'Barcode format for wallet passes: QR, CODE128, AZTEC, PDF417, or NONE';

commit;
