-- Customer returns. The customer asks from their account, the admin approves
-- it in the dashboard, and Bosta books a "customer return pickup": the
-- courier collects the items and pays the customer the refund in cash.
-- Statuses are documented in src/lib/orderStatus.ts (RETURN_STATUSES).
ALTER TABLE public."Order"
  ADD COLUMN IF NOT EXISTS "returnStatus" text,
  ADD COLUMN IF NOT EXISTS "returnReason" text,
  ADD COLUMN IF NOT EXISTS "returnRequestedAt" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "refundAmount" numeric,
  ADD COLUMN IF NOT EXISTS "bostaReturnID" text,
  ADD COLUMN IF NOT EXISTS "bostaReturnTrackingNumber" text;

-- The Bosta webhook looks return pickups up by their delivery id.
CREATE INDEX IF NOT EXISTS "Order_bostaReturnID_idx"
  ON public."Order" ("bostaReturnID");
