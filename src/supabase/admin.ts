import "server-only";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

/*
 * Service-role client: bypasses row-level security, so server code must
 * authorize every request before using it. Typed with the generated schema,
 * so a wrong table or column name fails the type check.
 */
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  // A server client has no browser session to keep or refresh.
  { auth: { persistSession: false, autoRefreshToken: false } },
);
export default supabaseAdmin;
