import { supabase } from "../lib/supabase";
import { AdminOrder, orderPayloadT, OrderQuery } from "../types/customTypes";
import { OrderStatus } from "../types/db";
// import { OrderInsert, OrderStatus } from "../types/db";

export async function getOrders(): Promise<AdminOrder[]> {
  const { data, error } = await supabase
    .from("Order")
    .select("*, OrderItem(*)")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []) as unknown as AdminOrder[];
}

export async function getOrderByID(orderID: string): Promise<OrderQuery> {
  const { data, error } = await supabase
    .from("Order")
    .select("*, OrderItem(*)")
    .eq("id", orderID)
    .single();

  if (error) throw error;

  return data;
}

export async function postOrder(orderPayload: orderPayloadT) {
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
  console.log(items, "order items");
  const { data: orderId, error } = await supabase.rpc("create_order", {
    p_customer_name: orderPayload.customerName,
    p_customer_email: orderPayload.customerEmail,
    p_customer_phone: orderPayload.customerPhone,
    p_total_price: orderPayload.totalPrice,
    p_payment_method: orderPayload.paymentMethod,

    p_apartment: orderPayload.apartment,
    p_street: orderPayload.street,
    p_city: orderPayload.city,
    p_governorate: orderPayload.governorate,
    p_address_details: orderPayload.addressDetails,

    p_items: items,
  });
  console.log(orderId, 'orderID');
  if (error) {
    throw error;
  }

  return orderId;
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
