"use server";
import type { CreatePaymentResult, OrderQuery } from "@/types/customTypes.js";
import supabaseAdmin from "@/supabase/admin";

export async function createPayment(
  orderID: number,
): Promise<CreatePaymentResult> {
  try {
    if (!orderID) {
      return {
        success: false,
        error: "orderID isn't provided",
      };
    }

    const { data: orderData, error } = await supabaseAdmin
      .from("Order")
      .select(
        `
    *,
    orderItems:OrderItem(
      *,
      product:Product(*)
    )
  `,
      )
      .eq("id", orderID)
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    if (!orderData) {
      return {
        success: false,
        error: "Order not found",
      };
    }
    const order = orderData as OrderQuery;
    const paymentMethod = order.paymentMethod;
    const integrationID =
      paymentMethod === "paymob_card"
        ? 5899221
        : paymentMethod === "vodafone_cash"
          ? 5899224
          : null;
    const amount = Math.round(order.subTotal * 100);

    const items = order.orderItems.map((item) => ({
      name: item.productName,
      amount: Math.round((item.totalPrice / item.quantity) * 100),
      description: item.product.description,
      quantity: item.quantity,
    }));
    // ==========================================
    // 2. CREATE PAYMOB INTENTION
    // ==========================================
    console.log("Paymob key exists:", !!process.env.PAYMOB_SECRET_KEY);

    const raw = JSON.stringify({
      amount,
      currency: "EGP",
      payment_methods: [integrationID],
      items: items,
      // TODO create validation on form accept first name and last name
      billing_data: {
        email: order.customerEmail,
        name: order.customerName,
        phone_number: order.customerPhone,
        city: order.city,
        state: order.city,
        street: order.street,
        apartment: order.apartment,
        building: order.apartment,
        country: "Egypt",
        floor: order.apartment,
      },
      extras: {
        ee: 22,
      },
      special_reference: order.id,
      expiration: 3600,
      notification_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/paymob-webhook`,
      redirection_url: `${process.env.NEXT_PUBLIC_SITE_URL}/order-success/${orderID}`,
    });

    const requestOptions: RequestInit = {
      method: "POST",
      headers: {
        Authorization: `Token ${process.env.PAYMOB_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: raw,
      redirect: "follow",
    };
    console.log("calling paymob ...");
    const paymobResponse = await fetch(
      "https://accept.paymob.com/v1/intention/",
      requestOptions,
    );

    const data = await paymobResponse.json();

    if (!paymobResponse.ok || !data) {
      console.error(data.detail);
      return {
        success: false,
        error: data,
      };
    }

    console.log("paymob called");
    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
