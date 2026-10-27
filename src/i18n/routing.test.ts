import { describe, expect, it } from "vitest";

import { routeRequest, type RouteRequest } from "./routing";

const ARABIC_BROWSER = "ar-EG,ar;q=0.9,en;q=0.8";
const ENGLISH_BROWSER = "en-US,en;q=0.9";

function route(overrides: Partial<RouteRequest>) {
  return routeRequest({
    pathname: "/",
    method: "GET",
    acceptLanguage: ENGLISH_BROWSER,
    ...overrides,
  });
}

describe("routeRequest", () => {
  it("serves English addresses from the /en routes", () => {
    expect(route({ pathname: "/menu" })).toEqual({
      action: "rewrite",
      path: "/en/menu",
      locale: "en",
    });
    expect(route({ pathname: "/" })).toEqual({
      action: "rewrite",
      path: "/en",
      locale: "en",
    });
    expect(route({ pathname: "/products/3" })).toMatchObject({
      path: "/en/products/3",
    });
  });

  it("serves Arabic addresses as they are", () => {
    expect(route({ pathname: "/ar/menu", savedLocale: "ar" })).toEqual({
      action: "next",
      locale: "ar",
      remember: undefined,
    });
  });

  it("remembers Arabic when someone opens an Arabic page", () => {
    expect(route({ pathname: "/ar/menu" })).toMatchObject({ remember: "ar" });
    expect(route({ pathname: "/ar", savedLocale: "en" })).toMatchObject({
      remember: "ar",
    });
  });

  it("gives every English page a single address", () => {
    expect(route({ pathname: "/en/menu" })).toEqual({
      action: "redirect",
      path: "/menu",
    });
    expect(route({ pathname: "/en" })).toEqual({
      action: "redirect",
      path: "/",
    });
  });

  it("sends people who last used Arabic to the Arabic page", () => {
    expect(route({ pathname: "/menu", savedLocale: "ar" })).toEqual({
      action: "redirect",
      path: "/ar/menu",
    });
    expect(route({ pathname: "/", savedLocale: "ar" })).toEqual({
      action: "redirect",
      path: "/ar",
    });
  });

  it("detects Arabic browsers on a first visit only", () => {
    expect(
      route({ pathname: "/contact", acceptLanguage: ARABIC_BROWSER }),
    ).toEqual({ action: "redirect", path: "/ar/contact" });
    // Picked English with the language switch: stays English.
    expect(
      route({
        pathname: "/contact",
        acceptLanguage: ARABIC_BROWSER,
        savedLocale: "en",
      }),
    ).toMatchObject({ action: "rewrite", locale: "en" });
    expect(route({ pathname: "/contact", acceptLanguage: null })).toMatchObject(
      { action: "rewrite" },
    );
  });

  it("ignores a cookie with an unknown language", () => {
    expect(
      route({ pathname: "/menu", savedLocale: "fr", acceptLanguage: null }),
    ).toMatchObject({ action: "rewrite", locale: "en" });
  });

  it("never redirects server actions", () => {
    // They POST to the page that called them.
    expect(
      route({ pathname: "/checkout", method: "POST", savedLocale: "ar" }),
    ).toEqual({ action: "rewrite", path: "/en/checkout", locale: "en" });
    expect(
      route({ pathname: "/ar/checkout", method: "POST", savedLocale: "en" }),
    ).toEqual({ action: "next", locale: "ar", remember: undefined });
    expect(route({ pathname: "/en/checkout", method: "POST" })).toEqual({
      action: "next",
      locale: "en",
    });
  });

  it("keeps the admin dashboard in English", () => {
    expect(route({ pathname: "/ar/admin/dashboard" })).toEqual({
      action: "redirect",
      path: "/admin/dashboard",
    });
    expect(
      route({
        pathname: "/admin/dashboard",
        savedLocale: "ar",
        acceptLanguage: ARABIC_BROWSER,
      }),
    ).toEqual({
      action: "rewrite",
      path: "/en/admin/dashboard",
      locale: "en",
    });
    // Not a prefix match on unrelated pages.
    expect(route({ pathname: "/administration", savedLocale: "ar" })).toEqual({
      action: "redirect",
      path: "/ar/administration",
    });
  });

  it("treats HEAD like GET", () => {
    expect(
      route({ pathname: "/menu", method: "HEAD", savedLocale: "ar" }),
    ).toEqual({ action: "redirect", path: "/ar/menu" });
  });
});
