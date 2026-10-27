import "server-only";
import { productName } from "@/i18n/catalog";
import { localizePath, type Locale } from "@/i18n/config";
import { format } from "@/i18n/format";
import { getMessages } from "@/i18n/messages";
import { emailButton, emailLayout, escapeHtml, sendEmail } from "@/lib/email";
import { optionLabels } from "@/lib/orderItems";
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

/** The order confirmation, in the language the customer checked out in. */
export function buildOrderConfirmationEmail(
  order: OrderQuery,
  siteUrl: string,
  locale: Locale = "en",
) {
  const text = getMessages(locale).emails.orderConfirmation;
  const money = (amount: number) => formatCurrency(amount, locale);
  // The name saved with the order, or the product's Arabic name.
  const itemName = (item: OrderQuery["orderItems"][number]) =>
    locale === "ar" && item.product
      ? productName(item.product, locale)
      : item.productName;
  const itemOptions = (options: unknown) =>
    optionLabels(options, locale).join(locale === "ar" ? "، " : ", ");
  // Amounts line up on the end side of the table.
  const end = locale === "ar" ? "left" : "right";

  const orderNumber = formatOrderNumber(order.id);
  const firstName =
    order.customerName.trim().split(/\s+/)[0] || text.fallbackName;
  const paymentLabel =
    text.paymentMethods[
      order.paymentMethod as keyof typeof text.paymentMethods
    ] ?? order.paymentMethod;
  const address = `${order.street}, ${order.apartment}, ${order.district}, ${order.city}`;
  const trackUrl = `${siteUrl}${localizePath(locale, "/user")}`;
  const paymentNote = isOnlinePayment(order.paymentMethod)
    ? text.paid
    : format(text.payOnDelivery, { total: money(order.totalPrice) });

  const subject = format(text.subject, { number: orderNumber });

  const textLines = [
    format(text.greeting, { name: firstName }),
    "",
    format(text.received, { number: orderNumber }),
    paymentNote,
    "",
    ...order.orderItems.map((item) => {
      const options = itemOptions(item.options);
      return `- ${itemName(item)}${options ? ` (${options})` : ""} × ${item.quantity}: ${money(item.totalPrice)}`;
    }),
    "",
    `${text.subtotal}: ${money(order.subTotal)}`,
    `${text.shipping}: ${money(order.shippingFees)}`,
    `${text.total}: ${money(order.totalPrice)}`,
    `${text.payment}: ${paymentLabel}`,
    "",
    `${text.deliveringTo}: ${address}`,
    "",
    `${text.track}: ${trackUrl}`,
  ];

  const rows = order.orderItems
    .map((item) => {
      const options = itemOptions(item.options);
      return `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #f8efe0;">
          <strong>${escapeHtml(itemName(item))}</strong>
          ${options ? `<br><span style="font-size:12px;color:#5b5876;">${escapeHtml(options)}</span>` : ""}
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #f8efe0;text-align:center;">× ${item.quantity}</td>
        <td style="padding:10px 0;border-bottom:1px solid #f8efe0;text-align:${end};">${money(item.totalPrice)}</td>
      </tr>`;
    })
    .join("");

  const summaryRow = (label: string, value: string, bold = false) =>
    `<tr><td colspan="2" style="padding:4px 0;${bold ? "font-weight:bold;" : "color:#5b5876;"}">${escapeHtml(label)}</td><td style="padding:4px 0;text-align:${end};${bold ? "font-weight:bold;" : ""}">${value}</td></tr>`;

  const html = emailLayout(
    format(text.title, { number: orderNumber }),
    `<p style="margin:0 0 8px;line-height:1.6;">${escapeHtml(format(text.intro, { name: firstName }))}</p>
     <p style="margin:0 0 20px;line-height:1.6;">${escapeHtml(paymentNote)}</p>
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;border-collapse:collapse;">
       ${rows}
       ${summaryRow(text.subtotal, money(order.subTotal))}
       ${summaryRow(text.shipping, money(order.shippingFees))}
       ${summaryRow(text.total, money(order.totalPrice), true)}
       ${summaryRow(text.payment, escapeHtml(paymentLabel))}
     </table>
     <p style="margin:20px 0 0;font-size:14px;line-height:1.6;"><strong>${escapeHtml(text.deliveringTo)}</strong><br>${escapeHtml(order.customerName)}<br>${escapeHtml(address)}<br><span dir="ltr">${escapeHtml(order.customerPhone)}</span></p>
     ${emailButton(trackUrl, text.track)}`,
    locale,
  );

  return { subject, text: textLines.join("\n"), html };
}

/** Never throws: a failed email must not fail checkout or a webhook. */
export async function sendOrderConfirmation(
  orderID: number,
  locale: Locale = "en",
): Promise<boolean> {
  try {
    const order = await getOrderWithItems(orderID);
    if (!order) return false;

    const email = buildOrderConfirmationEmail(order, getSiteUrl(), locale);
    return await sendEmail({ to: order.customerEmail, ...email });
  } catch (error) {
    console.error(`Order confirmation for ${orderID} failed:`, error);
    return false;
  }
}
