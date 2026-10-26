-- Returns and refunds are handled with the customer on WhatsApp; the site no
-- longer books Bosta return pickups or refunds through Paymob. Drop the
-- columns 20261024142108_order_returns.sql added (their index goes with
-- bostaReturnID).
ALTER TABLE public."Order"
  DROP COLUMN IF EXISTS "returnStatus",
  DROP COLUMN IF EXISTS "returnReason",
  DROP COLUMN IF EXISTS "returnRequestedAt",
  DROP COLUMN IF EXISTS "refundAmount",
  DROP COLUMN IF EXISTS "bostaReturnID",
  DROP COLUMN IF EXISTS "bostaReturnTrackingNumber";

-- "refunding" was only set while the site refunded through Paymob.
UPDATE public."Order"
SET "paymentStatus" = 'paid'
WHERE "paymentStatus" = 'refunding';
