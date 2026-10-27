"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { localizeHref, type Locale } from "./config";
import type { ClientMessages } from "./messages";

type I18n = {
  locale: Locale;
  t: ClientMessages;
  /** A site path in the page's language: "/menu" → "/ar/menu". */
  href: (path: string) => string;
};

const I18nContext = createContext<I18n | null>(null);

/** Set by the root layout with the page's language. */
export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: ClientMessages;
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({
      locale,
      t: messages,
      href: (path: string) => localizeHref(locale, path),
    }),
    [locale, messages],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** The page's language and text, for client components. */
export function useI18n(): I18n {
  const i18n = useContext(I18nContext);
  if (!i18n) {
    throw new Error("useI18n is used outside I18nProvider");
  }
  return i18n;
}
