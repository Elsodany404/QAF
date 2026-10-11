import supabaseAdmin from "@/supabase/admin";
import {
  bostaTrackingUrl,
  isOnlinePayment,
  normalizePaymentStatus,
} from "@/lib/orderStatus";

/*
 * Server-only Bosta integration. These functions do NOT check who is calling
 * them — callers (server actions, webhooks) are responsible for authorization.
 * Do not import this file from a client component.
 */

const BOSTA_API_URL = "https://app.bosta.co/api/v2";
// Bosta's documented upper bound for cash collected on delivery.
const MAX_COD_AMOUNT = 30000;

function getBostaApiKey() {
  const apiKey = process.env.BOSTA_API_KEY;
  if (!apiKey) throw new Error("BOSTA_API_KEY is not configured");
  return apiKey;
}

export async function getBostaFees(dropOffCity: string, cod: number) {
  const response = await fetch(
    `${BOSTA_API_URL}/pricing/shipment/calculator?dropOffCity=${encodeURIComponent(
      dropOffCity,
    )}&cod=${cod}&size=Normal`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: getBostaApiKey(),
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error("Failed to calculate Bosta shipping fees");
  }

  const data = await response.json();
  const shippingFees = Number(data?.data?.tier?.cost);

  if (!Number.isFinite(shippingFees) || shippingFees < 0) {
    throw new Error("Bosta returned an invalid shipping fee");
  }
  return shippingFees;
}

/**
 * Creates a Bosta "Send" delivery for an order. Cash-on-delivery orders
 * collect the order total; prepaid orders must already be paid.
 */
export async function createBostaDelivery(orderID: number) {
  const businessLocationId = process.env.BOSTA_BUSINESS_LOCATION_ID;
  if (!businessLocationId) {
    throw new Error("BOSTA_BUSINESS_LOCATION_ID is not configured");
  }
  const apiKey = getBostaApiKey();

  const { data: order, error } = await supabaseAdmin
    .from("Order")
    .select("*, orderItems:OrderItem(quantity)")
    .eq("id", orderID)
    .single();

  if (error || !order) {
    throw new Error(error?.message ?? "Order not found");
  }
  if (order.bostaOrderID) {
    throw new Error("A Bosta delivery already exists for this order");
  }
  if (order.shippingStatus === "cancelled") {
    throw new Error("Cannot ship a cancelled order");
  }

  const isCOD = !isOnlinePayment(order.paymentMethod);
  if (!isCOD && normalizePaymentStatus(order.paymentStatus) !== "paid") {
    throw new Error("Order has not been paid yet");
  }

  const cod = isCOD ? Math.round(order.totalPrice) : 0;
  if (isCOD && (cod <= 0 || cod > MAX_COD_AMOUNT)) {
    throw new Error(
      `Cash on delivery amount must be between 1 and ${MAX_COD_AMOUNT} EGP`,
    );
  }

  const itemsCount = (order.orderItems as { quantity: number }[]).reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  const nameParts = order.customerName.trim().split(/\s+/);

  const payload = {
    type: 10, // SEND
    businessLocationId,
    businessReference: String(order.id),
    cod,
    specs: {
      packageType: "Parcel",
      size: "SMALL",
      packageDetails: {
        itemsCount,
        description: "Coffee Packages",
      },
    },
    dropOffAddress: {
      cityId: order.cityID,
      city: order.city,
      districtId: order.districtID,
      districtName: order.district,
      firstLine: order.street,
      apartment: order.apartment,
    },
    goodsInfo: {
      amount: order.subTotal,
    },
    receiver: {
      firstName: nameParts[0] || "Customer",
      lastName: nameParts.slice(1).join(" ") || "Customer",
      phone: order.customerPhone,
      email: order.customerEmail,
    },
  };

  const response = await fetch(`${BOSTA_API_URL}/deliveries?apiVersion=1`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const body = await response.json().catch(() => null);

  if (!response.ok || body?.success !== true || !body.data?._id) {
    throw new Error(
      body?.message ?? `Bosta rejected the delivery (${response.status})`,
    );
  }

  const trackingNumber =
    body.data.trackingNumber != null ? String(body.data.trackingNumber) : null;

  const { error: updateError } = await supabaseAdmin
    .from("Order")
    .update({
      bostaOrderID: String(body.data._id),
      bostaTrackingNumber: trackingNumber,
      bostaTrackingUrl: trackingNumber
        ? bostaTrackingUrl(trackingNumber)
        : null,
      shippingStatus: "ready_for_pickup",
    })
    .eq("id", orderID);

  if (updateError) {
    throw new Error(
      `Bosta created delivery ${trackingNumber ?? body.data._id}, but the order could not be updated. Update it manually before retrying.`,
    );
  }

  return { trackingNumber };
}

/** Terminates a Bosta delivery. Only possible before the courier picks it up. */
export async function terminateBostaDelivery(trackingNumber: string) {
  const response = await fetch(
    `${BOSTA_API_URL}/deliveries/business/${encodeURIComponent(
      trackingNumber,
    )}/terminate`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: getBostaApiKey(),
      },
      cache: "no-store",
    },
  );

  const body = (await response.json().catch(() => null)) as {
    success?: boolean;
    message?: string;
  } | null;

  if (!response.ok || body?.success !== true) {
    throw new Error(
      body?.message ?? `Bosta cancellation failed (${response.status})`,
    );
  }
}
