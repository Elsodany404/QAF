-- Why Bosta flagged a delivery (e.g. "Customer is not answering."), from
-- the webhook's exceptionReason. The dashboard shows it while the order has
-- a delivery issue.
ALTER TABLE public."Order"
  ADD COLUMN IF NOT EXISTS "bostaExceptionReason" text;
