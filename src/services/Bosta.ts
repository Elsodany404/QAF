import supabaseAdmin from "@/supabase/admin";
import {
  bostaTrackingUrl,
  canReviewReturn,
  isOnlinePayment,
  normalizePaymentStatus,
  normalizeShippingStatus,
} from "@/lib/orderStatus";
import type { Order } from "@/types/db";

/*
 * Server-only Bosta integration. These functions do NOT check who is calling
 * them — callers (server actions, webhooks) are responsible for authorization.
 * Do not import this file from a client component.
 */

const BOSTA_API_URL = "https://app.bosta.co/api/v2";
// Bosta's documented upper bound for cash collected on delivery, and for
// cash refunded on a return pickup.
export const MAX_COD_AMOUNT = 30000;

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

function getBusinessLocationId() {
  const businessLocationId = process.env.BOSTA_BUSINESS_LOCATION_ID;
  if (!businessLocationId) {
    throw new Error("BOSTA_BUSINESS_LOCATION_ID is not configured");
  }
  return businessLocationId;
}

type OrderForBosta = Order & { orderItems: { quantity: number }[] };

async function loadOrderForBosta(orderID: number): Promise<OrderForBosta> {
  const { data: order, error } = await supabaseAdmin
    .from("Order")
    .select("*, orderItems:OrderItem(quantity)")
    .eq("id", orderID)
    .single();

  if (error || !order) {
    throw new Error(error?.message ?? "Order not found");
  }
  return order as OrderForBosta;
}

function packageSpecs(order: OrderForBosta, description: string) {
  return {
    packageType: "Parcel",
    size: "SMALL",
    packageDetails: {
      itemsCount: order.orderItems.reduce(
        (sum, item) => sum + item.quantity,
        0,
      ),
      description,
    },
  };
}

/** The customer's address, as Bosta takes it for drop-offs and pickups. */
function customerAddress(order: OrderForBosta) {
  return {
    cityId: order.cityID,
    city: order.city,
    districtId: order.districtID,
    districtName: order.district,
    firstLine: order.street,
    apartment: order.apartment,
  };
}

function customerContact(order: OrderForBosta) {
  const nameParts = order.customerName.trim().split(/\s+/);
  return {
    firstName: nameParts[0] || "Customer",
    lastName: nameParts.slice(1).join(" ") || "Customer",
    phone: order.customerPhone,
    email: order.customerEmail,
  };
}

/** Creates a delivery of any type; resolves to Bosta's id and tracking number. */
async function postDelivery(payload: object, what: string) {
  let response: Response;
  try {
    response = await fetch(`${BOSTA_API_URL}/deliveries?apiVersion=1`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: getBostaApiKey(),
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch {
    throw new Error(
      `Bosta didn't answer, so the ${what} may or may not exist. Check the Bosta dashboard before trying again.`,
    );
  }

  const body = await response.json().catch(() => null);

  if (!response.ok || body?.success !== true || !body.data?._id) {
    throw new Error(
      body?.message ?? `Bosta rejected the ${what} (${response.status})`,
    );
  }

  return {
    id: String(body.data._id),
    trackingNumber:
      body.data.trackingNumber != null
        ? String(body.data.trackingNumber)
        : null,
  };
}

/**
 * Creates a Bosta "Send" delivery for an order. Cash-on-delivery orders
 * collect the order total; prepaid orders must already be paid.
 */
export async function createBostaDelivery(orderID: number) {
  const businessLocationId = getBusinessLocationId();
  // Fail before touching the order when Bosta isn't configured.
  getBostaApiKey();

  const order = await loadOrderForBosta(orderID);

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

  const delivery = await postDelivery(
    {
      type: 10, // SEND
      businessLocationId,
      businessReference: String(order.id),
      cod,
      specs: packageSpecs(order, "Coffee Packages"),
      dropOffAddress: customerAddress(order),
      goodsInfo: {
        amount: order.subTotal,
      },
      receiver: customerContact(order),
    },
    "delivery",
  );
  const { trackingNumber } = delivery;

  const { error: updateError } = await supabaseAdmin
    .from("Order")
    .update({
      bostaOrderID: delivery.id,
      bostaTrackingNumber: trackingNumber,
      bostaTrackingUrl: trackingNumber
        ? bostaTrackingUrl(trackingNumber)
        : null,
      shippingStatus: "ready_for_pickup",
    })
    .eq("id", orderID);

  if (updateError) {
    throw new Error(
      `Bosta created delivery ${trackingNumber ?? delivery.id}, but the order could not be updated. Update it manually before retrying.`,
    );
  }

  return { trackingNumber };
}

/**
 * Books a Bosta "customer return pickup" for a delivered order whose return
 * the customer requested: the courier collects the items, pays the customer
 * `refundAmount` (whole pounds) in cash, and brings the parcel back to the
 * business location.
 */
export async function createBostaReturnPickup(
  orderID: number,
  refundAmount: number,
) {
  const businessLocationId = getBusinessLocationId();
  // Fail before touching the order when Bosta isn't configured.
  getBostaApiKey();

  const order = await loadOrderForBosta(orderID);

  if (
    !canReviewReturn(order) ||
    normalizeShippingStatus(order.shippingStatus) !== "delivered"
  ) {
    throw new Error("This order has no return waiting for a pickup");
  }

  const maxRefund = Math.min(Math.round(order.totalPrice), MAX_COD_AMOUNT);
  const refund = Math.round(refundAmount);
  if (!Number.isFinite(refund) || refund < 1 || refund > maxRefund) {
    throw new Error(`The refund must be between 1 and ${maxRefund} EGP`);
  }

  // Claim the return first, so a second click can't book a second pickup
  // (and a second cash refund).
  const { data: claimed, error: claimError } = await supabaseAdmin
    .from("Order")
    .update({ returnStatus: "pickup_scheduled", refundAmount: refund })
    .eq("id", orderID)
    .eq("returnStatus", order.returnStatus!)
    .select("id")
    .maybeSingle();

  if (claimError || !claimed) {
    throw new Error(
      claimError?.message ?? "This return is already being booked",
    );
  }

  let pickup: Awaited<ReturnType<typeof postDelivery>>;
  try {
    pickup = await postDelivery(
      {
        type: 25, // CUSTOMER_RETURN_PICKUP
        // Where the courier brings the returned parcel.
        businessLocationId,
        businessReference: `${order.id}-return`,
        // Return pickups only take a refund: the cash the courier hands the
        // customer, sent as a negative amount (Bosta caps it at 30000 EGP).
        cod: -refund,
        specs: packageSpecs(order, "Coffee return"),
        pickupAddress: customerAddress(order),
        receiver: customerContact(order),
      },
      "return pickup",
    );
  } catch (err) {
    // Release the claim so the admin can fix the problem and book again.
    await supabaseAdmin
      .from("Order")
      .update({
        returnStatus: order.returnStatus,
        refundAmount: order.refundAmount,
      })
      .eq("id", orderID)
      .eq("returnStatus", "pickup_scheduled");
    throw err;
  }

  const { error: updateError } = await supabaseAdmin
    .from("Order")
    .update({
      bostaReturnID: pickup.id,
      bostaReturnTrackingNumber: pickup.trackingNumber,
    })
    .eq("id", orderID);

  if (updateError) {
    throw new Error(
      `Bosta booked return pickup ${pickup.trackingNumber ?? pickup.id}, but the order could not be updated. Add the tracking number to the order manually.`,
    );
  }

  return { trackingNumber: pickup.trackingNumber, refund };
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
