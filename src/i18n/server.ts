import { notFound } from "next/navigation";
import { lang } from "next/root-params";

import { isLocale, localizeHref, type Locale } from "./config";
import { getMessages } from "./messages";

/*
 * The language of the page being rendered, for Server Components, layouts and
 * generateMetadata (everything under app/[lang]). Server actions use
 * ./request instead: root params aren't available there.
 */

export async function getLocale(): Promise<Locale> {
  const value = await lang();
  // Only reachable by addresses the proxy doesn't handle, e.g. "/x.png".
  if (!isLocale(value)) notFound();
  return value;
}

/** The page's language, its text, and a helper for links in it. */
export async function getI18n() {
  const locale = await getLocale();
  return {
    locale,
    t: getMessages(locale),
    href: (path: string) => localizeHref(locale, path),
  };
}
