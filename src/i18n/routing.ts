import {
  isEnglishOnly,
  isLocale,
  localizePath,
  pathLocale,
  preferredLocale,
  routePath,
  stripLocale,
  type Locale,
} from "./config";

/*
 * Which page a request is served by (see src/proxy.ts). Every page lives
 * under app/[lang]:
 *   /ar/...  Arabic, served as it is
 *   /...     English, served by /en/... without showing that prefix
 *   /en/...  redirected to /..., so each English page has one address
 * Someone whose last visit was in Arabic (the cookie), or whose browser
 * prefers Arabic on a first visit, is sent from an English address to the
 * Arabic one. The admin dashboard only exists in English.
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
  acceptLanguage: string | null;
};

export function routeRequest({
  pathname,
  method,
  savedLocale,
  acceptLanguage,
}: RouteRequest): RouteDecision {
  // Only page loads move people around: server actions POST to the page
  // they were called from and must reach it.
  const isPageLoad = method === "GET" || method === "HEAD";
  const prefix = pathLocale(pathname);
  const path = stripLocale(pathname);
  // Remembers the language of an Arabic page someone opens, so the home
  // page they type in next time opens in Arabic too.
  const remember = (locale: Locale) =>
    isPageLoad && savedLocale !== locale ? locale : undefined;

  if (prefix === "en") {
    return isPageLoad
      ? { action: "redirect", path }
      : { action: "next", locale: "en" };
  }

  if (prefix === "ar") {
    if (isEnglishOnly(path) && isPageLoad) {
      return { action: "redirect", path };
    }
    return { action: "next", locale: "ar", remember: remember("ar") };
  }

  if (isPageLoad && !isEnglishOnly(path)) {
    const wanted = isLocale(savedLocale)
      ? savedLocale
      : preferredLocale(acceptLanguage);
    if (wanted === "ar") {
      return { action: "redirect", path: localizePath("ar", pathname) };
    }
  }

  return { action: "rewrite", path: routePath("en", pathname), locale: "en" };
}
