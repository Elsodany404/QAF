import { supabase } from "../lib/supabase";
import { orderPayloadT, OrderQuery } from "../types/customTypes";
import { Order, OrderStatus } from "../types/db";
// import { OrderInsert, OrderStatus } from "../types/db";

export async function getOrders(): Promise<OrderQuery[]> {
  const { data, error } = await supabase
    .from("Order")
    .select("*, OrderItem(*)")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data;
}

export async function getOrderByID(orderID: string): Promise<OrderQuery> {
  const { data, error } = await supabase
    .from("Order")
    .select("*, orderItems:OrderItem(*, product:Product(*))")
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

  const subTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

  const { data: orderId, error } = await supabase.rpc("create_order", {
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

  if (error) {
    throw error;
  }

  return orderId;
}

export async function updateOrder(
  orderID: number,
  updates: Partial<Pick<Order, keyof Order>>,
) {
  {
    const { error } = await supabase
      .from("Order")
      .update(updates)
      .eq("id", orderID);

    if (error) throw error;
  }
}
