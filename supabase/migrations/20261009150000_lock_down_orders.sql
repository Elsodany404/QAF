-- create_order is SECURITY DEFINER and trusts the prices it receives, so it
-- must only be callable from the server (service role), never with the public
-- anon/publishable key.
REVOKE EXECUTE ON FUNCTION public.create_order(
  text, text, text, text, text, text, text, text, text, text,
  numeric, numeric, text, jsonb
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_order(
  text, text, text, text, text, text, text, text, text, text,
  numeric, numeric, text, jsonb
) TO service_role;

-- Canonical status values (see src/lib/orderStatus.ts).
ALTER TABLE public."Order"
  ALTER COLUMN "paymentStatus" SET DEFAULT 'pending',
  ALTER COLUMN "shippingStatus" SET DEFAULT 'processing';

UPDATE public."Order"
SET "shippingStatus" = 'processing'
WHERE "shippingStatus" IN ('brewing', 'pending', 'created');

-- Webhooks look orders up by their Bosta delivery id.
CREATE INDEX IF NOT EXISTS "Order_bostaOrderID_idx"
  ON public."Order" ("bostaOrderID");
