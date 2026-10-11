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

export async function processOrderPayment(
  orderID: number,
  paymentMethod: PaymentMethod,
): Promise<ProcessOrderPaymentResult> {
  if (!Number.isInteger(orderID) || orderID <= 0) {
    return {
      success: false,
      error: "Invalid order ID",
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
    await sendOrderConfirmation(orderID);

    return {
      success: true,
      redirectUrl: `/order-success/${orderID}`,
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
      return { success: false, error: "Order not found" };
    }

    return {
      success: true,
      redirectUrl: await createPaymobCheckout(order),
    };
  } catch (error) {
    console.error(`Paymob payment for order ${orderID} failed:`, error);

    return {
      success: false,
      error:
        "Your order was saved but we couldn't start the payment. You can retry from your account page.",
    };
  }
}
