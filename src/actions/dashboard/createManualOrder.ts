"use server";

import { buildServerCart } from "@/actions/createOrder/buildServerCart";
import { calculateCartTotal } from "@/actions/createOrder/calculateCartTotal";
import { errorMessage } from "@/lib/actionHelpers";
import { isAdminUser } from "@/lib/adminAccess";
import {
  findDeliveryAddress,
  normalizeEgyptianMobile,
} from "@/lib/bostaLocations";
import {
  createBostaDelivery,
  getBostaFees,
  MAX_COD_AMOUNT,
} from "@/services/Bosta";
import { getOrderWithItems, postOrder } from "@/services/Order";
import { sendOrderConfirmation } from "@/services/OrderEmails";
import { createPaymobCheckout } from "@/services/Paymob";
import supabaseAdmin from "@/supabase/admin";
import type { PaymentMethod, SecureCart } from "@/types/customTypes";

const PAYMENT_METHODS: PaymentMethod[] = [
  "paymob_card",
  "mobile_wallet",
  "cash_on_delivery",
];

export type AdminCreateOrderPayload = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  cityID: string;
  districtID: string;
  street: string;
  apartment: string;
  paymentMethod: PaymentMethod;
  /**
   * null charges Bosta's price for the address, like checkout. A number
   * overrides it (e.g. 0 for free delivery).
   */
  shippingFees: number | null;
  /** Lines with their chosen option values, in the checkout's format. */
  items: SecureCart;
};

export type AdminCreateOrderResult =
  | {
      status: "success";
      orderID: number;
      /** Populated for online payment methods — admin can share this URL with the customer */
      paymentUrl?: string;
      /** The order exists, but a follow-up step (shipment / payment link) failed */
      warning?: string;
    }
  | { status: "failed"; message: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Admin: place an order on a customer's behalf (phone / WhatsApp orders).
 * Prices, options and stock are checked exactly like checkout.
 */
export async function adminCreateOrder(
  payload: AdminCreateOrderPayload,
): Promise<AdminCreateOrderResult> {
  try {
    if (!(await isAdminUser())) {
      return { status: "failed", message: "Not authorized to create orders" };
    }

    const customerName = String(payload.customerName ?? "").trim();
    const customerEmail = String(payload.customerEmail ?? "").trim();
    const street = String(payload.street ?? "").trim();
    const apartment = String(payload.apartment ?? "").trim();
    const { paymentMethod, shippingFees: shippingOverride } = payload;

    if (
      !customerName ||
      customerName.length > 100 ||
      !EMAIL_PATTERN.test(customerEmail) ||
      customerEmail.length > 254 ||
      !street ||
      street.length > 200 ||
      apartment.length > 100 ||
      !PAYMENT_METHODS.includes(paymentMethod) ||
      (shippingOverride !== null &&
        (!Number.isFinite(shippingOverride) || shippingOverride < 0)) ||
      !Array.isArray(payload.items) ||
      payload.items.length === 0
    ) {
      return { status: "failed", message: "Invalid manual order details" };
    }

    const phone = normalizeEgyptianMobile(String(payload.customerPhone ?? ""));
    if (!phone) {
      return {
        status: "failed",
        message: "Enter a valid Egyptian mobile number (01xxxxxxxxx)",
      };
    }
    const address = findDeliveryAddress(payload.cityID, payload.districtID);
    if (!address) {
      return { status: "failed", message: "Bosta doesn't deliver there" };
    }

    const cartResult = await buildServerCart(payload.items);
    if (!cartResult.success) {
      return { status: "failed", message: cartResult.error };
    }
    const cart = cartResult.cart;
    const subTotal = calculateCartTotal(cart);

    // Better Auth stores emails lowercased.
    const { data: customer, error: customerError } = await supabaseAdmin
      .from("user")
      .select("id")
      .eq("email", customerEmail.toLowerCase())
      .maybeSingle();

    if (customerError || !customer) {
      return {
        status: "failed",
        message:
          customerError?.message ??
          "No account uses that email. Ask the customer to sign up first.",
      };
    }

    const isCOD = paymentMethod === "cash_on_delivery";
    let shippingFees = shippingOverride;
    if (shippingFees === null) {
      try {
        shippingFees = await getBostaFees(
          address.city.cityName,
          isCOD ? subTotal : 0,
        );
      } catch {
        return {
          status: "failed",
          message:
            "Couldn't get Bosta's shipping price. Try again, or enter the shipping fee yourself.",
        };
      }
    }

    if (isCOD && subTotal + shippingFees > MAX_COD_AMOUNT) {
      return {
        status: "failed",
        message: `Cash on delivery is limited to ${MAX_COD_AMOUNT} EGP`,
      };
    }

    const orderID = await postOrder({
      customerID: customer.id,
      customerName,
      customerEmail,
      customerPhone: phone,
      city: address.city.cityName,
      cityID: address.city.cityId,
      district: address.district.districtName,
      districtID: address.district.districtId,
      street,
      apartment,
      paymentMethod,
      shippingFees,
      cart,
    });

    // COD — ship right away. A courier failure leaves the order in
    // "processing" so it can be retried from the dashboard.
    if (isCOD) {
      await sendOrderConfirmation(orderID);
      try {
        await createBostaDelivery(orderID);
      } catch (err) {
        return {
          status: "success",
          orderID,
          warning: `Order created, but the Bosta delivery failed: ${errorMessage(err)}`,
        };
      }
      return { status: "success", orderID };
    }

    // Online payment — admin shares the checkout link with the customer.
    const order = await getOrderWithItems(orderID);
    if (!order) {
      return {
        status: "failed",
        message: "Order was not found after creation",
      };
    }

    try {
      const paymentUrl = await createPaymobCheckout(order);
      return { status: "success", orderID, paymentUrl };
    } catch (err) {
      return {
        status: "success",
        orderID,
        warning: `Order created, but the payment link failed: ${errorMessage(err)}`,
      };
    }
  } catch (err) {
    return {
      status: "failed",
      message: errorMessage(err),
    };
  }
}
