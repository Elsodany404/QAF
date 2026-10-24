"use server";

import { isValidOrderID } from "@/lib/actionHelpers";
import { isAdminUser } from "@/lib/adminAccess";
import supabaseAdmin from "@/supabase/admin";
import type { ActionReturnType } from "@/types/customTypes";

/** Admin: decline a return that hasn't been picked up. */
export async function rejectReturn(orderID: number): Promise<ActionReturnType> {
  if (!(await isAdminUser())) {
    return { success: false, error: "Not authorized to review returns" };
  }
  if (!isValidOrderID(orderID)) {
    return { success: false, error: "Invalid order ID" };
  }

  // Same statuses as canReviewReturn: never one with a pickup on its way.
  const { data, error } = await supabaseAdmin
    .from("Order")
    .update({ returnStatus: "rejected" })
    .eq("id", orderID)
    .in("returnStatus", ["requested", "pickup_failed"])
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return {
      success: false,
      error: error?.message ?? "This return can no longer be declined",
    };
  }
  return { success: true, data: "Return declined" };
}
