import { NextResponse, type NextRequest } from "next/server";

import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_HEADER,
  type Locale,
} from "@/i18n/config";
import { routeRequest } from "@/i18n/routing";

/** Language routing for every page; see src/i18n/routing.ts. */
export function proxy(request: NextRequest) {
  const decision = routeRequest({
    pathname: request.nextUrl.pathname,
    method: request.method,
    savedLocale: request.cookies.get(LOCALE_COOKIE)?.value,
  });

  if (decision.action === "redirect") {
    const url = request.nextUrl.clone();
    url.pathname = decision.path;
    return NextResponse.redirect(url);
  }

  // Tells server actions which language the calling page is in. Always
  // overwritten, so a client can't pick a value the URL disagrees with.
  const headers = new Headers(request.headers);
  headers.set(LOCALE_HEADER, decision.locale);

  if (decision.action === "rewrite") {
    const url = request.nextUrl.clone();
    url.pathname = decision.path;
    return NextResponse.rewrite(url, { request: { headers } });
  }

  const response = NextResponse.next({ request: { headers } });
  if (decision.remember) rememberLocale(response, decision.remember);
  return response;
}

function rememberLocale(response: NextResponse, locale: Locale) {
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax",
  });
}

export const config = {
  // Pages only: not API routes, Next.js internals or files such as
  // /sitemap.xml and /favicon.ico.
  matcher: ["/((?!api/|_next/|_vercel/|.*\\.[a-zA-Z0-9]+$).*)"],
};
