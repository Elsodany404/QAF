import { describe, expect, it } from "vitest";

import { makeOptionValue, makeProduct } from "@/test/fixtures";
import { createRandom } from "@/test/random";
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
    // 199 * 1.5 * 1.1 = 328.35 → 329
    expect(calcPrice(product, options)).toBe(329);
  });

  it("compounds modifiers so a size change scales the other options too", () => {
    const product = makeProduct({ price: 165 });
    const arabica100 = makeOptionValue({ priceModifier: 0.4 });
    const size500g = makeOptionValue({ id: 11, priceModifier: 1 });
    expect(calcPrice(product, [arabica100])).toBe(231);
    // Double the 250g price, not 165 * (1 + 1 + 0.4) = 396
    expect(calcPrice(product, [arabica100, size500g])).toBe(462);
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

  it("treats a missing modifier as no change", () => {
    const value = makeOptionValue({
      priceModifier: undefined as unknown as number,
    });
    expect(calcPrice(makeProduct({ price: 250 }), [value])).toBe(250);
  });

  describe("the live Espresso product", () => {
    // Product 4: 165 EGP for 250g of 70% Arabica, with these modifiers.
    const espresso = makeProduct({ id: 4, name: "Espresso", price: 165 });
    const arabica = { "70%": 0, "80%": 0.25, "100%": 0.4 };
    const grind = { beans: 0, ground: 0 };
    const size = { "50g": -0.8, "100g": -0.6, "250g": 0, "500g": 1 };

    const price = (
      a: keyof typeof arabica,
      s: keyof typeof size,
      g: keyof typeof grind = "ground",
    ) =>
      calcPrice(espresso, [
        makeOptionValue({ id: 1, priceModifier: arabica[a] }),
        makeOptionValue({ id: 2, priceModifier: grind[g] }),
        makeOptionValue({ id: 3, priceModifier: size[s] }),
      ]);

    it.each([
      ["70%", "250g", 165],
      ["80%", "250g", 207], // 206.25
      ["100%", "250g", 231],
      ["70%", "500g", 330],
      ["80%", "500g", 413], // 412.5
      ["100%", "500g", 462],
      ["70%", "100g", 66],
      ["80%", "100g", 83], // 82.5
      ["100%", "100g", 93], // 92.4
      ["70%", "50g", 33],
      ["80%", "50g", 42], // 41.25
      ["100%", "50g", 47], // 46.2
    ] as const)("%s Arabica, %s costs %i EGP", (a, s, expected) => {
      expect(price(a, s)).toBe(expected);
    });

    it("charges 500g at twice the 250g price for every Arabica choice", () => {
      for (const a of Object.keys(arabica) as (keyof typeof arabica)[]) {
        // Rounding up each price separately can differ by at most 1 EGP.
        const difference = price(a, "500g") - 2 * price(a, "250g");
        expect(Math.abs(difference)).toBeLessThanOrEqual(1);
      }
      expect(price("100%", "500g")).toBe(2 * price("100%", "250g"));
    });

    it("doesn't charge extra for grinding", () => {
      expect(price("100%", "500g", "beans")).toBe(price("100%", "500g"));
    });
  });

  it("tolerates modifiers read back from the float4 database column", () => {
    // OptionValues.priceModifier is a `real`: 0.4 may come back as
    // 0.4000000059604645, -0.8 as -0.800000011920929.
    const product = makeProduct({ price: 165 });
    const f4 = (n: number) => Math.fround(n);
    expect(
      calcPrice(product, [
        makeOptionValue({ priceModifier: f4(0.4) }),
        makeOptionValue({ id: 11, priceModifier: f4(1) }),
      ]),
    ).toBe(462);
    expect(
      calcPrice(product, [makeOptionValue({ priceModifier: f4(-0.8) })]),
    ).toBe(33);
  });

  it("gives the same price whatever order the options come in", () => {
    // The storefront lists options by ID; the server prices them in the
    // order the browser sent them.
    const random = createRandom(4);
    for (let run = 0; run < 2000; run++) {
      const product = makeProduct({ price: random.int(1, 5000) });
      const values = Array.from({ length: random.int(1, 4) }, (_, i) =>
        makeOptionValue({ id: i + 1, priceModifier: random.modifier() }),
      );
      const expected = calcPrice(product, values);
      for (let shuffle = 0; shuffle < 3; shuffle++) {
        expect(calcPrice(product, random.shuffle(values))).toBe(expected);
      }
    }
  });

  it("rounds up to the next whole pound, never more", () => {
    const random = createRandom(7);
    for (let run = 0; run < 5000; run++) {
      const base = random.int(1, 5000);
      const modifiers = Array.from({ length: random.int(0, 3) }, () =>
        random.modifier(),
      );
      const exact = modifiers.reduce((p, m) => p * (1 + m), base);
      const price = calcPrice(
        makeProduct({ price: base }),
        modifiers.map((priceModifier, i) =>
          makeOptionValue({ id: i + 1, priceModifier }),
        ),
      );

      expect(Number.isInteger(price)).toBe(true);
      expect(price).toBeGreaterThanOrEqual(exact - 0.005);
      expect(price).toBeLessThan(exact + 1);
    }
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
