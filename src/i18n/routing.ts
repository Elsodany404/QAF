import {
  DEFAULT_LOCALE,
  isEnglishOnly,
  localizePath,
  pathLocale,
  routePath,
  stripLocale,
  type Locale,
} from "./config";

/*
 * Which page a request is served by (see src/proxy.ts). Every page lives
 * under app/[lang]:
 *   /...     Arabic, the default, served by /ar/... without showing it
 *   /en/...  English, served as it is
 *   /ar/...  redirected to /..., so each Arabic page has one address
 * Someone who switched to English (the cookie) is sent from a plain address
 * to the English one. The admin dashboard only exists in English, at its
 * plain address.
 */

export type RouteDecision =
  /** Send the browser to `path` (the query string is kept). */
  | { action: "redirect"; path: string }
  /** Serve `path` without changing the address in the browser. */
  | { action: "rewrite"; path: string; locale: Locale }
  /** Serve the requested page as it is. */
  | { action: "next"; locale: Locale; remember?: Locale };

export type RouteRequest = {
  pathname: string;
  method: string;
  /** The language cookie, if set. */
  savedLocale?: string;
};

export function routeRequest({
  pathname,
  method,
  savedLocale,
}: RouteRequest): RouteDecision {
  // Only page loads move people around: server actions POST to the page
  // they were called from and must reach it.
  const isPageLoad = method === "GET" || method === "HEAD";
  const prefix = pathLocale(pathname);
  const path = stripLocale(pathname);

  if (prefix === DEFAULT_LOCALE) {
    return isPageLoad
      ? { action: "redirect", path }
      : { action: "next", locale: DEFAULT_LOCALE };
  }

  if (prefix) {
    if (isEnglishOnly(path) && isPageLoad) {
      return { action: "redirect", path };
    }
    // Remembers the language of an English page someone opens, so the home
    // page they type in next time opens in English too.
    const remember =
      isPageLoad && savedLocale !== prefix ? prefix : undefined;
    return { action: "next", locale: prefix, remember };
  }

  if (isEnglishOnly(path)) {
    return { action: "rewrite", path: routePath("en", pathname), locale: "en" };
  }

  if (isPageLoad && savedLocale === "en") {
    return { action: "redirect", path: localizePath("en", pathname) };
  }

  return {
    action: "rewrite",
    path: routePath(DEFAULT_LOCALE, pathname),
    locale: DEFAULT_LOCALE,
  };
}
