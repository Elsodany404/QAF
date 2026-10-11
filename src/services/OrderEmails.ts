import { emailButton, emailLayout, escapeHtml, sendEmail } from "@/lib/email";
import { formatOrderNumber, isOnlinePayment } from "@/lib/orderStatus";
import { getSiteUrl } from "@/lib/siteUrl";
import { getOrderWithItems } from "@/services/Order";
import type { OrderQuery } from "@/types/customTypes";
import { formatCurrency } from "@/utils/helper";

/*
 * Server-only. Call once per order, at the moment it is confirmed:
 * right after checkout for cash on delivery, from the Paymob webhook for
 * online payments.
 */

function itemOptions(options: unknown): string {
  if (!Array.isArray(options)) return "";
  return options
    .map((o) =>
      typeof o === "object" && o !== null && "label" in o
        ? String((o as { label: unknown }).label)
        : "",
    )
    .filter(Boolean)
    .join(", ");
}

const PAYMENT_LABELS: Record<string, string> = {
  paymob_card: "Card (paid)",
  mobile_wallet: "Mobile wallet (paid)",
  cash_on_delivery: "Cash on delivery",
};

export function buildOrderConfirmationEmail(
  order: OrderQuery,
  siteUrl: string,
) {
  const orderNumber = formatOrderNumber(order.id);
  const firstName = order.customerName.trim().split(/\s+/)[0] || "there";
  const paymentLabel =
    PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod;
  const address = `${order.street}, ${order.apartment}, ${order.district}, ${order.city}`;
  const trackUrl = `${siteUrl}/user`;
  const paymentNote = isOnlinePayment(order.paymentMethod)
    ? "Your payment was received."
    : `Please have ${formatCurrency(order.totalPrice)} ready when the courier arrives.`;

  const subject = `Your Qaf Coffee order ${orderNumber} is confirmed`;

  const textLines = [
    `Hi ${firstName},`,
    "",
    `Thanks for your order! We've received order ${orderNumber} and we're preparing it now.`,
    paymentNote,
    "",
    ...order.orderItems.map((item) => {
      const options = itemOptions(item.options);
      return `- ${item.productName}${options ? ` (${options})` : ""} × ${item.quantity}: ${formatCurrency(item.totalPrice)}`;
    }),
    "",
    `Subtotal: ${formatCurrency(order.subTotal)}`,
    `Shipping: ${formatCurrency(order.shippingFees)}`,
    `Total: ${formatCurrency(order.totalPrice)}`,
    `Payment: ${paymentLabel}`,
    "",
    `Delivering to: ${address}`,
    "",
    `Track your order: ${trackUrl}`,
  ];

  const rows = order.orderItems
    .map((item) => {
      const options = itemOptions(item.options);
      return `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #f8efe0;">
          <strong>${escapeHtml(item.productName)}</strong>
          ${options ? `<br><span style="font-size:12px;color:#5b5876;">${escapeHtml(options)}</span>` : ""}
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #f8efe0;text-align:center;">× ${item.quantity}</td>
        <td style="padding:10px 0;border-bottom:1px solid #f8efe0;text-align:right;">${formatCurrency(item.totalPrice)}</td>
      </tr>`;
    })
    .join("");

  const summaryRow = (label: string, value: string, bold = false) =>
    `<tr><td colspan="2" style="padding:4px 0;${bold ? "font-weight:bold;" : "color:#5b5876;"}">${label}</td><td style="padding:4px 0;text-align:right;${bold ? "font-weight:bold;" : ""}">${value}</td></tr>`;

  const html = emailLayout(
    `Order ${orderNumber} confirmed`,
    `<p style="margin:0 0 8px;line-height:1.6;">Hi ${escapeHtml(firstName)}, thanks for your order! We're preparing it now.</p>
     <p style="margin:0 0 20px;line-height:1.6;">${escapeHtml(paymentNote)}</p>
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;border-collapse:collapse;">
       ${rows}
       ${summaryRow("Subtotal", formatCurrency(order.subTotal))}
       ${summaryRow("Shipping", formatCurrency(order.shippingFees))}
       ${summaryRow("Total", formatCurrency(order.totalPrice), true)}
       ${summaryRow("Payment", escapeHtml(paymentLabel))}
     </table>
     <p style="margin:20px 0 0;font-size:14px;line-height:1.6;"><strong>Delivering to</strong><br>${escapeHtml(order.customerName)}<br>${escapeHtml(address)}<br>${escapeHtml(order.customerPhone)}</p>
     ${emailButton(trackUrl, "Track your order")}`,
  );

  return { subject, text: textLines.join("\n"), html };
}

/** Never throws: a failed email must not fail checkout or a webhook. */
export async function sendOrderConfirmation(orderID: number): Promise<boolean> {
  try {
    const order = await getOrderWithItems(orderID);
    if (!order) return false;

    const email = buildOrderConfirmationEmail(order, getSiteUrl());
    return await sendEmail({ to: order.customerEmail, ...email });
  } catch (error) {
    console.error(`Order confirmation for ${orderID} failed:`, error);
    return false;
  }
}
