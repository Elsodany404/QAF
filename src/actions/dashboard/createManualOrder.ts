"use server";

import supabaseAdmin from "@/supabase/admin";
import { errorMessage, isAdminUser } from "@/lib/adminAccess";
import {
  findDeliveryAddress,
  normalizeEgyptianMobile,
} from "@/lib/bostaLocations";
import { createBostaDelivery, MAX_COD_AMOUNT } from "@/services/Bosta";
import { getOrderWithItems } from "@/services/Order";
import { sendOrderConfirmation } from "@/services/OrderEmails";
import { createPaymobCheckout } from "@/services/Paymob";
import type { PaymentMethod } from "@/types/customTypes";

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
  paymentMethod: PaymentMethod;
  shippingFees: number;
  items: {
    productID: number;
    quantity: number;
  }[];
};

export type AdminCreateOrderResult =
  | {
      status: "success";
      orderID: number;
      /** Populated for online payment methods — admin can share this URL with the customer */
      paymentUrl?: string;
      /** The order exists, but a follow-up step (shipment / payment link) failed */
      warning?: string;
    }
  | { status: "failed"; message: string };

export async function adminCreateOrder(
  payload: AdminCreateOrderPayload,
): Promise<AdminCreateOrderResult> {
  try {
    if (!(await isAdminUser())) {
      return { status: "failed", message: "Not authorized to create orders" };
    }

    if (
      !payload.customerName.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.customerEmail) ||
      !payload.customerPhone.trim() ||
      !payload.cityID ||
      !payload.districtID ||
      !payload.street.trim() ||
      !Number.isFinite(payload.shippingFees) ||
      payload.shippingFees < 0 ||
      !["paymob_card", "mobile_wallet", "cash_on_delivery"].includes(
        payload.paymentMethod,
      ) ||
      !Array.isArray(payload.items) ||
      payload.items.length === 0 ||
      payload.items.some(
        (item) =>
          !Number.isInteger(item.productID) ||
          item.productID <= 0 ||
          !Number.isInteger(item.quantity) ||
          item.quantity <= 0,
      )
    ) {
      return { status: "failed", message: "Invalid manual order details" };
    }

    const phone = normalizeEgyptianMobile(payload.customerPhone);
    if (!phone) {
      return {
        status: "failed",
        message: "Enter a valid Egyptian mobile number (01xxxxxxxxx)",
      };
    }
    const address = findDeliveryAddress(payload.cityID, payload.districtID);
    if (!address) {
      return { status: "failed", message: "Bosta doesn't deliver there" };
    }

    const productIDs = [
      ...new Set(payload.items.map((item) => item.productID)),
    ];
    const { data: products, error: productsError } = await supabaseAdmin
      .from("Product")
      .select("id, name, price, inStock")
      .in("id", productIDs);

    if (productsError || !products || products.length !== productIDs.length) {
      return {
        status: "failed",
        message:
          productsError?.message ?? "One or more products were not found",
      };
    }

    const productByID = new Map(
      products.map((product) => [product.id, product]),
    );
    // Better Auth stores emails lowercased.
    const { data: customer, error: customerError } = await supabaseAdmin
      .from("user")
      .select("id")
      .eq("email", payload.customerEmail.trim().toLowerCase())
      .maybeSingle();

    if (customerError || !customer) {
      return {
        status: "failed",
        message: customerError?.message ?? "Customer account was not found",
      };
    }

    const items = payload.items.map((item) => {
      const product = productByID.get(item.productID);
      if (!product?.inStock) {
        throw new Error(`Product ${item.productID} is not available`);
      }

      const totalPrice = Number(product.price) * item.quantity;
      if (!Number.isFinite(totalPrice) || totalPrice <= 0) {
        throw new Error(`Product ${item.productID} has an invalid price`);
      }

      return {
        productID: product.id,
        productName: product.name,
        quantity: item.quantity,
        totalPrice,
        options: [],
      };
    });
    const subTotal = items.reduce((acc, item) => acc + item.totalPrice, 0);

    if (
      payload.paymentMethod === "cash_on_delivery" &&
      subTotal + payload.shippingFees > MAX_COD_AMOUNT
    ) {
      return {
        status: "failed",
        message: `Cash on delivery is limited to ${MAX_COD_AMOUNT} EGP`,
      };
    }

    const { data: orderID, error } = await supabaseAdmin.rpc("create_order", {
      p_customer_id: customer.id,
      p_customer_name: payload.customerName,
      p_customer_email: payload.customerEmail.trim(),
      p_customer_phone: phone,
      p_apartment: payload.apartment,
      p_street: payload.street,
      p_city: address.city.cityName,
      p_cityid: address.city.cityId,
      p_district: address.district.districtName,
      p_districtid: address.district.districtId,
      p_subtotal: subTotal,
      p_shipping_fees: payload.shippingFees,
      p_payment_method: payload.paymentMethod,
      p_items: items,
    });

    if (error) {
      return { status: "failed", message: error.message };
    }

    if (!orderID) {
      return { status: "failed", message: "Failed to create order" };
    }

    // COD — ship right away. A courier failure leaves the order in
    // "processing" so it can be retried from the dashboard.
    if (payload.paymentMethod === "cash_on_delivery") {
      await sendOrderConfirmation(orderID);
      try {
        await createBostaDelivery(orderID);
      } catch (err) {
        return {
          status: "success",
          orderID,
          warning: `Order created, but the Bosta delivery failed: ${errorMessage(err)}`,
        };
      }
      return { status: "success", orderID };
    }

    // Online payment — admin shares the checkout link with the customer.
    const order = await getOrderWithItems(orderID);
    if (!order) {
      return {
        status: "failed",
        message: "Order was not found after creation",
      };
    }

    try {
      const paymentUrl = await createPaymobCheckout(order);
      return { status: "success", orderID, paymentUrl };
    } catch (err) {
      return {
        status: "success",
        orderID,
        warning: `Order created, but the payment link failed: ${errorMessage(err)}`,
      };
    }
  } catch (err) {
    return {
      status: "failed",
      message: errorMessage(err),
    };
  }
}
