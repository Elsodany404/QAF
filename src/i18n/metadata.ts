import type { Metadata } from "next";

import { DEFAULT_LOCALE, LOCALES, localizePath, type Locale } from "./config";

/**
 * Canonical and hreflang links for a page that exists in every language, so
 * search engines list each language's version of it.
 */
export function alternates(
  locale: Locale,
  path: string,
): Metadata["alternates"] {
  return {
    canonical: localizePath(locale, path),
    languages: {
      ...Object.fromEntries(
        LOCALES.map((other) => [other, localizePath(other, path)]),
      ),
      "x-default": localizePath(DEFAULT_LOCALE, path),
    },
  };
}
