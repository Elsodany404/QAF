"use server";

import { revalidatePath } from "next/cache";

import { errorMessage, isValidOrderID } from "@/lib/actionHelpers";
import { getCurrentSession } from "@/lib/adminAccess";
import { sendEmail, SHOP_EMAIL } from "@/lib/email";
import {
  canRequestReturn,
  formatOrderNumber,
  RETURN_REASON_MAX_LENGTH,
  RETURN_REASON_MIN_LENGTH,
} from "@/lib/orderStatus";
import { siteUrl } from "@/lib/siteUrl";
import supabaseAdmin from "@/supabase/admin";
import type { ActionReturnType } from "@/types/customTypes";

/**
 * Customer: ask to return a delivered order. The admin reviews it in the
 * dashboard; approving it books a Bosta pickup that refunds the customer in
 * cash. One return per order.
 */
export async function requestReturn(
  orderID: number,
  reason: string,
): Promise<ActionReturnType> {
  try {
    const session = await getCurrentSession();
    if (!session?.user) {
      return { success: false, error: "Please sign in to manage your orders" };
    }
    if (!isValidOrderID(orderID)) {
      return { success: false, error: "Invalid order" };
    }

    const trimmedReason = typeof reason === "string" ? reason.trim() : "";
    if (
      trimmedReason.length < RETURN_REASON_MIN_LENGTH ||
      trimmedReason.length > RETURN_REASON_MAX_LENGTH
    ) {
      return {
        success: false,
        error: `Please tell us why you're returning the order (${RETURN_REASON_MIN_LENGTH} to ${RETURN_REASON_MAX_LENGTH} characters)`,
      };
    }

    const { data: order, error } = await supabaseAdmin
      .from("Order")
      .select("*")
      .eq("id", orderID)
      .maybeSingle();

    if (error || !order || order.customer_ID !== session.user.id) {
      return { success: false, error: "Order not found" };
    }
    if (!canRequestReturn(order)) {
      return {
        success: false,
        error: "Only a delivered order can be returned, and only once",
      };
    }

    // Only if it's still delivered with no return, e.g. not a second tab.
    const { data: updated, error: updateError } = await supabaseAdmin
      .from("Order")
      .update({
        returnStatus: "requested",
        returnReason: trimmedReason,
        returnRequestedAt: new Date().toISOString(),
      })
      .eq("id", orderID)
      .eq("shippingStatus", "delivered")
      .is("returnStatus", null)
      .select("id")
      .maybeSingle();

    if (updateError || !updated) {
      return {
        success: false,
        error: "The order status just changed. Please refresh and try again.",
      };
    }

    // Best effort: the request is saved and waits in the dashboard anyway.
    await sendEmail({
      to: SHOP_EMAIL,
      replyTo: order.customerEmail,
      subject: `[Return request] Order ${formatOrderNumber(order.id)}`,
      text: [
        `${order.customerName} (${order.customerEmail}, ${order.customerPhone}) asked to return order ${formatOrderNumber(order.id)}.`,
        "",
        `Reason: ${trimmedReason}`,
        "",
        `Review it in the dashboard: ${siteUrl("/admin/dashboard")}`,
      ].join("\n"),
    });

    revalidatePath("/user");
    return {
      success: true,
      data: "Return requested. We'll review it and let you know.",
    };
  } catch (err) {
    return { success: false, error: errorMessage(err) };
  }
}
