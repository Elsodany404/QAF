import { describe, expect, it } from "vitest";

import { routeRequest, type RouteRequest } from "./routing";

function route(overrides: Partial<RouteRequest>) {
  return routeRequest({ pathname: "/", method: "GET", ...overrides });
}

describe("routeRequest", () => {
  it("serves plain addresses in Arabic, from the /ar routes", () => {
    expect(route({ pathname: "/menu" })).toEqual({
      action: "rewrite",
      path: "/ar/menu",
      locale: "ar",
    });
    expect(route({ pathname: "/" })).toEqual({
      action: "rewrite",
      path: "/ar",
      locale: "ar",
    });
    expect(route({ pathname: "/products/3" })).toMatchObject({
      path: "/ar/products/3",
    });
  });

  it("is Arabic for everyone who hasn't picked English", () => {
    expect(route({ pathname: "/contact", savedLocale: "ar" })).toMatchObject({
      action: "rewrite",
      locale: "ar",
    });
    // A cookie with a language the site doesn't have.
    expect(route({ pathname: "/contact", savedLocale: "fr" })).toMatchObject({
      action: "rewrite",
      locale: "ar",
    });
  });

  it("serves English addresses as they are", () => {
    expect(route({ pathname: "/en/menu", savedLocale: "en" })).toEqual({
      action: "next",
      locale: "en",
      remember: undefined,
    });
  });

  it("remembers English when someone opens an English page", () => {
    expect(route({ pathname: "/en/menu" })).toMatchObject({ remember: "en" });
    expect(route({ pathname: "/en", savedLocale: "ar" })).toMatchObject({
      remember: "en",
    });
  });

  it("gives every Arabic page a single address", () => {
    expect(route({ pathname: "/ar/menu" })).toEqual({
      action: "redirect",
      path: "/menu",
    });
    expect(route({ pathname: "/ar" })).toEqual({
      action: "redirect",
      path: "/",
    });
  });

  it("sends people who switched to English to the English page", () => {
    expect(route({ pathname: "/menu", savedLocale: "en" })).toEqual({
      action: "redirect",
      path: "/en/menu",
    });
    expect(route({ pathname: "/", savedLocale: "en" })).toEqual({
      action: "redirect",
      path: "/en",
    });
  });

  it("never redirects server actions", () => {
    // They POST to the page that called them.
    expect(
      route({ pathname: "/checkout", method: "POST", savedLocale: "en" }),
    ).toEqual({ action: "rewrite", path: "/ar/checkout", locale: "ar" });
    expect(
      route({ pathname: "/en/checkout", method: "POST", savedLocale: "ar" }),
    ).toEqual({ action: "next", locale: "en", remember: undefined });
    expect(route({ pathname: "/ar/checkout", method: "POST" })).toEqual({
      action: "next",
      locale: "ar",
    });
  });

  it("keeps the admin dashboard in English at its plain address", () => {
    expect(route({ pathname: "/admin/dashboard" })).toEqual({
      action: "rewrite",
      path: "/en/admin/dashboard",
      locale: "en",
    });
    expect(
      route({ pathname: "/admin/dashboard", savedLocale: "en" }),
    ).toMatchObject({ action: "rewrite", locale: "en" });
    expect(route({ pathname: "/en/admin/dashboard" })).toEqual({
      action: "redirect",
      path: "/admin/dashboard",
    });
    // Not a prefix match on unrelated pages.
    expect(route({ pathname: "/administration" })).toMatchObject({
      locale: "ar",
    });
  });

  it("treats HEAD like GET", () => {
    expect(
      route({ pathname: "/menu", method: "HEAD", savedLocale: "en" }),
    ).toEqual({ action: "redirect", path: "/en/menu" });
  });
});
