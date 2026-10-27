import "server-only";
import { headers } from "next/headers";
import { unstable_rethrow } from "next/navigation";

import { isLocale, LOCALE_HEADER, type Locale } from "./config";
import { getMessages } from "./messages";

/**
 * The language of the page a server action was called from, as the proxy
 * recorded it. For server actions and route handlers; Server Components use
 * getLocale() from ./server. English when unknown.
 */
export async function getRequestLocale(): Promise<Locale> {
  try {
    const value = (await headers()).get(LOCALE_HEADER);
    // Every page request goes through the proxy; without the header this
    // runs outside one (tests, scripts), where English is the safer bet.
    return isLocale(value) ? value : "en";
  } catch (error) {
    unstable_rethrow(error);
    return "en";
  }
}

/** The calling page's language and its server messages. */
export async function getRequestMessages() {
  const locale = await getRequestLocale();
  return { locale, m: getMessages(locale).server };
}
