import { describe, expect, it } from "vitest";

import { customerWhatsAppUrl, shopWhatsAppUrl } from "./whatsapp";

describe("shopWhatsAppUrl", () => {
  it("opens a chat with the shop", () => {
    expect(shopWhatsAppUrl()).toBe("https://wa.me/201031200143");
  });

  it("types the message in, encoded", () => {
    expect(
      shopWhatsAppUrl("Hello Qaf Coffee, I'd like to return order #00042."),
    ).toBe(
      "https://wa.me/201031200143?text=Hello%20Qaf%20Coffee%2C%20I'd%20like%20to%20return%20order%20%2300042.",
    );
  });
});

describe("customerWhatsAppUrl", () => {
  it("turns a local mobile number into Egypt's international form", () => {
    expect(customerWhatsAppUrl("01012345678")).toBe(
      "https://wa.me/201012345678",
    );
    expect(customerWhatsAppUrl("010 1234 5678")).toBe(
      "https://wa.me/201012345678",
    );
  });

  it.each(["", "0124048400", "+201012345678", "12345678901"])(
    "has no link for %j",
    (phone) => {
      expect(customerWhatsAppUrl(phone)).toBeNull();
    },
  );
});
