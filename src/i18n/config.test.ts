import { describe, expect, it } from "vitest";

import {
  isLocale,
  localeDirection,
  localizeHref,
  localizePath,
  pathLocale,
  routePath,
  stripLocale,
} from "./config";

describe("isLocale", () => {
  it("accepts the supported languages only", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("ar")).toBe(true);
    for (const value of ["fr", "AR", "", "ar-EG", null, undefined, 1]) {
      expect(isLocale(value)).toBe(false);
    }
  });
});

describe("localeDirection", () => {
  it("is right-to-left for Arabic only", () => {
    expect(localeDirection("ar")).toBe("rtl");
    expect(localeDirection("en")).toBe("ltr");
  });
});

describe("pathLocale / stripLocale", () => {
  it.each([
    ["/ar/menu", "ar", "/menu"],
    ["/ar", "ar", "/"],
    ["/ar/", "ar", "/"],
    ["/ar?x=1", "ar", "/?x=1"],
    ["/ar#top", "ar", "/#top"],
    ["/en/products/3", "en", "/products/3"],
    ["/menu", null, "/menu"],
    ["/", null, "/"],
    // Only a whole first segment counts.
    ["/archive", null, "/archive"],
    ["/arabic/x", null, "/arabic/x"],
    ["/menu/ar", null, "/menu/ar"],
  ])("%s → %s, %s", (path, locale, bare) => {
    expect(pathLocale(path)).toBe(locale);
    expect(stripLocale(path)).toBe(bare);
  });
});

describe("localizePath", () => {
  it("leaves Arabic paths without a prefix", () => {
    expect(localizePath("ar", "/menu")).toBe("/menu");
    expect(localizePath("ar", "/")).toBe("/");
    expect(localizePath("ar", "/sign-in?next=%2Fcheckout")).toBe(
      "/sign-in?next=%2Fcheckout",
    );
  });

  it("prefixes English paths", () => {
    expect(localizePath("en", "/menu")).toBe("/en/menu");
    expect(localizePath("en", "/")).toBe("/en");
    expect(localizePath("en", "/?category=turkish")).toBe(
      "/en?category=turkish",
    );
    expect(localizePath("en", "/policies#privacy-policy")).toBe(
      "/en/policies#privacy-policy",
    );
    expect(localizePath("en", "/products/3?x=1")).toBe("/en/products/3?x=1");
  });

  it("keeps the English-only dashboard at its plain address", () => {
    expect(localizePath("en", "/admin/dashboard")).toBe("/admin/dashboard");
    expect(localizePath("ar", "/admin")).toBe("/admin");
  });

  it("moves a localized path to the other language", () => {
    expect(localizePath("ar", "/en/menu?x=1")).toBe("/menu?x=1");
    expect(localizePath("ar", "/en")).toBe("/");
    expect(localizePath("en", "/en/menu")).toBe("/en/menu");
    expect(localizePath("en", "/ar/menu")).toBe("/en/menu");
  });
});

describe("localizeHref", () => {
  it("only rewrites site paths", () => {
    expect(localizeHref("en", "/contact")).toBe("/en/contact");
    for (const href of [
      "https://wa.me/201031200143",
      "//cdn.example/x",
      "mailto:sales@qafcoffee.store",
      "tel:+201031200143",
      "#top",
    ]) {
      expect(localizeHref("en", href)).toBe(href);
    }
  });
});

describe("routePath", () => {
  it("names the [lang] route that renders a path", () => {
    expect(routePath("en", "/")).toBe("/en");
    expect(routePath("en", "/menu")).toBe("/en/menu");
    expect(routePath("ar", "/products/3")).toBe("/ar/products/3");
    expect(routePath("en", "/ar/user")).toBe("/en/user");
  });
});
