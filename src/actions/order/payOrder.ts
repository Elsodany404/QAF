"use server";

import {
  errorMessage,
  getCurrentSession,
  isValidOrderID,
} from "@/lib/adminAccess";
import { canPayOrder } from "@/lib/orderStatus";
import { getOrderWithItems } from "@/services/Order";
import { createPaymobCheckout } from "@/services/Paymob";
import type { ActionReturnType } from "@/types/customTypes";

/**
 * Starts (or retries) online payment for an unpaid order owned by the
 * current user. Returns the Paymob checkout URL in `data`.
 */
export async function payOrder(orderID: number): Promise<ActionReturnType> {
  try {
    const session = await getCurrentSession();
    if (!session?.user) {
      return { success: false, error: "Please sign in to pay for your order" };
    }
    if (!isValidOrderID(orderID)) {
      return { success: false, error: "Invalid order" };
    }

    const order = await getOrderWithItems(orderID);
    if (!order || order.customer_ID !== session.user.id) {
      return { success: false, error: "Order not found" };
    }
    if (!canPayOrder(order)) {
      return { success: false, error: "This order cannot be paid online" };
    }

    return { success: true, data: await createPaymobCheckout(order) };
  } catch (err) {
    return { success: false, error: errorMessage(err) };
  }
}
