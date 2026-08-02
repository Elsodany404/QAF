import { supabase } from "../lib/supabase";
import { AdminOrder } from "../types/customTypes";
import { OrderStatus } from "../types/db";

export async function getOrders(): Promise<AdminOrder[]> {
  const { data, error } = await supabase
    .from("Order")
    .select("*, OrderItem(*)")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []) as unknown as AdminOrder[];
}
export async function updateOrderStatus({
  orderId,
  status,
}: {
  orderId: number;
  status: OrderStatus;
}) {
  const { error } = await supabase
    .from("Order")
    .update({
      status,
      shippingStatus: status === "shipped" ? "shipped" : undefined,
    } as never)
    .eq("id", orderId);

  if (error) throw error;
}
