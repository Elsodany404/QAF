-- Better Auth rate-limit counters (rateLimit.storage = "database").
-- Accessed only by the server over the direct Postgres connection.
CREATE TABLE IF NOT EXISTS public."rateLimit" (
  "id" text PRIMARY KEY,
  "key" text NOT NULL UNIQUE,
  "count" integer NOT NULL,
  "lastRequest" bigint NOT NULL
);

-- No policies: the public API keys can't read or write it.
ALTER TABLE public."rateLimit" ENABLE ROW LEVEL SECURITY;
