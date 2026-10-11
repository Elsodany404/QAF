import { describe, expect, it } from "vitest";

import { makeOptionValue, makeProduct } from "@/test/fixtures";
import { calcPrice, formatDate, generateItemID } from "./helper";

describe("calcPrice", () => {
  it("applies percentage modifiers and rounds up to whole pounds", () => {
    const product = makeProduct({ price: 199 });
    const options = [
      makeOptionValue({ priceModifier: 0.5 }),
      makeOptionValue({ id: 11, priceModifier: 0.1 }),
    ];
    // 199 * 1.6 = 318.4 → 319
    expect(calcPrice(product, options)).toBe(319);
  });

  it("returns the base price without options", () => {
    expect(calcPrice(makeProduct({ price: 250 }), [])).toBe(250);
  });
});

it("generates a stable cart item id from product and values", () => {
  expect(generateItemID(7, [3, 9])).toBe("7:3:9");
});

it("formats dates as DD-MM-YYYY for Bosta", () => {
  expect(formatDate(new Date(2026, 0, 5))).toBe("05-01-2026");
});
