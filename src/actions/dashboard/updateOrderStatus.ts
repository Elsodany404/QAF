"use server";

import { isAdminUser, isValidOrderID } from "@/lib/adminAccess";
import {
  isShippingStatus,
  MANUAL_PAYMENT_STATUSES,
  type PaymentStatus,
  type ShippingStatus,
} from "@/lib/orderStatus";
import supabaseAdmin from "@/supabase/admin";
import type { ActionReturnType } from "@/types/customTypes";

export type OrderStatusUpdate = {
  shippingStatus?: ShippingStatus;
  paymentStatus?: PaymentStatus;
};

/**
 * Admin: manually override an order's shipping and/or payment status, e.g.
 * marking a cash-on-delivery order as paid. Courier and Paymob side effects
 * (shipments, refunds) have their own actions.
 */
export async function updateOrderStatus(
  orderID: number,
  update: OrderStatusUpdate,
): Promise<ActionReturnType> {
  if (!(await isAdminUser())) {
    return { success: false, error: "Not authorized to update orders" };
  }

  const { shippingStatus, paymentStatus } = update ?? {};
  if (
    !isValidOrderID(orderID) ||
    (shippingStatus === undefined && paymentStatus === undefined) ||
    (shippingStatus !== undefined && !isShippingStatus(shippingStatus)) ||
    (paymentStatus !== undefined &&
      !MANUAL_PAYMENT_STATUSES.includes(paymentStatus))
  ) {
    return { success: false, error: "Invalid order status update" };
  }

  const { data, error } = await supabaseAdmin
    .from("Order")
    .update({
      ...(shippingStatus && { shippingStatus }),
      ...(paymentStatus && { paymentStatus }),
    })
    .eq("id", orderID)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { success: false, error: error?.message ?? "Order not found" };
  }

  return { success: true, data: "Status updated" };
}
