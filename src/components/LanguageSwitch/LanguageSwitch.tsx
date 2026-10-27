"use client";

import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Languages } from "lucide-react";

import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  localizePath,
  pagePath,
  type Locale,
} from "@/i18n/config";
import { useI18n } from "@/i18n/I18nProvider";

type Props = { className?: string };

/** The current query in the other language: ?next= paths move along. */
function switchQuery(search: string, locale: Locale) {
  const params = new URLSearchParams(search);
  const next = params.get("next");
  if (next?.startsWith("/")) params.set("next", localizePath(locale, next));
  const query = params.toString();
  return query ? `?${query}` : "";
}

// The proxy reads it: English addresses stay English from now on (and the
// other way round).
function rememberLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
}

/**
 * A plain link, not next/link: the whole page reloads, since the layout's
 * direction and fonts change with the language.
 */
function LanguageLink({ className, search }: Props & { search: string }) {
  const { locale, t } = useI18n();
  const pathname = usePathname();
  const other: Locale = locale === "ar" ? "en" : "ar";
  const href = `${localizePath(other, pagePath(pathname))}${switchQuery(search, other)}`;

  return (
    <a
      href={href}
      hrefLang={other}
      title={t.language.switchLabel}
      className={className}
      onClick={(event) => {
        rememberLocale(other);
        // Stay at the same section of the page.
        event.currentTarget.hash = window.location.hash;
      }}
      onAuxClick={() => rememberLocale(other)}
    >
      <Languages aria-hidden="true" />
      <span lang={other}>{t.language.other}</span>
    </a>
  );
}

function LanguageLinkWithQuery({ className }: Props) {
  const searchParams = useSearchParams();
  return <LanguageLink className={className} search={searchParams.toString()} />;
}

/**
 * Opens the same page in the other language, keeping the query (menu
 * filters, password-reset tokens). Prerendered pages don't know the query,
 * hence the Suspense boundary.
 */
export default function LanguageSwitch({ className }: Props) {
  return (
    <Suspense fallback={<LanguageLink className={className} search="" />}>
      <LanguageLinkWithQuery className={className} />
    </Suspense>
  );
}
