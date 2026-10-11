import { beforeEach, describe, expect, it, vi } from "vitest";

import { createFakeSupabase } from "@/test/fakeSupabase";

const db = vi.hoisted(() => ({
  fake: null as ReturnType<typeof createFakeSupabase> | null,
}));
vi.mock("@/supabase/admin", async () => {
  const { createFakeSupabase } = await import("@/test/fakeSupabase");
  db.fake = createFakeSupabase();
  return { default: db.fake.client };
});

const { buildServerCart } = await import("./buildServerCart");
const fake = () => db.fake!;

// Product row as returned by the nested Supabase select.
function productRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: "House Blend",
    description: "",
    category: "espresso",
    price: 200,
    imageUrl: "",
    "blurred-image": "",
    featured: false,
    inStock: true,
    ProductOptions: [
      {
        optionID: {
          id: 100,
          name: "Size",
          description: "",
          icon: "",
          OptionValues: [
            {
              id: 10,
              optionID: 100,
              label: "250g",
              priceModifier: 0,
              default: true,
              inStock: true,
            },
            {
              id: 11,
              optionID: 100,
              label: "500g",
              priceModifier: 0.9,
              default: false,
              inStock: true,
            },
            {
              id: 12,
              optionID: 100,
              label: "1kg",
              priceModifier: 1.7,
              default: false,
              inStock: false,
            },
          ],
        },
      },
    ],
    ...overrides,
  };
}

const item = (overrides = {}) => ({
  productID: 1,
  optionsIDs: [100],
  valuesIDs: [11],
  quantity: 2,
  ...overrides,
});

beforeEach(() => fake().reset());

describe("buildServerCart", () => {
  it("prices items from the database, ignoring anything the client sent", async () => {
    fake().queue("Product", { data: [productRow()] });

    const result = await buildServerCart([item()]);

    expect(result).toMatchObject({ success: true });
    if (result.success) {
      // 200 * (1 + 0.9) = 380, rounded up like the storefront
      expect(result.cart[0].itemPrice).toBe(380);
      expect(result.cart[0].quantity).toBe(2);
    }
  });

  it("rejects quantities outside the allowed range before hitting the DB", async () => {
    expect(await buildServerCart([item({ quantity: 0 })])).toMatchObject({
      success: false,
    });
    expect(await buildServerCart([item({ quantity: 51 })])).toMatchObject({
      success: false,
    });
    expect(await buildServerCart([item({ quantity: 1.5 })])).toMatchObject({
      success: false,
    });
    expect(fake().queries).toHaveLength(0);
  });

  it("rejects out-of-stock products and option values", async () => {
    fake().queue("Product", { data: [productRow({ inStock: false })] });
    expect(await buildServerCart([item()])).toMatchObject({
      success: false,
      error: expect.stringContaining("out of stock"),
    });

    fake().queue("Product", { data: [productRow()] });
    expect(await buildServerCart([item({ valuesIDs: [12] })])).toMatchObject({
      success: false,
      error: expect.stringContaining("out of stock"),
    });
  });

  it("rejects values that don't belong to the product", async () => {
    fake().queue("Product", { data: [productRow()] });
    expect(await buildServerCart([item({ valuesIDs: [999] })])).toMatchObject({
      success: false,
    });
  });

  it("requires exactly one value per option", async () => {
    fake().queue("Product", { data: [productRow()] });
    expect(
      await buildServerCart([item({ valuesIDs: [10, 11] })]),
    ).toMatchObject({ success: false });
  });

  it("rejects products that no longer exist", async () => {
    fake().queue("Product", { data: [] });
    expect(await buildServerCart([item()])).toMatchObject({
      success: false,
      error: "One or more products are no longer available",
    });
  });
});
