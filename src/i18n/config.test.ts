import { describe, expect, it } from "vitest";

import {
  isLocale,
  localeDirection,
  localizeHref,
  localizePath,
  pathLocale,
  preferredLocale,
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
  it("leaves English paths without a prefix", () => {
    expect(localizePath("en", "/menu")).toBe("/menu");
    expect(localizePath("en", "/")).toBe("/");
    expect(localizePath("en", "/sign-in?next=%2Fcheckout")).toBe(
      "/sign-in?next=%2Fcheckout",
    );
  });

  it("prefixes Arabic paths", () => {
    expect(localizePath("ar", "/menu")).toBe("/ar/menu");
    expect(localizePath("ar", "/")).toBe("/ar");
    expect(localizePath("ar", "/?category=turkish")).toBe(
      "/ar?category=turkish",
    );
    expect(localizePath("ar", "/policies#privacy-policy")).toBe(
      "/ar/policies#privacy-policy",
    );
    expect(localizePath("ar", "/products/3?x=1")).toBe("/ar/products/3?x=1");
  });

  it("moves a localized path to the other language", () => {
    expect(localizePath("en", "/ar/menu?x=1")).toBe("/menu?x=1");
    expect(localizePath("en", "/ar")).toBe("/");
    expect(localizePath("ar", "/ar/menu")).toBe("/ar/menu");
    expect(localizePath("ar", "/en/menu")).toBe("/ar/menu");
  });
});

describe("localizeHref", () => {
  it("only rewrites site paths", () => {
    expect(localizeHref("ar", "/contact")).toBe("/ar/contact");
    for (const href of [
      "https://wa.me/201031200143",
      "//cdn.example/x",
      "mailto:sales@qafcoffee.store",
      "tel:+201031200143",
      "#top",
    ]) {
      expect(localizeHref("ar", href)).toBe(href);
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

describe("preferredLocale", () => {
  it.each([
    ["ar-EG,ar;q=0.9,en-US;q=0.8,en;q=0.7", "ar"],
    ["en-US,en;q=0.9,ar;q=0.8", "en"],
    ["fr-FR,fr;q=0.9,ar;q=0.8,en;q=0.7", "ar"],
    // Weights decide, not the order they are written in.
    ["en;q=0.5,ar;q=0.9", "ar"],
    ["AR", "ar"],
    ["*", null],
    ["fr,de", null],
    ["", null],
    // q=0 means "not this language".
    ["ar;q=0,en;q=0.1", "en"],
    ["ar;q=abc,en", "en"],
  ])("%j → %s", (header, locale) => {
    expect(preferredLocale(header)).toBe(locale);
  });

  it("handles a missing header", () => {
    expect(preferredLocale(null)).toBeNull();
  });
});
