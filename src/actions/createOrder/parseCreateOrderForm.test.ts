import { describe, expect, it } from "vitest";

import { STREET_TOO_SHORT_MESSAGE } from "@/lib/bostaLocations";
import { FULL_NAME_MESSAGE } from "@/lib/fullName";
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

  it.each(["Sara", "  Sara  ", "S A", "Sara 2"])(
    "asks for a first and last name instead of %j",
    (name) => {
      expect(parseCreateOrderForm(form({ name }))).toEqual({
        success: false,
        error: FULL_NAME_MESSAGE,
      });
    },
  );

  it("accepts Arabic full names", () => {
    const result = parseCreateOrderForm(form({ name: " سارة أحمد " }));
    expect(result.success && result.data.customerName).toBe("سارة أحمد");
  });

  // Bosta refuses a delivery whose street line is 5 characters or fewer.
  it.each(["Nasr", "  12 St  ", "12345"])(
    "asks for the full street address instead of %j",
    (street) => {
      expect(parseCreateOrderForm(form({ street }))).toEqual({
        success: false,
        error: STREET_TOO_SHORT_MESSAGE,
      });
    },
  );

  it("explains problems in the checkout's language", () => {
    expect(parseCreateOrderForm(form({ street: "Nasr" }), "ar")).toEqual({
      success: false,
      error:
        "يُرجى إدخال عنوان الشارع كاملًا (6 أحرف على الأقل)، مثال: 12 شارع النصر",
    });
    expect(parseCreateOrderForm(form({ name: "سارة" }), "ar")).toEqual({
      success: false,
      error: "يُرجى إدخال اسمك بالكامل: الاسم الأول واسم العائلة",
    });
    expect(parseCreateOrderForm(form({ phone: "123" }), "ar")).toEqual({
      success: false,
      error: "يُرجى إدخال رقم موبايل مصري صحيح",
    });
    expect(parseCreateOrderForm(form({ email: null }), "ar")).toEqual({
      success: false,
      error: "بيانات الطلب غير صالحة",
    });
    // Same checks, English by default.
    expect(parseCreateOrderForm(form({ name: "Sara" }))).toEqual({
      success: false,
      error: FULL_NAME_MESSAGE,
    });
  });

  it("accepts a street long enough for Bosta", () => {
    const result = parseCreateOrderForm(form({ street: " 9 Road " }));
    expect(result.success && result.data.street).toBe("9 Road");
  });

  it("rejects invalid emails and blank fields", () => {
    expect(parseCreateOrderForm(form({ email: "nope" })).success).toBe(false);
    expect(parseCreateOrderForm(form({ street: "   " })).success).toBe(false);
    expect(parseCreateOrderForm(form({ phone: null })).success).toBe(false);
  });

  it("normalizes the phone and rejects numbers that aren't Egyptian mobiles", () => {
    // Browser autofill fills in the international +20 form.
    for (const phone of ["010 0000-0000", "+201000000000", "٠١٠٠٠٠٠٠٠٠٠"]) {
      const result = parseCreateOrderForm(form({ phone }));
      expect(result.success && result.data.customerPhone).toBe("01000000000");
    }

    for (const phone of ["0100000000", "02000000000", "+441000000000"]) {
      expect(parseCreateOrderForm(form({ phone }))).toEqual({
        success: false,
        error: "Please enter a valid Egyptian mobile number",
      });
    }
  });

  it.each([
    ["name", "x".repeat(101)],
    ["email", `${"x".repeat(250)}@a.co`],
    ["street", "x".repeat(201)],
    ["apartment", "x".repeat(101)],
    ["name", "   "],
    ["apartment", ""],
    ["cityID", " "],
  ])("rejects a %s that's blank or too long", (field, value) => {
    expect(parseCreateOrderForm(form({ [field]: value }))).toMatchObject({
      success: false,
    });
  });

  it.each(["paymentMethod", "email", "city", "districtID", "apartment"])(
    "rejects a form without %s",
    (field) => {
      expect(parseCreateOrderForm(form({ [field]: null }))).toEqual({
        success: false,
        error: "Invalid order form data",
      });
    },
  );

  it("rejects fields sent as files instead of text", () => {
    const data = form();
    data.set("name", new Blob(["Sara"]));
    expect(parseCreateOrderForm(data)).toMatchObject({ success: false });
  });

  it("rejects a cart that isn't a list", () => {
    expect(
      parseCreateOrderForm(form({ secureCart: '{"productID":1}' })),
    ).toMatchObject({ error: "Invalid cart structure" });
    expect(parseCreateOrderForm(form({ secureCart: "null" }))).toMatchObject({
      error: "Invalid cart structure",
    });
  });

  describe("expected total", () => {
    it("is optional", () => {
      const result = parseCreateOrderForm(form());
      expect(result.success && result.data.expectedTotal).toBeUndefined();
    });

    it("is read as a number", () => {
      const result = parseCreateOrderForm(form({ expectedTotal: "984.5" }));
      expect(result.success && result.data.expectedTotal).toBe(984.5);
    });

    it.each(["", " ", "abc", "-1", "Infinity", "1e400"])(
      "rejects %j",
      (expectedTotal) => {
        expect(parseCreateOrderForm(form({ expectedTotal }))).toEqual({
          success: false,
          error: "Invalid order form data",
        });
      },
    );
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
