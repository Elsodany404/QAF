"use server";

import { errorMessage, isValidOrderID } from "@/lib/actionHelpers";
import { isAdminUser } from "@/lib/adminAccess";
import { refundPaymobOrder } from "@/services/Paymob";
import type { ActionReturnType } from "@/types/customTypes";

/**
 * Admin: refund a cancelled, paid Paymob order in full (e.g. the customer
 * paid after cancelling, or the automatic refund on cancel failed).
 */
export async function createRefund(orderID: number): Promise<ActionReturnType> {
  try {
    if (!(await isAdminUser())) {
      return { success: false, error: "Not authorized to refund orders" };
    }
    if (!isValidOrderID(orderID)) {
      return { success: false, error: "A valid order ID is required" };
    }

    await refundPaymobOrder(orderID);
    return { success: true, data: "Refund completed" };
  } catch (err) {
    return { success: false, error: errorMessage(err) };
  }
}
