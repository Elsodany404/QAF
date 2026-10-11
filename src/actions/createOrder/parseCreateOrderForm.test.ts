import { describe, expect, it } from "vitest";

import { parseCreateOrderForm } from "./parseCreateOrderForm";

function form(overrides: Record<string, string | null> = {}) {
  const values: Record<string, string | null> = {
    paymentMethod: "cash_on_delivery",
    name: "  Sara Ahmed ",
    email: "sara@example.com",
    phone: "01000000000",
    city: "Cairo",
    cityID: "c1",
    district: "Maadi",
    districtID: "d1",
    street: "9 Road",
    apartment: "4",
    secureCart: JSON.stringify([
      { productID: 1, optionsIDs: [100], valuesIDs: [10], quantity: 1 },
    ]),
    ...overrides,
  };
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) {
    if (value !== null) data.append(key, value);
  }
  return data;
}

describe("parseCreateOrderForm", () => {
  it("parses and trims a valid form", () => {
    const result = parseCreateOrderForm(form());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.customerName).toBe("Sara Ahmed");
      expect(result.data.secureCart).toHaveLength(1);
    }
  });

  it("rejects unknown payment methods", () => {
    expect(parseCreateOrderForm(form({ paymentMethod: "bitcoin" }))).toEqual({
      success: false,
      error: "Invalid order form data",
    });
  });

  it("rejects invalid emails and blank fields", () => {
    expect(parseCreateOrderForm(form({ email: "nope" })).success).toBe(false);
    expect(parseCreateOrderForm(form({ street: "   " })).success).toBe(false);
    expect(parseCreateOrderForm(form({ phone: null })).success).toBe(false);
  });

  it("rejects a missing, malformed or empty cart", () => {
    expect(parseCreateOrderForm(form({ secureCart: null }))).toMatchObject({
      error: "Cart is missing",
    });
    expect(parseCreateOrderForm(form({ secureCart: "{oops" }))).toMatchObject({
      error: "Invalid cart data",
    });
    expect(parseCreateOrderForm(form({ secureCart: "[]" }))).toMatchObject({
      error: "Invalid cart structure",
    });
  });
});
