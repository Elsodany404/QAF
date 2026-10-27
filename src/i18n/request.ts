import "server-only";
import { headers } from "next/headers";
import { unstable_rethrow } from "next/navigation";

import { DEFAULT_LOCALE, isLocale, LOCALE_HEADER, type Locale } from "./config";
import { getMessages } from "./messages";

/**
 * The language of the page a server action was called from, as the proxy
 * recorded it. For server actions and route handlers; Server Components use
 * getLocale() from ./server. English when unknown.
 */
export async function getRequestLocale(): Promise<Locale> {
  try {
    const value = (await headers()).get(LOCALE_HEADER);
    return isLocale(value) ? value : DEFAULT_LOCALE;
  } catch (error) {
    unstable_rethrow(error);
    // Called outside a request (tests, scripts).
    return DEFAULT_LOCALE;
  }
}

/** The calling page's language and its server messages. */
export async function getRequestMessages() {
  const locale = await getRequestLocale();
  return { locale, m: getMessages(locale).server };
}
