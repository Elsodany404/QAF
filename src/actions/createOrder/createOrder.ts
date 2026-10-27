import type { Locale } from "@/i18n/config";
import { format } from "@/i18n/format";
import { getMessages } from "@/i18n/messages";
import { postOrder } from "@/services/Order";
import { getBostaFees, MAX_COD_AMOUNT } from "@/services/Bosta";

import { buildServerCart } from "./buildServerCart";
import { calculateCartTotal } from "./calculateCartTotal";
import type { CreateOrderInput } from "./parseCreateOrderForm";
import { processOrderPayment } from "./processOrderPayment";

type CreateOrderParams = {
  customerID: string;
  input: CreateOrderInput;
  /** The checkout's language: errors, the confirmation page and email. */
  locale?: Locale;
};

export type CreateOrderFailure = {
  success: false;
  error: string;
  /** "price_changed": the cart must be re-priced before ordering again. */
  code?: "price_changed";
};

type CreateOrderResult =
  | {
      success: true;
      redirectUrl: string;
    }
  | CreateOrderFailure;

export async function createOrder({
  customerID,
  input,
  locale = "en",
}: CreateOrderParams): Promise<CreateOrderResult> {
  const m = getMessages(locale).server;

  /*
   * =========================================================
   * BUILD SERVER-TRUSTED CART
   * =========================================================
   */

  const cartResult = await buildServerCart(input.secureCart, locale);

  if (!cartResult.success) {
    return {
      success: false,
      error: cartResult.error,
    };
  }

  const cart = cartResult.cart;

  /*
   * =========================================================
   * CART TOTAL
   * =========================================================
   */

  const cartTotal = calculateCartTotal(cart);

  if (!Number.isFinite(cartTotal) || cartTotal < 0) {
    return {
      success: false,
      error: m.invalidCartTotal,
    };
  }

  /*
   * =========================================================
   * SHIPPING
   * =========================================================
   */

  let shippingFees: number;

  try {
    shippingFees = await getBostaFees(
      input.city,
      input.paymentMethod === "cash_on_delivery" ? cartTotal : 0,
    );
  } catch {
    return {
      success: false,
      error: m.shippingFailed,
    };
  }

  if (!Number.isFinite(shippingFees) || shippingFees < 0) {
    return {
      success: false,
      error: m.invalidShipping,
    };
  }

  // Never charge something other than the total the customer agreed to,
  // e.g. when a price changed after the item went into their cart.
  if (
    input.expectedTotal !== undefined &&
    // Compared in piastres so floating-point noise can't cause a mismatch.
    Math.round(input.expectedTotal * 100) !==
      Math.round((cartTotal + shippingFees) * 100)
  ) {
    return {
      success: false,
      error: m.pricesChanged,
      code: "price_changed",
    };
  }

  // The courier can't collect more than this, so the order could never ship.
  if (
    input.paymentMethod === "cash_on_delivery" &&
    cartTotal + shippingFees > MAX_COD_AMOUNT
  ) {
    return {
      success: false,
      error: format(m.codLimit, { max: MAX_COD_AMOUNT }),
    };
  }

  /*
   * =========================================================
   * CREATE ORDER
   * =========================================================
   */

  try {
    const orderPayload = {
      customerID,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      city: input.city,
      cityID: input.cityID,
      district: input.district,
      districtID: input.districtID,
      street: input.street,
      apartment: input.apartment,
      paymentMethod: input.paymentMethod,
      shippingFees,
      cart,
    };

    const orderID = await postOrder(orderPayload);

    /*
     * =======================================================
     * PAYMENT / DELIVERY
     * =======================================================
     */

    const paymentResult = await processOrderPayment(
      orderID,
      orderPayload.paymentMethod,
      locale,
    );

    return paymentResult;
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === "object" &&
            error !== null &&
            "message" in error &&
            typeof error.message === "string"
          ? error.message
          : "Unknown error";
    const errorCode =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof error.code === "string"
        ? error.code
        : undefined;

    console.error("createOrder failed:", {
      message: errorMessage,
      code: errorCode,
    });
    return {
      success: false,
      error: m.unexpected,
    };
  }
}
