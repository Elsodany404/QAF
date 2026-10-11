/*
 * The site's public address — the single source for every absolute URL the
 * app builds (auth email links, Paymob callbacks, order emails, allowed
 * origins). Set NEXT_PUBLIC_SITE_URL, e.g. "https://qafcoffee.store".
 *
 * Next.js replaces `process.env.NEXT_PUBLIC_*` with its build-time value —
 * even for a constant computed key. Reading it through Reflect.get with a
 * name assembled at runtime keeps the bundler from folding it, so the server
 * reads the live value: change the variable and restart, no rebuild needed.
 */

const SITE_URL_VAR = ["NEXT_PUBLIC", "SITE_URL"].join("_");

function readRuntimeEnv(name: string): string | undefined {
  const value: unknown = Reflect.get(process.env, name);
  return typeof value === "string" ? value : undefined;
}

/** e.g. "https://qafcoffee.store" — always without a trailing slash. */
export function getSiteUrl(): string {
  const raw = readRuntimeEnv(SITE_URL_VAR)?.trim();
  if (!raw) {
    throw new Error(`${SITE_URL_VAR} is not configured`);
  }

  try {
    return new URL(raw).origin;
  } catch {
    throw new Error(`${SITE_URL_VAR} is not a valid URL: "${raw}"`);
  }
}

/** Absolute URL for a path on this site, e.g. siteUrl("/user"). */
export function siteUrl(path = "/"): string {
  return new URL(path, `${getSiteUrl()}/`).toString();
}
