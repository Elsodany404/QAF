import { beforeEach, describe, expect, it, vi } from "vitest";

import { createFakeSupabase } from "@/test/fakeSupabase";
import { createRandom } from "@/test/random";
import { toDataItem } from "@/utils/constructAPI";
import { calcPrice } from "@/utils/helper";

const db = vi.hoisted(() => ({
  fake: null as ReturnType<typeof createFakeSupabase> | null,
}));
vi.mock("@/supabase/admin", async () => {
  const { createFakeSupabase } = await import("@/test/fakeSupabase");
  db.fake = createFakeSupabase();
  return { default: db.fake.client };
});

const { buildServerCart, repriceCart } = await import("./buildServerCart");
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

const item = (overrides: Record<string, unknown> = {}) => ({
  productID: 1,
  optionsIDs: [100],
  valuesIDs: [11],
  quantity: 2,
  ...overrides,
});

const value = (
  id: number,
  optionID: number,
  priceModifier: number,
  extra: Record<string, unknown> = {},
) => ({
  id,
  optionID,
  label: `value ${id}`,
  priceModifier,
  default: false,
  inStock: true,
  ...extra,
});

const option = (id: number, values: ReturnType<typeof value>[]) => ({
  optionID: {
    id,
    name: `option ${id}`,
    description: "",
    icon: "",
    OptionValues: values,
  },
});

/** Product 2: option 5 (values 50, 51) and option 6 (values 60, 61). */
const twoOptionRow = () =>
  productRow({
    id: 2,
    price: 100,
    ProductOptions: [
      option(5, [value(50, 5, 0), value(51, 5, 0.5)]),
      option(6, [value(60, 6, 0), value(61, 6, 0.2)]),
    ],
  });

// The live Espresso product (id 4) as Supabase returns it.
const ESPRESSO_VALUES = {
  "70%": 13,
  "80%": 14,
  "100%": 15,
  "50g": 20,
  "100g": 21,
  "250g": 22,
  "500g": 23,
} as const;

const espressoRow = () =>
  productRow({
    id: 4,
    name: "Espresso",
    price: 165,
    ProductOptions: [
      option(5, [value(14, 5, 0.25), value(15, 5, 0.4), value(13, 5, 0)]),
      option(7, [value(18, 7, 0), value(19, 7, 0)]),
      option(1, [
        value(20, 1, -0.8),
        value(21, 1, -0.6),
        value(22, 1, 0),
        value(23, 1, 1),
      ]),
    ],
  });

const espressoLine = (
  size: "50g" | "100g" | "250g" | "500g",
  arabica: "70%" | "80%" | "100%",
) => ({
  productID: 4,
  optionsIDs: [5, 7, 1],
  valuesIDs: [ESPRESSO_VALUES[arabica], 19, ESPRESSO_VALUES[size]],
  quantity: 1,
});

function randomProductRow(random: ReturnType<typeof createRandom>) {
  let nextValueID = 1;
  const options = Array.from({ length: random.int(1, 3) }, (_, i) => {
    const optionID = 100 + i;
    return option(
      optionID,
      Array.from({ length: random.int(1, 4) }, () =>
        value(nextValueID++, optionID, random.modifier()),
      ),
    );
  });
  return productRow({
    id: random.int(1, 1000),
    price: random.int(1, 3000),
    ProductOptions: random.shuffle(options),
  });
}

beforeEach(() => {
  fake().reset();
  vi.restoreAllMocks();
});

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

  it("compounds every option of the live Espresso product", async () => {
    fake().queue(
      "Product",
      { data: [espressoRow()] },
      { data: [espressoRow()] },
    );

    const [big, small] = [
      await buildServerCart([espressoLine("500g", "100%")]),
      await buildServerCart([espressoLine("250g", "100%")]),
    ];

    // 165 × 2 (500g) × 1.4 (100% Arabica); the old additive formula gave 396.
    expect(big).toMatchObject({ success: true, cart: [{ itemPrice: 462 }] });
    expect(small).toMatchObject({ success: true, cart: [{ itemPrice: 231 }] });
  });

  it("prices products without options at their base price", async () => {
    fake().queue("Product", { data: [productRow({ ProductOptions: [] })] });

    const result = await buildServerCart([
      item({ optionsIDs: [], valuesIDs: [] }),
    ]);

    expect(result).toMatchObject({
      success: true,
      cart: [{ itemPrice: 200, itemID: "1:", options: [] }],
    });
  });

  it.each([
    [
      "misses one of the product's options",
      { optionsIDs: [5], valuesIDs: [50] },
    ],
    ["adds an option the product doesn't have", { optionsIDs: [5, 6, 999] }],
    ["repeats an option", { optionsIDs: [5, 5, 6], valuesIDs: [50, 60] }],
    ["skips the value of an option", { valuesIDs: [50] }],
    ["picks two values of one option", { valuesIDs: [50, 51, 60] }],
    ["repeats a value", { valuesIDs: [50, 50] }],
    ["uses a value of another product", { valuesIDs: [50, 10] }],
  ])("rejects a line that %s", async (_, overrides) => {
    fake().queue("Product", { data: [twoOptionRow()] });

    const result = await buildServerCart([
      {
        productID: 2,
        optionsIDs: [5, 6],
        valuesIDs: [50, 60],
        quantity: 1,
        ...overrides,
      },
    ]);

    expect(result.success).toBe(false);
  });

  it("accepts the same choice listed in any order", async () => {
    fake().queue("Product", { data: [twoOptionRow()] });

    const result = await buildServerCart([
      { productID: 2, optionsIDs: [6, 5], valuesIDs: [61, 51], quantity: 1 },
    ]);

    // 100 × 1.5 × 1.2 = 180
    expect(result).toMatchObject({
      success: true,
      cart: [{ itemPrice: 180, itemID: "2:51:61" }],
    });
  });

  it("merges repeated lines for the same choice into one", async () => {
    fake().queue("Product", { data: [productRow()] });

    const result = await buildServerCart([
      item({ quantity: 2 }),
      item({ quantity: 3 }),
      item({ valuesIDs: [10], quantity: 1 }),
    ]);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.cart.map((line) => [line.itemID, line.quantity])).toEqual([
        ["1:11", 5],
        ["1:10", 1],
      ]);
    }
  });

  it("doesn't let repeated lines get around the per-item limit", async () => {
    const result = await buildServerCart([
      item({ quantity: 30 }),
      item({ quantity: 30 }),
    ]);

    expect(result).toEqual({
      success: false,
      error: "You can order up to 50 of one item",
    });
    expect(fake().queries).toHaveLength(0);
  });

  it.each([
    ["not an array", { productID: 1 }],
    ["a null line", [null]],
    ["a text line", ["1"]],
    ["a missing product ID", [{ optionsIDs: [], valuesIDs: [], quantity: 1 }]],
    ["a product ID of 0", [item({ productID: 0 })]],
    ["a negative product ID", [item({ productID: -1 })]],
    ["a product ID as text", [item({ productID: "1" })]],
    ["a fractional product ID", [item({ productID: 1.5 })]],
    ["options that aren't a list", [item({ optionsIDs: "100" })]],
    ["values that aren't a list", [item({ valuesIDs: null })]],
    ["an option ID of 0", [item({ optionsIDs: [0] })]],
    ["a value ID as text", [item({ valuesIDs: ["11"] })]],
    ["a quantity as text", [item({ quantity: "2" })]],
    ["an infinite quantity", [item({ quantity: Infinity })]],
  ])("rejects %s without querying the database", async (_, cart) => {
    const result = await buildServerCart(cart as never);

    expect(result.success).toBe(false);
    expect(fake().queries).toHaveLength(0);
  });

  it("rejects more lines than a cart can hold", async () => {
    const cart = Array.from({ length: 31 }, (_, i) =>
      item({ productID: i + 1 }),
    );

    expect(await buildServerCart(cart)).toEqual({
      success: false,
      error: "Too many items in the cart",
    });
    expect(fake().queries).toHaveLength(0);
  });

  it("rejects an empty cart", async () => {
    expect(await buildServerCart([])).toEqual({
      success: false,
      error: "Your cart is empty",
    });
  });

  it("asks the customer to retry when the products can't be loaded", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fake().queue("Product", { error: { message: "timeout" } });

    expect(await buildServerCart([item()])).toEqual({
      success: false,
      error: "We couldn't load your cart's products. Please try again.",
    });
  });

  it("charges exactly what the storefront shows, for any product", async () => {
    // Generated catalogs: 1-3 options with 1-4 values each, random prices
    // and modifiers. The product page prices the chosen values in option
    // order; checkout sends them back and the server re-prices them.
    const random = createRandom(2026);

    for (let run = 0; run < 3000; run++) {
      const row = randomProductRow(random);
      const storefront = toDataItem(row as never);
      const chosen = storefront.options.map((option) =>
        random.pick(option.values),
      );
      fake().reset();
      fake().queue("Product", { data: [row] });

      const result = await buildServerCart([
        {
          productID: row.id,
          optionsIDs: chosen.map((value) => value.optionID),
          valuesIDs: chosen.map((value) => value.id),
          quantity: 1,
        },
      ]);

      const shown = calcPrice(storefront.product, chosen);
      if (shown > 0) {
        expect(result).toMatchObject({
          success: true,
          cart: [{ itemPrice: shown }],
        });
      } else {
        // -99% twice on a 1 EGP product: rounds to nothing, never sold free.
        expect(result.success).toBe(false);
      }
    }
  });
});

describe("repriceCart", () => {
  it("re-prices each line with today's product data", async () => {
    fake().queue("Product", {
      data: [productRow({ price: 300, name: "House Blend (new bag)" })],
    });

    const result = await repriceCart([item(), item({ valuesIDs: [10] })]);

    // 300 × 1.9 = 570
    expect(result).toMatchObject([
      {
        itemPrice: 570,
        quantity: 2,
        product: { name: "House Blend (new bag)" },
      },
      { itemPrice: 300 },
    ]);
  });

  it("marks only the lines that can't be ordered any more", async () => {
    fake().queue("Product", { data: [productRow()] });

    const result = await repriceCart([
      item({ valuesIDs: [12] }), // 1kg is sold out
      item({ productID: 99 }), // product deleted
      item(),
    ]);

    expect(result).toHaveLength(3);
    expect(result?.[0]).toBeNull();
    expect(result?.[1]).toBeNull();
    expect(result?.[2]).toMatchObject({ itemPrice: 380 });
  });

  it("drops every line of a product that went out of stock", async () => {
    fake().queue("Product", { data: [productRow({ inStock: false })] });
    expect(await repriceCart([item()])).toEqual([null]);
  });

  it("returns nothing to change for an empty cart, without a query", async () => {
    expect(await repriceCart([])).toEqual([]);
    expect(fake().queries).toHaveLength(0);
  });

  it("gives up on malformed carts and database errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await repriceCart([item({ quantity: 0 })])).toBeNull();
    expect(await repriceCart(null as never)).toBeNull();
    expect(fake().queries).toHaveLength(0);

    fake().queue("Product", { error: { message: "down" } });
    expect(await repriceCart([item()])).toBeNull();
  });
});
