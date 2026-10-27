import { localizePath, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { createBostaDelivery } from "@/services/Bosta";
import { getOrderWithItems } from "@/services/Order";
import { sendOrderConfirmation } from "@/services/OrderEmails";
import { createPaymobCheckout } from "@/services/Paymob";
import type { PaymentMethod } from "@/types/customTypes";

type ProcessOrderPaymentResult =
  | {
      success: true;
      redirectUrl: string;
    }
  | {
      success: false;
      error: string;
    };

/**
 * `locale` is the checkout's language: the confirmation page, the email and
 * Paymob's return address use it.
 */
export async function processOrderPayment(
  orderID: number,
  paymentMethod: PaymentMethod,
  locale: Locale = "en",
): Promise<ProcessOrderPaymentResult> {
  const m = getMessages(locale).server;
  if (!Number.isInteger(orderID) || orderID <= 0) {
    return {
      success: false,
      error: m.invalidOrderID,
    };
  }

  /*
   * =======================================================
   * CASH ON DELIVERY
   * =======================================================
   * The order is already saved, so a courier outage must not fail checkout.
   * The order stays "processing" and the admin can create the shipment from
   * the dashboard.
   */

  if (paymentMethod === "cash_on_delivery") {
    try {
      await createBostaDelivery(orderID);
    } catch (error) {
      console.error(`Bosta delivery for COD order ${orderID} failed:`, error);
    }

    // COD orders are confirmed as soon as they're placed.
    await sendOrderConfirmation(orderID, locale);

    return {
      success: true,
      redirectUrl: localizePath(locale, `/order-success/${orderID}`),
    };
  }

  /*
   * =======================================================
   * PAYMOB
   * =======================================================
   */

  try {
    const order = await getOrderWithItems(orderID);
    if (!order) {
      return { success: false, error: m.orderNotFound };
    }

    return {
      success: true,
      redirectUrl: await createPaymobCheckout(order, locale),
    };
  } catch (error) {
    console.error(`Paymob payment for order ${orderID} failed:`, error);

    return {
      success: false,
      error: m.paymentNotStarted,
    };
  }
}
