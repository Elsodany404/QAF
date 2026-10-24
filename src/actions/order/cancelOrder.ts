"use server";

import { revalidatePath } from "next/cache";

import { errorMessage, isValidOrderID } from "@/lib/actionHelpers";
import { getCurrentSession } from "@/lib/adminAccess";
import {
  canCancelOrder,
  hasRefundablePayment,
  normalizeShippingStatus,
} from "@/lib/orderStatus";
import { terminateBostaDelivery } from "@/services/Bosta";
import { refundPaymobOrder } from "@/services/Paymob";
import supabaseAdmin from "@/supabase/admin";
import type { ActionReturnType } from "@/types/customTypes";

/**
 * Cancels an order on behalf of its owner (or an admin). Only allowed before
 * the courier picks the parcel up. Terminates the Bosta shipment if one
 * exists and refunds a paid Paymob order. The order row is kept for records.
 */
export async function cancelOrder(orderID: number): Promise<ActionReturnType> {
  try {
    const session = await getCurrentSession();
    if (!session?.user) {
      return { success: false, error: "Please sign in to manage your orders" };
    }
    if (!isValidOrderID(orderID)) {
      return { success: false, error: "Invalid order" };
    }

    const { data: order, error } = await supabaseAdmin
      .from("Order")
      .select("*")
      .eq("id", orderID)
      .maybeSingle();

    const isAdmin = session.user.role === "admin";
    if (
      error ||
      !order ||
      (!isAdmin && order.customer_ID !== session.user.id)
    ) {
      return { success: false, error: "Order not found" };
    }

    if (normalizeShippingStatus(order.shippingStatus) === "cancelled") {
      return { success: false, error: "This order is already cancelled" };
    }
    if (!canCancelOrder(order)) {
      return {
        success: false,
        error:
          "This order has already been handed to the courier and can no longer be cancelled. Please contact us for a return.",
      };
    }

    if (order.bostaTrackingNumber) {
      try {
        await terminateBostaDelivery(order.bostaTrackingNumber);
      } catch (err) {
        return {
          success: false,
          error: isAdmin
            ? `Could not cancel the Bosta shipment: ${errorMessage(err)}`
            : "We couldn't cancel the courier shipment. Please contact us and we'll cancel it for you.",
        };
      }
    }

    // Optimistic concurrency: only cancel if nobody changed the status since
    // we read it (e.g. a Bosta webhook marking it as picked up).
    const { data: cancelled, error: updateError } = await supabaseAdmin
      .from("Order")
      .update({ shippingStatus: "cancelled" })
      .eq("id", orderID)
      .eq("shippingStatus", order.shippingStatus)
      .select("id")
      .maybeSingle();

    if (updateError || !cancelled) {
      return {
        success: false,
        error: "The order status just changed. Please refresh and try again.",
      };
    }

    let message = "Order cancelled";
    // `order` is the row as it was before cancelling.
    if (hasRefundablePayment(order)) {
      try {
        await refundPaymobOrder(orderID);
        message = "Order cancelled and your payment has been refunded";
      } catch (err) {
        console.error(`cancelOrder: refund failed for order ${orderID}`, err);
        message =
          "Order cancelled. Your refund will be processed by our team shortly.";
      }
    }

    revalidatePath("/user");
    return { success: true, data: message };
  } catch (err) {
    return { success: false, error: errorMessage(err) };
  }
}
