import "server-only";
import supabaseAdmin from "@/supabase/admin";
import {
  findDeliveryAddress,
  MAX_COD_AMOUNT,
  MIN_STREET_LENGTH,
} from "@/lib/bostaLocations";
import { parseISODate } from "@/lib/egyptDate";
import {
  bostaTrackingUrl,
  isOnlinePayment,
  normalizePaymentStatus,
} from "@/lib/orderStatus";
import { getSiteUrl } from "@/lib/siteUrl";
import type { Order } from "@/types/db";

/*
 * Server-only Bosta integration. These functions do NOT check who is calling
 * them — callers (server actions, webhooks) are responsible for authorization.
 * Do not import this file from a client component.
 */

const BOSTA_API_URL = "https://app.bosta.co/api/v2";
export { MAX_COD_AMOUNT };

function getBostaApiKey() {
  const apiKey = process.env.BOSTA_API_KEY;
  if (!apiKey) throw new Error("BOSTA_API_KEY is not configured");
  return apiKey;
}

/**
 * What the customer pays for shipping, from Bosta's price quote: Bosta's
 * full price for the parcel (delivery to that city, the fees on cash it
 * collects, and VAT), rounded up to whole pounds like product prices.
 * `tier.cost` is only the plan's base rate, the same for every city.
 */
export function shippingFeeFromQuote(quote: unknown): number {
  const price =
    typeof quote === "object" && quote !== null && "priceAfterVat" in quote
      ? Number(quote.priceAfterVat)
      : NaN;
  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Bosta returned an invalid shipping fee");
  }
  // Drop floating-point noise first: 207.48000000000002 is 208, not 209.
  return Math.ceil(Math.round(price * 100) / 100);
}

/**
 * Shipping for one normal-size parcel to `dropOffCity`, collecting `cod`
 * in cash (0 for prepaid orders).
 */
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
      // Prices rarely change: a quote is reused for 10 minutes, so choosing
      // a city at checkout and then ordering don't both wait on Bosta. Only
      // successful replies are cached.
      next: { revalidate: 600 },
    },
  );

  if (!response.ok) {
    throw new Error("Failed to calculate Bosta shipping fees");
  }

  const data = await response.json();
  return shippingFeeFromQuote(data?.data);
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

/**
 * The customer's address in Bosta's documented format: city name, district
 * by ID (with its zone when known), street and apartment. The district goes
 * by ID only: Bosta takes either an ID or a name, not both.
 */
function customerAddress(order: OrderForBosta) {
  const zoneId = findDeliveryAddress(order.cityID, order.districtID)?.district
    .zoneId;
  const street = order.street.trim();
  const apartment = order.apartment.trim();
  return {
    city: order.city,
    districtId: order.districtID,
    ...(zoneId && { zoneId }),
    // Bosta rejects a first line of 5 characters or fewer; orders since
    // checkout's own check never have one, older ones borrow the apartment.
    firstLine:
      street.length >= MIN_STREET_LENGTH || !apartment
        ? street
        : `${street}, ${apartment}`,
    ...(apartment && { apartment }),
  };
}

/**
 * Bosta posts every status change of the deliveries we create to our
 * webhook, signed with the shared secret, even if the webhook was never set
 * up in the Bosta dashboard. Only when the site is public: Bosta can't reach
 * a local development server.
 */
function webhookFields() {
  const secret = process.env.BOSTA_SECRET_KEY;
  let site: string;
  try {
    site = getSiteUrl();
  } catch {
    return {};
  }
  if (!secret || !site.startsWith("https://")) return {};
  return {
    webhookUrl: `${site}/api/webhooks/bosta`,
    webhookCustomHeaders: { Authorization: secret },
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
      body: JSON.stringify({ ...payload, ...webhookFields() }),
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

/**
 * The next days Bosta can collect parcels from the business, as YYYY-MM-DD,
 * soonest first. Bosta leaves out Fridays, holidays and today once its
 * cut-off time has passed.
 */
export async function getBostaPickupDates(days = 10): Promise<string[]> {
  const response = await fetch(
    `${BOSTA_API_URL}/pickups/available-dates?days=${days}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: getBostaApiKey(),
      },
      cache: "no-store",
    },
  );

  const body = await response.json().catch(() => null);
  if (!response.ok || body?.success !== true || !Array.isArray(body.data)) {
    throw new Error(
      body?.message ?? `Bosta couldn't list pickup dates (${response.status})`,
    );
  }
  return body.data.filter(
    (date: unknown): date is string =>
      typeof date === "string" && parseISODate(date) !== null,
  );
}

export type PickupContact = { name: string; phone: string; email?: string };

/**
 * Asks Bosta to collect `numberOfParcels` from the business location on
 * `scheduledDate` (YYYY-MM-DD). Without a contact, Bosta calls the
 * location's default contact. Resolves to the pickup's id, if Bosta sent one.
 */
export async function createBostaPickup({
  scheduledDate,
  numberOfParcels,
  contactPerson,
}: {
  scheduledDate: string;
  numberOfParcels: number;
  contactPerson?: PickupContact;
}): Promise<{ id: string | null }> {
  const businessLocationId = getBusinessLocationId();

  let response: Response;
  try {
    response = await fetch(`${BOSTA_API_URL}/pickups`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: getBostaApiKey(),
      },
      body: JSON.stringify({
        businessLocationId,
        scheduledDate,
        numberOfParcels,
        packageType: "Normal",
        ...(contactPerson && { contactPerson }),
      }),
      cache: "no-store",
    });
  } catch {
    throw new Error(
      "Bosta didn't answer, so the pickup may or may not be booked. Check the Bosta dashboard before trying again.",
    );
  }

  const body = await response.json().catch(() => null);
  if (!response.ok || body?.success !== true) {
    throw new Error(
      body?.message ?? `Bosta couldn't book the pickup (${response.status})`,
    );
  }
  const id = body.data?._id ?? body.data?.puid;
  return { id: id != null ? String(id) : null };
}
