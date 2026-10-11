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
  ])("rejects %s", (value) => {
    expect(safeRedirectPath(value)).toBe("/user");
  });

  it("falls back when missing", () => {
    expect(safeRedirectPath(undefined, "/menu")).toBe("/menu");
  });
});

it("builds an encoded sign-in link", () => {
  expect(signInPath("/order-success/5")).toBe(
    "/sign-in?next=%2Forder-success%2F5",
  );
});
