import "server-only";
import { randomUUID } from "node:crypto";
import { headers } from "next/headers";

import supabaseAdmin from "@/supabase/admin";

/*
 * A per-visitor limit for public forms that send email (the contact form).
 * Counters live in the database table Better Auth uses for its sign-in
 * limits, so they hold across server instances; keys are prefixed with the
 * form's name, so they never meet Better Auth's.
 */

async function clientIP() {
  const requestHeaders = await headers();
  return (
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

/**
 * True when this visitor may submit `name` again: at most `max` times until
 * they pause for `windowMs`. A database error lets the request through:
 * the limiter must never lock real customers out.
 */
export async function allowRequest(
  name: string,
  { max, windowMs }: { max: number; windowMs: number },
): Promise<boolean> {
  const key = `${name}|${await clientIP()}`;
  const now = Date.now();

  const { data: entry, error } = await supabaseAdmin
    .from("rateLimit")
    .select("id, count, lastRequest")
    .eq("key", key)
    .maybeSingle();
  if (error) {
    console.error("Rate limit check failed:", error.message);
    return true;
  }

  if (!entry) {
    await supabaseAdmin
      .from("rateLimit")
      .insert({ id: randomUUID(), key, count: 1, lastRequest: now });
    return true;
  }

  const fresh = now - entry.lastRequest > windowMs;
  if (!fresh && entry.count >= max) return false;

  await supabaseAdmin
    .from("rateLimit")
    .update({ count: fresh ? 1 : entry.count + 1, lastRequest: now })
    .eq("id", entry.id);
  return true;
}
