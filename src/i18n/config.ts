/*
 * The languages the shop is available in. Arabic is the default and has the
 * plain addresses (/menu); English pages live under /en (/en/menu). Every
 * page is rendered by the app/[lang] routes: the proxy (src/proxy.ts) serves
 * the plain addresses from /ar/... without showing that prefix.
 *
 * Pure functions only, so it is safe to import anywhere.
 */

export const LOCALES = ["en", "ar"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ar";

/** The language a visitor last picked, for a year. */
export const LOCALE_COOKIE = "NEXT_LOCALE";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Set by the proxy on every page request. Server actions can't read route
 * params, so they read the language of the page that called them here.
 */
export const LOCALE_HEADER = "x-locale";

/** For Intl formatters. Arabic keeps Western digits, like prices and phones. */
export const INTL_LOCALE: Record<Locale, string> = {
  en: "en",
  ar: "ar-EG-u-nu-latn",
};

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" && (LOCALES as readonly string[]).includes(value)
  );
}

export function localeDirection(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

/** The language prefix a path starts with: "/en/menu" → "en", "/menu" → null. */
export function pathLocale(path: string): Locale | null {
  const firstSegment = path.split(/[/?#]/)[1];
  return isLocale(firstSegment) ? firstSegment : null;
}

/** A path without its language prefix: "/en/menu?x=1" → "/menu?x=1", "/en" → "/". */
export function stripLocale(path: string): string {
  const locale = pathLocale(path);
  if (!locale) return path;
  const rest = path.slice(locale.length + 1);
  return rest.startsWith("/") ? rest : `/${rest}`;
}

/**
 * The page a usePathname() value is showing, without its language. When a
 * page is prerendered it reports its /en or /ar route ("/en/menu") where the
 * browser reports the address ("/menu"), and Vercel's ISR re-render of the
 * home page reports "/index".
 */
export function pagePath(pathname: string): string {
  const path = stripLocale(pathname);
  return path === "/index" ? "/" : path;
}

/** Sections only made in English: the admin dashboard. */
const ENGLISH_ONLY = ["/admin"];

export function isEnglishOnly(path: string): boolean {
  const pathname = stripLocale(path).split(/[?#]/)[0];
  return ENGLISH_ONLY.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * The address of a site path in a language: localizePath("en", "/menu") is
 * "/en/menu"; Arabic, the default, has no prefix, and neither have the
 * English-only pages (the proxy serves those in English). A path that
 * already has a prefix is moved to the requested language, so this also
 * switches languages.
 */
export function localizePath(locale: Locale, path: string): string {
  const bare = stripLocale(path);
  if (locale === DEFAULT_LOCALE || isEnglishOnly(bare)) return bare;
  // "/" → "/en", "/?x=1" → "/en?x=1"
  return bare === "/" || /^\/[?#]/.test(bare)
    ? `/${locale}${bare.slice(1)}`
    : `/${locale}${bare}`;
}

/** Like localizePath, but leaves anything that isn't a site path alone. */
export function localizeHref(locale: Locale, href: string): string {
  return href.startsWith("/") && !href.startsWith("//")
    ? localizePath(locale, href)
    : href;
}

/**
 * The route that renders a site path in a language, e.g. "/ar/menu" for the
 * Arabic "/menu". It's what the proxy rewrites plain addresses to, and what
 * revalidatePath() needs.
 */
export function routePath(locale: Locale, path: string): string {
  const bare = stripLocale(path);
  return bare === "/" ? `/${locale}` : `/${locale}${bare}`;
}
