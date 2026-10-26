"use server";

import { revalidatePath } from "next/cache";

import { errorMessage, isValidOrderID } from "@/lib/actionHelpers";
import { getCurrentSession } from "@/lib/adminAccess";
import {
  canCancelOrder,
  canCustomerCancelOrder,
  hasOnlinePayment,
  normalizeShippingStatus,
} from "@/lib/orderStatus";
import { terminateBostaDelivery } from "@/services/Bosta";
import supabaseAdmin from "@/supabase/admin";
import type { ActionReturnType } from "@/types/customTypes";

/**
 * Cancels an order on behalf of its owner (or an admin). Only allowed before
 * the courier picks the parcel up; terminates the Bosta shipment if one
 * exists. The site never refunds: customers can't cancel an order they paid
 * for online, and the shop cancels it on WhatsApp, where the refund is
 * agreed. The order row is kept for records.
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
          "This order has already been handed to the courier and can no longer be cancelled. Please message us on WhatsApp.",
      };
    }
    if (!isAdmin && !canCustomerCancelOrder(order)) {
      return {
        success: false,
        error:
          "You've paid for this order online, so please message us on WhatsApp to cancel it and arrange your refund.",
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
            : "We couldn't cancel the courier shipment. Please message us on WhatsApp and we'll cancel it for you.",
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

    // `order` is the row as it was before cancelling.
    const message =
      isAdmin && hasOnlinePayment(order)
        ? "Order cancelled. It was paid online: refund the customer in your Paymob dashboard, then set its payment to Refunded."
        : "Order cancelled";

    revalidatePath("/user");
    return { success: true, data: message };
  } catch (err) {
    return { success: false, error: errorMessage(err) };
  }
}
