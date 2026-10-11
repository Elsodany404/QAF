"use server";

import { isAdminUser } from "@/lib/adminAccess";
import { getAllOrders } from "@/services/Order";
import type { OrderQuery } from "@/types/customTypes";

export async function getAdminOrders(): Promise<OrderQuery[]> {
  if (!(await isAdminUser())) {
    throw new Error("Not authorized to view orders");
  }

  return getAllOrders();
}
