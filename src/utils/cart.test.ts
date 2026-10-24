import { describe, expect, it } from "vitest";

import { makeOptionValue, makeProduct } from "@/test/fixtures";
import type { Item } from "@/types/customTypes";
import {
  addToCart,
  applyCartRefresh,
  cartTotals,
  changeQuantity,
  restoreCart,
  toSecureCart,
} from "./cart";
import { MAX_CART_LINES, MAX_QUANTITY_PER_ITEM } from "./cartLimits";

function makeItem(overrides: Partial<Item> = {}): Item {
  const options = overrides.options ?? [
    makeOptionValue({ id: 10, optionID: 100 }),
  ];
  const product = overrides.product ?? makeProduct();
  return {
    itemID: `${product.id}:${options.map((o) => o.id).join(":")}`,
    product,
    options,
    quantity: 1,
    itemPrice: 200,
    ...overrides,
  };
}

/** n distinct cart lines (different products). */
const lines = (n: number) =>
  Array.from({ length: n }, (_, i) =>
    makeItem({ product: makeProduct({ id: i + 1 }) }),
  );

describe("restoreCart", () => {
  it("keeps a valid saved cart as it is", () => {
    const saved = [makeItem({ quantity: 3 })];
    expect(restoreCart(JSON.parse(JSON.stringify(saved)))).toEqual(saved);
  });

  it.each([null, undefined, "cart", 42, {}, { items: [] }])(
    "returns an empty cart for %j",
    (saved) => {
      expect(restoreCart(saved)).toEqual([]);
    },
  );

  it("drops entries that would crash the cart UI", () => {
    const valid = makeItem();
    const broken = [
      null,
      "item",
      { ...valid, itemID: 5 },
      { ...valid, product: null },
      { ...valid, product: { ...valid.product, name: undefined } },
      { ...valid, product: { ...valid.product, imageUrl: null } },
      { ...valid, options: "250g" },
      { ...valid, options: [{ label: "250g" }] },
      { ...valid, quantity: 0 },
      { ...valid, quantity: -1 },
      { ...valid, quantity: 1.5 },
      { ...valid, quantity: "2" },
      { ...valid, itemPrice: Number.NaN },
      { ...valid, itemPrice: "200" },
    ];
    expect(restoreCart([...broken, valid])).toEqual([valid]);
  });

  it("merges lines an older version saved twice for the same choice", () => {
    // Older itemIDs kept the values in the order they were picked.
    const options = [
      makeOptionValue({ id: 11, optionID: 100 }),
      makeOptionValue({ id: 20, optionID: 200 }),
    ];
    const cart = restoreCart([
      makeItem({ itemID: "1:20:11", options, quantity: 2 }),
      makeItem({
        itemID: "1:11:20",
        options: [...options].reverse(),
        quantity: 3,
      }),
    ]);

    expect(cart).toHaveLength(1);
    expect(cart[0]).toMatchObject({ itemID: "1:11:20", quantity: 5 });
  });

  it("keeps quantities and the number of lines within the cart limits", () => {
    const merged = restoreCart([
      makeItem({ quantity: 40 }),
      makeItem({ quantity: 40 }),
    ]);
    expect(merged[0].quantity).toBe(MAX_QUANTITY_PER_ITEM);

    expect(restoreCart([makeItem({ quantity: 999 })])[0].quantity).toBe(
      MAX_QUANTITY_PER_ITEM,
    );
    expect(restoreCart(lines(MAX_CART_LINES + 5))).toHaveLength(MAX_CART_LINES);
  });

  it("doesn't modify what it was given", () => {
    const saved = [makeItem({ quantity: 2 }), makeItem({ quantity: 3 })];
    const copy = structuredClone(saved);
    restoreCart(saved);
    expect(saved).toEqual(copy);
  });
});

describe("addToCart", () => {
  it("adds a new line", () => {
    const item = makeItem();
    expect(addToCart([], item)).toEqual({ cart: [item], result: "added" });
  });

  it("adds one more of an item that's already in the cart", () => {
    const { cart, result } = addToCart([makeItem({ quantity: 2 })], makeItem());
    expect(result).toBe("added");
    expect(cart).toHaveLength(1);
    expect(cart[0].quantity).toBe(3);
  });

  it("refuses more than the per-item limit", () => {
    const full = [makeItem({ quantity: MAX_QUANTITY_PER_ITEM })];
    expect(addToCart(full, makeItem())).toEqual({
      cart: full,
      result: "max_quantity",
    });
  });

  it("refuses a new line when the cart is full, but still tops up a line", () => {
    const full = lines(MAX_CART_LINES);
    const newProduct = makeItem({ product: makeProduct({ id: 999 }) });

    expect(addToCart(full, newProduct)).toEqual({
      cart: full,
      result: "cart_full",
    });
    expect(addToCart(full, full[0]).result).toBe("added");
  });

  it("doesn't modify the cart it was given", () => {
    const cart = [makeItem({ quantity: 2 })];
    addToCart(cart, makeItem());
    expect(cart[0].quantity).toBe(2);
  });
});

describe("changeQuantity", () => {
  const cart = [
    makeItem({ quantity: 2 }),
    makeItem({ product: makeProduct({ id: 2 }), itemID: "2:10", quantity: 1 }),
  ];

  it("changes only the chosen line", () => {
    const next = changeQuantity(cart, "1:10", 1);
    expect(next.map((i) => i.quantity)).toEqual([3, 1]);
    expect(cart.map((i) => i.quantity)).toEqual([2, 1]);
  });

  it("removes a line that reaches zero", () => {
    expect(changeQuantity(cart, "2:10", -1).map((i) => i.itemID)).toEqual([
      "1:10",
    ]);
  });

  it("caps at the per-item limit", () => {
    const atLimit = [makeItem({ quantity: MAX_QUANTITY_PER_ITEM })];
    expect(changeQuantity(atLimit, "1:10", 1)[0].quantity).toBe(
      MAX_QUANTITY_PER_ITEM,
    );
  });

  it("ignores unknown lines", () => {
    expect(changeQuantity(cart, "nope", 1)).toEqual(cart);
  });
});

describe("cartTotals", () => {
  it("adds up quantities and line totals", () => {
    expect(
      cartTotals([
        makeItem({ quantity: 2, itemPrice: 231 }),
        makeItem({ itemID: "x", quantity: 1, itemPrice: 462 }),
      ]),
    ).toEqual({ totalItems: 3, cartPrice: 924 });
  });

  it("is zero for an empty cart", () => {
    expect(cartTotals([])).toEqual({ totalItems: 0, cartPrice: 0 });
  });
});

describe("toSecureCart", () => {
  it("sends IDs and quantities only, never prices", () => {
    const item = makeItem({
      options: [
        makeOptionValue({ id: 11, optionID: 100 }),
        makeOptionValue({ id: 20, optionID: 200 }),
      ],
      quantity: 4,
      itemPrice: 1,
    });

    const [line] = toSecureCart([item]);

    expect(line).toEqual({
      productID: 1,
      optionsIDs: [100, 200],
      valuesIDs: [11, 20],
      quantity: 4,
    });
  });
});

describe("applyCartRefresh", () => {
  const stale = makeItem({ quantity: 2, itemPrice: 396 });
  const fresh: Item = {
    ...stale,
    product: makeProduct({ price: 165, name: "Espresso" }),
    quantity: 1, // the server's quantity is ignored
    itemPrice: 462,
  };

  it("shows today's price, keeping the customer's quantity", () => {
    const result = applyCartRefresh([stale], [stale], [fresh]);

    expect(result.cart).toEqual([
      { ...fresh, itemID: stale.itemID, quantity: 2 },
    ]);
    expect(result.repriced).toEqual([fresh]);
    expect(result.removed).toEqual([]);
  });

  it("removes lines that can't be ordered any more", () => {
    const other = makeItem({ product: makeProduct({ id: 2 }), itemID: "2:10" });

    const result = applyCartRefresh(
      [stale, other],
      [stale, other],
      [null, other],
    );

    expect(result.cart).toEqual([other]);
    expect(result.removed).toEqual([stale]);
    expect(result.repriced).toEqual([]);
  });

  it("leaves lines added while the refresh was running alone", () => {
    const added = makeItem({ product: makeProduct({ id: 3 }), itemID: "3:10" });

    const result = applyCartRefresh([stale, added], [stale], [fresh]);

    expect(result.cart.map((i) => i.itemID)).toEqual([stale.itemID, "3:10"]);
    expect(result.cart[1]).toBe(added);
  });

  it("uses the quantity the customer has now, not when it was sent", () => {
    const now = { ...stale, quantity: 5 };
    expect(applyCartRefresh([now], [stale], [fresh]).cart[0].quantity).toBe(5);
  });

  it("doesn't bring back a line removed while the refresh was running", () => {
    expect(applyCartRefresh([], [stale], [fresh]).cart).toEqual([]);
  });

  it("changes nothing when the answer doesn't match what was sent", () => {
    expect(applyCartRefresh([stale], [stale], [])).toEqual({
      cart: [stale],
      removed: [],
      repriced: [],
    });
  });

  it("doesn't report unchanged prices", () => {
    expect(applyCartRefresh([stale], [stale], [stale]).repriced).toEqual([]);
  });
});
