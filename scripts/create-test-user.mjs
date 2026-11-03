/*
 * Creates (or resets) the shared test-build account from src/lib/testBuild.ts:
 * already verified, with role "user", and the password shown on the sign-in
 * page. Safe to run again: it only touches that one account.
 *
 *   npm run create-test-user
 *
 * Needs SUPABASE_CONNECTION_STRING (read from .env.local / .env).
 */
import { randomUUID } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { hashPassword } from "better-auth/crypto";
import pg from "pg";

// Keep in sync with TEST_ACCOUNT in src/lib/testBuild.ts.
const TEST_ACCOUNT = {
  name: "Qaf Tester",
  email: "tester@qafcoffee.test",
  password: "QafTest2026",
};

for (const file of [".env.local", ".env"]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

const connectionString = process.env.SUPABASE_CONNECTION_STRING;
if (!connectionString) {
  console.error("SUPABASE_CONNECTION_STRING is not set.");
  process.exit(1);
}

const client = new pg.Client({ connectionString });
await client.connect();

try {
  await client.query("BEGIN");
  const password = await hashPassword(TEST_ACCOUNT.password);

  const existing = await client.query(
    `SELECT id FROM public."user" WHERE lower(email) = $1`,
    [TEST_ACCOUNT.email],
  );
  let userID = existing.rows[0]?.id;

  if (userID) {
    await client.query(
      `UPDATE public."user"
         SET name = $2, "emailVerified" = true, role = 'user', "updatedAt" = now()
       WHERE id = $1`,
      [userID, TEST_ACCOUNT.name],
    );
  } else {
    userID = randomUUID();
    await client.query(
      `INSERT INTO public."user" (id, name, email, "emailVerified", role)
       VALUES ($1, $2, $3, true, 'user')`,
      [userID, TEST_ACCOUNT.name, TEST_ACCOUNT.email],
    );
  }

  const updated = await client.query(
    `UPDATE public.account SET password = $2, "updatedAt" = now()
     WHERE "userId" = $1 AND "providerId" = 'credential'`,
    [userID, password],
  );
  if (updated.rowCount === 0) {
    await client.query(
      `INSERT INTO public.account (id, "accountId", "providerId", "userId", password, "updatedAt")
       VALUES ($1, $2, 'credential', $2, $3, now())`,
      [randomUUID(), userID, password],
    );
  }

  await client.query("COMMIT");
  console.log(`Test account ready: ${TEST_ACCOUNT.email} / ${TEST_ACCOUNT.password}`);
} catch (error) {
  await client.query("ROLLBACK");
  console.error("Could not create the test account:", error);
  process.exitCode = 1;
} finally {
  await client.end();
}
