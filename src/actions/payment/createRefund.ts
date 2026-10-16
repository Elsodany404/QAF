"use server";

import { errorMessage, isValidOrderID } from "@/lib/actionHelpers";
import { isAdminUser } from "@/lib/adminAccess";
import { refundPaymobOrder } from "@/services/Paymob";
import type { ActionReturnType } from "@/types/customTypes";

/** Admin: refund a paid Paymob order. Omit `amount` to refund in full. */
export async function createRefund(
  orderID: number,
  amount?: number,
): Promise<ActionReturnType> {
  try {
    if (!(await isAdminUser())) {
      return { success: false, error: "Not authorized to refund orders" };
    }
    if (!isValidOrderID(orderID)) {
      return { success: false, error: "A valid order ID is required" };
    }
    if (amount !== undefined && (!Number.isFinite(amount) || amount <= 0)) {
      return {
        success: false,
        error: "Refund amount must be greater than zero",
      };
    }

    await refundPaymobOrder(orderID, amount);
    return { success: true, data: "Refund completed" };
  } catch (err) {
    return { success: false, error: errorMessage(err) };
  }
}
