import { describe, expect, it, vi } from "vitest";

vi.mock("@/services/Product", () => ({
  getAllProducts: async () => [{ product: { id: 3 } }],
}));

const { default: sitemap } = await import("./sitemap");

describe("sitemap", () => {
  it("lists every public page in both languages, linked to each other", async () => {
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain("https://shop.test/");
    expect(urls).toContain("https://shop.test/en");
    expect(urls).toContain("https://shop.test/menu");
    expect(urls).toContain("https://shop.test/en/menu");
    expect(urls).toContain("https://shop.test/products/3");
    expect(urls).toContain("https://shop.test/en/products/3");

    const englishProduct = entries.find(
      (entry) => entry.url === "https://shop.test/en/products/3",
    );
    // Arabic, the default, is the version for everyone else.
    expect(englishProduct?.alternates?.languages).toEqual({
      en: "https://shop.test/en/products/3",
      ar: "https://shop.test/products/3",
      "x-default": "https://shop.test/products/3",
    });
  });
});
