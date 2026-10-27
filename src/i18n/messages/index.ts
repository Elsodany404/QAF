import "server-only";

import type { Locale } from "../config";
import ar from "./ar";
import en, { type Messages } from "./en";

export type { Messages };

const MESSAGES: Record<Locale, Messages> = { en, ar };

/**
 * All of a language's text, for server code. Client components get theirs
 * from I18nProvider instead, so the browser only downloads one language.
 */
export function getMessages(locale: Locale): Messages {
  return MESSAGES[locale];
}

/** The parts of the text client components use (see I18nProvider). */
const CLIENT_NAMESPACES = [
  "common",
  "language",
  "nav",
  "categories",
  "product",
  "cart",
  "menu",
  "checkout",
  "validation",
  "contactForm",
  "profile",
  "sidebar",
  "orderActions",
  "auth",
  "errorPage",
] as const satisfies readonly (keyof Messages)[];

export type ClientMessages = Pick<
  Messages,
  (typeof CLIENT_NAMESPACES)[number]
>;

export function clientMessages(messages: Messages): ClientMessages {
  return Object.fromEntries(
    CLIENT_NAMESPACES.map((namespace) => [namespace, messages[namespace]]),
  ) as ClientMessages;
}
