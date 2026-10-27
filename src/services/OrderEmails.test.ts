import { describe, expect, it, vi } from "vitest";

import { makeOrder, makeProduct } from "@/test/fixtures";

vi.mock("@/supabase/admin", () => ({ default: {} }));

const { buildOrderConfirmationEmail } = await import("./OrderEmails");
const { escapeHtml } = await import("@/lib/email");

describe("buildOrderConfirmationEmail", () => {
  it("includes the order number, items, totals and tracking link", () => {
    const email = buildOrderConfirmationEmail(makeOrder(), "https://shop.test");

    expect(email.subject).toBe("Your Qaf Coffee order #00042 is confirmed");
    expect(email.text).toContain("House Blend (250g) × 2");
    expect(email.text).toContain("https://shop.test/en/user");
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

  it("writes to customers who ordered in Arabic in Arabic", () => {
    const order = makeOrder({ paymentMethod: "cash_on_delivery" });
    order.orderItems[0] = {
      ...order.orderItems[0],
      product: makeProduct({ nameAr: "خلطة البيت" }),
      options: [
        { id: 10, optionID: 100, label: "250g", labelAr: "250 جم" },
        { id: 6, optionID: 2, label: "Medium", labelAr: "وسط" },
      ],
    };

    const email = buildOrderConfirmationEmail(order, "https://shop.test", "ar");

    expect(email.subject).toBe("تم تأكيد طلبك #00042 من قهوة قاف");
    expect(email.text).toContain("مرحبًا Sara،");
    expect(email.text).toContain("- خلطة البيت (250 جم، وسط) × 2: 400 ج.م");
    expect(email.text).toContain("يُرجى تجهيز 460 ج.م عند وصول المندوب.");
    expect(email.text).toContain("الدفع: الدفع عند الاستلام");
    // The account page in Arabic.
    expect(email.text).toContain("https://shop.test/user");
    expect(email.text).not.toContain("/en/user");
    expect(email.html).toContain('dir="rtl"');
    expect(email.html).toContain("تتبّع طلبك");
    // Amounts line up on the left in a right-to-left table.
    expect(email.html).toContain("text-align:left;");
  });

  it("uses the name saved with the order in English", () => {
    const order = makeOrder();
    order.orderItems[0] = {
      ...order.orderItems[0],
      productName: "House Blend (old name)",
      product: makeProduct({ name: "House Blend", nameAr: "خلطة البيت" }),
    };

    const email = buildOrderConfirmationEmail(order, "https://shop.test");

    expect(email.text).toContain("- House Blend (old name) (250g) × 2");
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
