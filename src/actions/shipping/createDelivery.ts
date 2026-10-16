"use server";

import { errorMessage, isValidOrderID } from "@/lib/actionHelpers";
import { isAdminUser } from "@/lib/adminAccess";
import { createBostaDelivery } from "@/services/Bosta";
import type { ActionReturnType } from "@/types/customTypes";

/** Admin: create the Bosta shipment for an order by hand. */
export async function createDelivery(
  orderID: number,
): Promise<ActionReturnType> {
  try {
    if (!(await isAdminUser())) {
      return { success: false, error: "Not authorized to create deliveries" };
    }
    if (!isValidOrderID(orderID)) {
      return { success: false, error: "Invalid order ID" };
    }

    const { trackingNumber } = await createBostaDelivery(orderID);
    return {
      success: true,
      data: trackingNumber
        ? `Bosta delivery created (tracking ${trackingNumber})`
        : "Bosta delivery created",
    };
  } catch (err) {
    return { success: false, error: errorMessage(err) };
  }
}
