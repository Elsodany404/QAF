"use server";

import { errorMessage, isValidOrderID } from "@/lib/actionHelpers";
import { isAdminUser } from "@/lib/adminAccess";
import {
  CANCELLABLE_SHIPPING_STATUSES,
  normalizeShippingStatus,
} from "@/lib/orderStatus";
import { terminateBostaDelivery } from "@/services/Bosta";
import supabaseAdmin from "@/supabase/admin";
import type { ActionReturnType } from "@/types/customTypes";

/**
 * Admin: terminate the Bosta shipment but keep the order open, so a new
 * delivery can be created (e.g. after fixing a wrong address). To cancel the
 * whole order use cancelOrder instead.
 */
export async function cancelDelivery(
  orderID: number,
): Promise<ActionReturnType> {
  try {
    if (!(await isAdminUser())) {
      return { success: false, error: "Not authorized to cancel deliveries" };
    }
    if (!isValidOrderID(orderID)) {
      return { success: false, error: "Invalid order ID" };
    }

    const { data: order, error } = await supabaseAdmin
      .from("Order")
      .select("id, shippingStatus, bostaTrackingNumber")
      .eq("id", orderID)
      .single();

    if (error || !order) {
      return { success: false, error: error?.message ?? "Order not found" };
    }
    if (!order.bostaTrackingNumber) {
      return { success: false, error: "Order has no Bosta delivery to cancel" };
    }
    if (
      !CANCELLABLE_SHIPPING_STATUSES.includes(
        normalizeShippingStatus(order.shippingStatus),
      )
    ) {
      return {
        success: false,
        error: "The courier already picked this order up",
      };
    }

    await terminateBostaDelivery(order.bostaTrackingNumber);

    const { error: updateError } = await supabaseAdmin
      .from("Order")
      .update({
        bostaOrderID: null,
        bostaTrackingNumber: null,
        bostaTrackingUrl: null,
        shippingStatus: "processing",
      })
      .eq("id", orderID);

    if (updateError) {
      return {
        success: false,
        error:
          "Bosta cancelled the delivery, but the order could not be updated. Please update it manually.",
      };
    }

    return { success: true, data: "Bosta delivery cancelled" };
  } catch (err) {
    return { success: false, error: errorMessage(err) };
  }
}
