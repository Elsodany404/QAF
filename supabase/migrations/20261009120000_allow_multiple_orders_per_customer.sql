ALTER TABLE public."Order"
  DROP CONSTRAINT IF EXISTS "Order_customer_ID_key";

CREATE INDEX IF NOT EXISTS "Order_customer_ID_idx"
  ON public."Order" ("customer_ID");
