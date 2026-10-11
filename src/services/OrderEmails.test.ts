import { describe, expect, it, vi } from "vitest";

import { makeOrder } from "@/test/fixtures";

vi.mock("@/supabase/admin", () => ({ default: {} }));

const { buildOrderConfirmationEmail } = await import("./OrderEmails");
const { escapeHtml } = await import("@/lib/email");

describe("buildOrderConfirmationEmail", () => {
  it("includes the order number, items, totals and tracking link", () => {
    const email = buildOrderConfirmationEmail(makeOrder(), "https://shop.test");

    expect(email.subject).toBe("Your Qaf Coffee order #00042 is confirmed");
    expect(email.text).toContain("House Blend (250g) × 2");
    expect(email.text).toContain("https://shop.test/user");
    expect(email.html).toContain("Track your order");
    expect(email.text).toContain("Your payment was received.");
  });

  it("tells cash-on-delivery customers how much to have ready", () => {
    const email = buildOrderConfirmationEmail(
      makeOrder({ paymentMethod: "cash_on_delivery" }),
      "https://shop.test",
    );
    expect(email.text).toContain("Please have");
    expect(email.text).toContain("460");
  });

  it("escapes customer-controlled text in the HTML", () => {
    const email = buildOrderConfirmationEmail(
      makeOrder({ customerName: "<script>alert(1)</script> Ali" }),
      "https://shop.test",
    );
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;");
  });
});

it("escapes all HTML special characters", () => {
  expect(escapeHtml(`<a href="x">'&'</a>`)).toBe(
    "&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;",
  );
});
