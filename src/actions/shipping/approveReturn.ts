"use server";

import { errorMessage, isValidOrderID } from "@/lib/actionHelpers";
import { isAdminUser } from "@/lib/adminAccess";
import { createBostaReturnPickup } from "@/services/Bosta";
import type { ActionReturnType } from "@/types/customTypes";
import { formatCurrency } from "@/utils/helper";

/**
 * Admin: approve a customer's return. Books the Bosta pickup in which the
 * courier collects the items and pays the customer `refundAmount` in cash.
 */
export async function approveReturn(
  orderID: number,
  refundAmount: number,
): Promise<ActionReturnType> {
  try {
    if (!(await isAdminUser())) {
      return { success: false, error: "Not authorized to approve returns" };
    }
    if (!isValidOrderID(orderID)) {
      return { success: false, error: "Invalid order ID" };
    }
    if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
      return {
        success: false,
        error: "Enter the refund the courier pays the customer",
      };
    }

    const { trackingNumber, refund } = await createBostaReturnPickup(
      orderID,
      refundAmount,
    );
    return {
      success: true,
      data: `Return pickup booked${
        trackingNumber ? ` (tracking ${trackingNumber})` : ""
      }. The courier will pay the customer ${formatCurrency(refund)}.`,
    };
  } catch (err) {
    return { success: false, error: errorMessage(err) };
  }
}
