import { afterEach, describe, expect, it, vi } from "vitest";

import { getSiteUrl, siteUrl } from "./siteUrl";

afterEach(() => vi.unstubAllEnvs());

describe("getSiteUrl", () => {
  it("reads NEXT_PUBLIC_SITE_URL at call time, not build time", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://first.example");
    expect(getSiteUrl()).toBe("https://first.example");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://second.example");
    expect(getSiteUrl()).toBe("https://second.example");
  });

  it("drops trailing slashes", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000/");
    expect(getSiteUrl()).toBe("http://localhost:3000");
    expect(siteUrl("/api/webhooks/paymob")).toBe(
      "http://localhost:3000/api/webhooks/paymob",
    );
  });

  it("fails loudly when missing or invalid", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    expect(() => getSiteUrl()).toThrow("not configured");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "not a url");
    expect(() => getSiteUrl()).toThrow("not a valid URL");
  });
});
