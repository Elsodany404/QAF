import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { claimCartClear } from "./clearCartOnce";

function memoryStorage() {
  const items = new Map<string, string>();
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
    removeItem: (key: string) => void items.delete(key),
    items,
  };
}

let storage: ReturnType<typeof memoryStorage>;

beforeEach(() => {
  storage = memoryStorage();
  vi.stubGlobal("localStorage", storage);
});
afterEach(() => vi.unstubAllGlobals());

describe("claimCartClear", () => {
  it("empties the cart the first time an order's confirmation shows", () => {
    expect(claimCartClear(77)).toBe(true);
  });

  it("leaves a new cart alone when the same confirmation shows again", () => {
    // e.g. Back to the confirmation after adding items to a new cart
    claimCartClear(77);
    expect(claimCartClear(77)).toBe(false);
    expect(claimCartClear(77)).toBe(false);
  });

  it("tracks each order on its own", () => {
    claimCartClear(77);
    expect(claimCartClear(78)).toBe(true);
    expect(claimCartClear(77)).toBe(false);
  });

  it("only remembers the last 20 orders", () => {
    for (let id = 1; id <= 25; id++) claimCartClear(id);

    const saved = JSON.parse(storage.items.get("cartClearedForOrders")!);
    expect(saved).toEqual(Array.from({ length: 20 }, (_, i) => i + 6));
    expect(claimCartClear(25)).toBe(false);
  });

  it.each(["not json", '{"77":true}', '["77", null]'])(
    "starts over from broken saved data (%s)",
    (saved) => {
      storage.setItem("cartClearedForOrders", saved);
      expect(claimCartClear(77)).toBe(true);
      expect(claimCartClear(77)).toBe(false);
    },
  );

  it("empties the cart when the browser blocks storage", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new DOMException("denied", "SecurityError");
      },
    });
    expect(claimCartClear(77)).toBe(true);
  });
});
