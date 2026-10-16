-- The admin "Add product" form creates each product's option values, so two
-- products can both offer "250g". A unique label across the whole table made
-- adding any such product fail.
ALTER TABLE public."OptionValues"
  DROP CONSTRAINT IF EXISTS "ProductOptionValue_label_key";

-- rls_auto_enable() is an event-trigger helper. Nothing should call it over
-- the API (Supabase security advisor 0028 / 0029). PUBLIC is included because
-- anon and authenticated inherit its default EXECUTE grant.
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;

-- Cover the foreign keys used by the catalog and order queries
-- (performance advisor 0001).
CREATE INDEX IF NOT EXISTS "OptionValues_optionID_idx"
  ON public."OptionValues" ("optionID");
CREATE INDEX IF NOT EXISTS "ProductOptions_productID_idx"
  ON public."ProductOptions" ("productID");
CREATE INDEX IF NOT EXISTS "ProductOptions_optionID_idx"
  ON public."ProductOptions" ("optionID");
CREATE INDEX IF NOT EXISTS "OrderItem_productID_idx"
  ON public."OrderItem" ("productID");
