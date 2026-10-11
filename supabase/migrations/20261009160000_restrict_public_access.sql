-- The app talks to Supabase in two ways:
--   * the service-role key on the server (orders, users, admin) — bypasses RLS
--   * the publishable key in the browser — only reads the product catalog
-- Auth is handled by Better Auth, not Supabase Auth, so no client should ever
-- reach these tables as anon/authenticated. Drop every policy except catalog
-- reads. RLS stays enabled, so tables without a policy deny all access.

-- Orders: were readable (customer PII) and insertable by anyone.
DROP POLICY IF EXISTS "Enable read access for all users" ON public."Order";
DROP POLICY IF EXISTS "Enable insert access for all users" ON public."Order";
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public."OrderItem";

-- Catalog: keep public reads, but nobody may add option values from a client.
DROP POLICY IF EXISTS "Enable insert access for all users" ON public."OptionValues";

-- Better Auth tables: managed on the server over a direct connection.
DROP POLICY IF EXISTS "enable update access for auth users" ON public."user";
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public."user";
DROP POLICY IF EXISTS "Enable read access for auth users" ON public."user";
