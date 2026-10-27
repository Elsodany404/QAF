import { beforeEach, describe, expect, it, vi } from "vitest";

import { createFakeSupabase } from "@/test/fakeSupabase";

const db = vi.hoisted(() => ({
  fake: null as ReturnType<typeof createFakeSupabase> | null,
}));
vi.mock("@/supabase/supabase", async () => {
  const { createFakeSupabase } = await import("@/test/fakeSupabase");
  db.fake = createFakeSupabase();
  return { supabase: db.fake.client };
});

const { getProductByID, getProducts } = await import("./Product");
const fake = () => db.fake!;

const row = (id: number) => ({
  id,
  name: `Blend ${id}`,
  description: "",
  category: "espresso",
  price: 100,
  imageUrl: "",
  "blurred-image": "",
  featured: false,
  inStock: true,
  ProductOptions: [],
});

beforeEach(() => fake().reset());

describe("getProducts", () => {
  it("lists every product without filters by default", async () => {
    fake().queue("Product", { data: [row(1), row(2)] });

    const products = await getProducts();

    expect(products.map((p) => p.product.id)).toEqual([1, 2]);
    expect(fake().queries[0].filters).toEqual([]);
  });

  it("filters by category and featured", async () => {
    fake().queue("Product", { data: [] });

    await getProducts({ category: "arabian & green blends", isFeatured: true });

    expect(fake().queries[0].filters).toEqual([
      ["eq", "category", "arabian & green blends"],
      ["eq", "featured", true],
    ]);
  });

  it("searches names and descriptions in both languages", async () => {
    fake().queue("Product", { data: [] }, { data: [] });

    await getProducts({ search: "  espresso  " });
    await getProducts({ search: "قهوة تركي" });

    expect(fake().queries[0].filters).toEqual([
      [
        "or",
        "name.ilike.%espresso%,description.ilike.%espresso%,nameAr.ilike.%espresso%,descriptionAr.ilike.%espresso%",
        undefined,
      ],
    ]);
    expect(fake().queries[1].filters[0][1]).toContain(
      "nameAr.ilike.%قهوة تركي%",
    );
  });

  it("strips characters that would add PostgREST filter clauses", async () => {
    fake().queue("Product", { data: [] });

    await getProducts({ search: "x%,price.lt.(1):*\\" });

    const [[, clause]] = fake().queries[0].filters;
    // Only the four intended clauses, and no wildcard from the customer.
    expect(String(clause).split(",")).toHaveLength(4);
    expect(clause).toBe(
      "name.ilike.%x  price lt  1%,description.ilike.%x  price lt  1%,nameAr.ilike.%x  price lt  1%,descriptionAr.ilike.%x  price lt  1%",
    );
  });

  it("caps the search at 100 characters and skips empty searches", async () => {
    fake().queue("Product", { data: [] }, { data: [] });

    await getProducts({ search: "a".repeat(500) });
    await getProducts({ search: " ,.() " });

    expect(fake().queries[0].filters[0][1]).toContain(`%${"a".repeat(100)}%`);
    expect(fake().queries[0].filters[0][1]).not.toContain("a".repeat(101));
    expect(fake().queries[1].filters).toEqual([]);
  });

  it("fails loudly instead of showing an empty shop", async () => {
    fake().queue("Product", { error: { message: "connection refused" } });
    await expect(getProducts()).rejects.toThrow("connection refused");
  });
});

describe("getProductByID", () => {
  it("loads one product", async () => {
    fake().queue("Product", { data: row(4) });

    expect((await getProductByID("4"))?.product.name).toBe("Blend 4");
    expect(fake().queries[0].filters).toEqual([["eq", "id", 4]]);
  });

  it("returns null for products that don't exist", async () => {
    fake().queue("Product", { data: null });
    expect(await getProductByID("4")).toBeNull();
  });

  it.each(["", "abc", "4.5", "-4", "4;drop", "1".repeat(16), " 4"])(
    "treats the ID %j as not found, without a query",
    async (id) => {
      expect(await getProductByID(id)).toBeNull();
      expect(fake().queries).toHaveLength(0);
    },
  );

  it("throws database errors", async () => {
    fake().queue("Product", { error: { message: "timeout" } });
    await expect(getProductByID("4")).rejects.toThrow("timeout");
  });
});
