import supabaseAdmin from "@/supabase/admin";
import type { orderPayloadT, OrderQuery } from "@/types/customTypes";

/*
 * Server-only order queries. Uses the service-role client, so callers must
 * authorize the request first. Do not import this file from a client component.
 */

export const ORDER_WITH_ITEMS =
  "*, orderItems:OrderItem(*, product:Product(*))";

export async function getOrderWithItems(
  orderID: number,
): Promise<OrderQuery | null> {
  const { data, error } = await supabaseAdmin
    .from("Order")
    .select(ORDER_WITH_ITEMS)
    .eq("id", orderID)
    .maybeSingle();

  if (error) throw new Error(`Failed to load order: ${error.message}`);
  return data as unknown as OrderQuery | null;
}

export async function getOrdersByCustomerID(
  customerID: string,
): Promise<OrderQuery[]> {
  const { data, error } = await supabaseAdmin
    .from("Order")
    .select(ORDER_WITH_ITEMS)
    .eq("customer_ID", customerID)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load orders: ${error.message}`);
  return (data ?? []) as unknown as OrderQuery[];
}

export async function getAllOrders(): Promise<OrderQuery[]> {
  const { data, error } = await supabaseAdmin
    .from("Order")
    .select(ORDER_WITH_ITEMS)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load orders: ${error.message}`);
  return (data ?? []) as unknown as OrderQuery[];
}

export async function postOrder(orderPayload: orderPayloadT): Promise<number> {
  const items = orderPayload.cart.map((item) => ({
    productID: item.product.id,
    productName: item.product.name,
    quantity: item.quantity,
    totalPrice: item.itemPrice * item.quantity,
    options: item.options.map((option) => ({
      id: option.id,
      optionID: option.optionID,
      label: option.label,
      priceModifier: option.priceModifier,
    })),
  }));

  const subTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

  const { data: orderID, error } = await supabaseAdmin.rpc("create_order", {
    p_customer_id: orderPayload.customerID,
    p_customer_name: orderPayload.customerName,
    p_customer_email: orderPayload.customerEmail,
    p_customer_phone: orderPayload.customerPhone,
    p_apartment: orderPayload.apartment,
    p_street: orderPayload.street,
    p_city: orderPayload.city,
    p_cityid: orderPayload.cityID,
    p_district: orderPayload.district,
    p_districtid: orderPayload.districtID,
    p_subtotal: subTotal,
    p_shipping_fees: orderPayload.shippingFees,
    p_payment_method: orderPayload.paymentMethod,
    p_items: items,
  });

  if (error) throw error;
  if (!orderID) throw new Error("Failed to create order");

  return orderID;
}
