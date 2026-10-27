import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { config, proxy } from "./proxy";

function request(
  path: string,
  { method = "GET", headers = {} }: { method?: string; headers?: Record<string, string> } = {},
) {
  return new NextRequest(`https://shop.test${path}`, { method, headers });
}

describe("proxy", () => {
  it("serves English addresses from the /en routes, unchanged in the browser", () => {
    const response = proxy(request("/menu?category=turkish"));

    expect(response.headers.get("x-middleware-rewrite")).toBe(
      "https://shop.test/en/menu?category=turkish",
    );
    // Server actions read the page's language from this request header.
    expect(response.headers.get("x-middleware-request-x-locale")).toBe("en");
  });

  it("serves Arabic pages as they are and remembers the language", () => {
    const response = proxy(request("/ar/products/3"));

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("x-middleware-request-x-locale")).toBe("ar");
    expect(response.cookies.get("NEXT_LOCALE")?.value).toBe("ar");
  });

  it("overwrites a language header sent by the client", () => {
    const response = proxy(
      request("/ar/checkout", { method: "POST", headers: { "x-locale": "en" } }),
    );
    expect(response.headers.get("x-middleware-request-x-locale")).toBe("ar");
  });

  it("redirects to the remembered language, keeping the query", () => {
    const response = proxy(
      request("/menu?search=x", { headers: { cookie: "NEXT_LOCALE=ar" } }),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://shop.test/ar/menu?search=x",
    );
  });

  it("gives each English page one address", () => {
    const response = proxy(request("/en/about"));
    expect(response.headers.get("location")).toBe("https://shop.test/about");
  });

  it("only runs on pages", () => {
    const [matcher] = config.matcher;
    const pattern = new RegExp(`^${matcher}$`);
    for (const path of ["/", "/menu", "/ar", "/ar/products/3", "/user"]) {
      expect(pattern.test(path), path).toBe(true);
    }
    for (const path of [
      "/api/auth/get-session",
      "/api/webhooks/paymob",
      "/_next/static/chunks/main.js",
      "/_vercel/insights/script.js",
      "/sitemap.xml",
      "/robots.txt",
      "/favicon.ico",
    ]) {
      expect(pattern.test(path), path).toBe(false);
    }
  });
});
