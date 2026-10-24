import { postOrder } from "@/services/Order";
import { getBostaFees, MAX_COD_AMOUNT } from "@/services/Bosta";

import { buildServerCart } from "./buildServerCart";
import { calculateCartTotal } from "./calculateCartTotal";
import type { CreateOrderInput } from "./parseCreateOrderForm";
import { processOrderPayment } from "./processOrderPayment";

type CreateOrderParams = {
  customerID: string;
  input: CreateOrderInput;
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
}: CreateOrderParams): Promise<CreateOrderResult> {
  /*
   * =========================================================
   * BUILD SERVER-TRUSTED CART
   * =========================================================
   */

  const cartResult = await buildServerCart(input.secureCart);

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
      error: "Invalid cart total",
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
      error: "Failed to calculate shipping fees",
    };
  }

  if (!Number.isFinite(shippingFees) || shippingFees < 0) {
    return {
      success: false,
      error: "Invalid shipping fee",
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
      error:
        "Prices changed since you added these items. Please check the new total and place your order again.",
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
      error: `Cash on delivery is limited to ${MAX_COD_AMOUNT} EGP. Please pay online or split your order.`,
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
      error: "Unexpected error happened",
    };
  }
}
