"use server";

import { getRequestMessages } from "@/i18n/request";
import { revalidateEveryLanguage } from "@/i18n/revalidate";
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
  // Customers get answers in the language of their page; the dashboard is
  // English.
  const { locale, m } = await getRequestMessages();
  try {
    const session = await getCurrentSession();
    if (!session?.user) {
      return { success: false, error: m.signInToManageOrders };
    }
    if (!isValidOrderID(orderID)) {
      return { success: false, error: m.invalidOrder };
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
      return { success: false, error: m.orderNotFound };
    }

    if (normalizeShippingStatus(order.shippingStatus) === "cancelled") {
      return { success: false, error: m.alreadyCancelled };
    }
    if (!canCancelOrder(order)) {
      return {
        success: false,
        error: m.withCourier,
      };
    }
    if (!isAdmin && !canCustomerCancelOrder(order)) {
      return {
        success: false,
        error: m.paidOnline,
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
            : m.courierCancelFailed,
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
        error: m.statusChanged,
      };
    }

    // `order` is the row as it was before cancelling.
    const message =
      isAdmin && hasOnlinePayment(order)
        ? "Order cancelled. It was paid online: refund the customer in your Paymob dashboard, then set its payment to Refunded."
        : m.orderCancelled;

    revalidateEveryLanguage("/user");
    return { success: true, data: message };
  } catch (err) {
    // The underlying errors are in English.
    return {
      success: false,
      error: locale === "en" ? errorMessage(err) : m.unexpected,
    };
  }
}
