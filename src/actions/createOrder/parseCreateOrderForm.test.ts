import { describe, expect, it } from "vitest";

import { parseCreateOrderForm } from "./parseCreateOrderForm";

function form(overrides: Record<string, string | null> = {}) {
  const values: Record<string, string | null> = {
    paymentMethod: "cash_on_delivery",
    name: "  Sara Ahmed ",
    email: "sara@example.com",
    phone: "01000000000",
    // Real Bosta IDs from assets/data/bostaDistricts.json.
    city: "Cairo",
    cityID: "FceDyHXwpSYYF9zGW",
    district: "ElMaadi",
    districtID: "u4U-TSA_cG",
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

  it("normalizes the phone and rejects numbers that aren't Egyptian mobiles", () => {
    const result = parseCreateOrderForm(form({ phone: "010 0000-0000" }));
    expect(result.success && result.data.customerPhone).toBe("01000000000");

    for (const phone of ["0100000000", "02000000000", "+201000000000"]) {
      expect(parseCreateOrderForm(form({ phone }))).toEqual({
        success: false,
        error: "Please enter a valid Egyptian mobile number",
      });
    }
  });

  it("takes city and district names from the IDs, not from the client", () => {
    const result = parseCreateOrderForm(
      form({ city: "Aswan", district: "Somewhere cheap" }),
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.city).toBe("Cairo");
      expect(result.data.district).toBe("ElMaadi");
    }
  });

  it("rejects areas Bosta doesn't deliver to", () => {
    const outsideArea = {
      success: false,
      error: "We don't deliver to the selected area. Please choose another.",
    };
    // District from another city.
    expect(parseCreateOrderForm(form({ districtID: "mXyCN4PKukF" }))).toEqual(
      outsideArea,
    );
    // City without drop-off service.
    expect(parseCreateOrderForm(form({ cityID: "ZuCaDAVQlPT" }))).toEqual(
      outsideArea,
    );
    // District without drop-off service.
    expect(
      parseCreateOrderForm(
        form({ cityID: "Jrb6X6ucjiYgMP4T7", districtID: "RR9NTwvgZOxWhWO3CNqau" }),
      ),
    ).toEqual(outsideArea);
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
