"use server";

import { createPayment } from "./createPayment";
import supabaseAdmin from "@/supabase/admin";

export type AdminCreateOrderPayload = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  city: string;
  cityID: string;
  district: string;
  districtID: string;
  street: string;
  apartment: string;
  paymentMethod: "paymob_card" | "vodafone_cash" | "cash_on_delivery";
  shippingFees: number;
  items: {
    productID: number;
    productName: string;
    quantity: number;
    totalPrice: number;
    options: unknown[];
  }[];
};

export type AdminCreateOrderResult =
  | {
      status: "success";
      orderID: number;
      /** Populated for online payment methods — admin can share this URL with the customer */
      paymentUrl?: string;
    }
  | { status: "failed"; message: string };

export async function adminCreateOrder(
  payload: AdminCreateOrderPayload,
): Promise<AdminCreateOrderResult> {
  try {
    const subTotal = payload.items.reduce((acc, i) => acc + i.totalPrice, 0);

    const { data: orderID, error } = await supabaseAdmin.rpc("create_order", {
      p_customer_name: payload.customerName,
      p_customer_email: payload.customerEmail,
      p_customer_phone: payload.customerPhone,
      p_apartment: payload.apartment,
      p_street: payload.street,
      p_city: payload.city,
      p_cityid: payload.cityID,
      p_district: payload.district,
      p_districtid: payload.districtID,
      p_subtotal: subTotal,
      p_shipping_fees: payload.shippingFees,
      p_payment_method: payload.paymentMethod,
      p_items: payload.items,
    });

    if (error) {
      return { status: "failed", message: error.message };
    }

    if (!orderID) {
      return { status: "failed", message: "Failed to create order" };
    }

    // COD — no payment step needed
    if (payload.paymentMethod === "cash_on_delivery") {
      return { status: "success", orderID };
    }

    // Online payment — create Paymob intention
    const payment = await createPayment(orderID);

    if (!payment.success) {
      return {
        status: "failed",
        message:
          typeof payment.error === "string"
            ? payment.error
            : "Payment creation failed",
      };
    }

    const publicKey = process.env.NEXT_PUBLIC_PAYMOB_PUBLIC_KEY;
    const paymentUrl =
      `https://accept.paymob.com/unifiedcheckout/` +
      `?publicKey=${publicKey}` +
      `&clientSecret=${payment.data.client_secret}`;

    return { status: "success", orderID, paymentUrl };
  } catch (err) {
    return {
      status: "failed",
      message: err instanceof Error ? err.message : "Unexpected error",
    };
  }
}
