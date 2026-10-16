import { describe, expect, it } from "vitest";

import { makeOptionValue, makeProduct } from "@/test/fixtures";
import {
  calcPrice,
  categoryLabel,
  formatCurrency,
  formatDate,
  generateItemID,
} from "./helper";

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

  it("doesn't round floating-point noise up to an extra pound", () => {
    const product = makeProduct({ price: 200 });
    // 200 * (1 + 0.1) === 220.00000000000003 in floating point
    expect(calcPrice(product, [makeOptionValue({ priceModifier: 0.1 })])).toBe(
      220,
    );
  });

  it("returns the base price without options", () => {
    expect(calcPrice(makeProduct({ price: 250 }), [])).toBe(250);
  });
});

describe("generateItemID", () => {
  it("generates a stable cart item id from product and values", () => {
    expect(generateItemID(7, [3, 9])).toBe("7:3:9");
  });

  it("doesn't depend on the order the values were picked in", () => {
    // Product cards and the product page list options in different orders;
    // the same choice must land on the same cart line.
    expect(generateItemID(7, [9, 3])).toBe(generateItemID(7, [3, 9]));
  });

  it("keeps the old format for products without options", () => {
    expect(generateItemID(7, [])).toBe("7:");
  });
});

it("formats dates as DD-MM-YYYY for Bosta", () => {
  expect(formatDate(new Date(2026, 0, 5))).toBe("05-01-2026");
});

describe("formatCurrency", () => {
  it("formats whole pounds with the currency code after the amount", () => {
    expect(formatCurrency(1250)).toBe("1,250 EGP");
    expect(formatCurrency(199.6)).toBe("200 EGP");
  });

  it("has no invisible direction marks", () => {
    expect(formatCurrency(30000)).not.toMatch(/[‎‏؜]/);
  });
});

it("labels categories for display", () => {
  expect(categoryLabel("turkish")).toBe("Turkish Coffee");
  expect(categoryLabel("arabian & green blends")).toBe("Arabian & Green Blends");
  expect(categoryLabel("seasonal")).toBe("seasonal");
  expect(categoryLabel(null)).toBe("");
});
