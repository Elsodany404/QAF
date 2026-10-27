import { describe, expect, it } from "vitest";

import { safeRedirectPath, signInPath } from "./redirect";

describe("safeRedirectPath", () => {
  it("allows same-site paths", () => {
    expect(safeRedirectPath("/checkout")).toBe("/checkout");
    expect(safeRedirectPath("/order-success/12?x=1")).toBe(
      "/order-success/12?x=1",
    );
  });

  it.each([
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "javascript:alert(1)",
    "",
    // Browsers drop tabs and newlines, which turns these into "//evil.example".
    "/\t/evil.example",
    "/\n/evil.example",
    "/\r\n/evil.example",
    "/\\\t\\evil.example",
    "\t//evil.example",
    "evil.example",
  ])("rejects %j", (value) => {
    expect(safeRedirectPath(value)).toBe("/user");
  });

  it("keeps the query and fragment", () => {
    expect(safeRedirectPath("/menu?category=espresso#top")).toBe(
      "/menu?category=espresso#top",
    );
  });

  it("returns the path the browser would actually open", () => {
    expect(safeRedirectPath("/a/../checkout")).toBe("/checkout");
    expect(safeRedirectPath("/%2F%2Fevil.example")).toBe("/%2F%2Fevil.example");
  });

  it("falls back when missing", () => {
    expect(safeRedirectPath(undefined, "/menu")).toBe("/menu");
    expect(safeRedirectPath(["/checkout"], "/menu")).toBe("/menu");
  });
});

it("builds an encoded sign-in link", () => {
  expect(signInPath("/order-success/5")).toBe(
    "/sign-in?next=%2Forder-success%2F5",
  );
});

it("keeps Arabic visitors on Arabic pages through sign-in", () => {
  expect(signInPath("/checkout", "ar")).toBe(
    "/ar/sign-in?next=%2Far%2Fcheckout",
  );
  // The way back is the page they came from, in their language.
  expect(safeRedirectPath("/ar/checkout")).toBe("/ar/checkout");
});
