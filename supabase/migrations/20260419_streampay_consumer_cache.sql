-- Cache the StreamPay consumer id on the shop so a repeat checkout skips the
-- StreamPay createConsumer/listConsumers round-trip and never hits
-- DUPLICATE_CONSUMER errors.
alter table public.shops
  add column if not exists streampay_consumer_id text;
