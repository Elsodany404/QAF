import { normalizeShippingStatus } from "@/lib/orderStatus";
import { siteUrl } from "@/lib/siteUrl";
import supabaseAdmin from "@/supabase/admin";
import type { OrderQuery } from "@/types/customTypes";

/*
 * Server-only Paymob integration. These functions do NOT check who is calling
 * them — callers (server actions, webhooks) are responsible for authorization.
 * Do not import this file from a client component.
 */

const PAYMOB_API_URL = "https://accept.paymob.com";

export function toCents(amount: number) {
  return Math.round(amount * 100);
}

/**
 * Paymob requires a unique special_reference per intention, so a retried
 * payment gets a suffix. The webhook only needs the leading order ID.
 */
export function parsePaymobReference(reference: unknown): number | null {
  const orderID = Number.parseInt(String(reference ?? ""), 10);
  return Number.isSafeInteger(orderID) && orderID > 0 ? orderID : null;
}

/** Creates a Paymob intention and returns the hosted checkout URL. */
export async function createPaymobCheckout(order: OrderQuery): Promise<string> {
  const secretKey = process.env.PAYMOB_SECRET_KEY;
  const publicKey = process.env.NEXT_PUBLIC_PAYMOB_PUBLIC_KEY;
  if (!secretKey || !publicKey) {
    throw new Error("Paymob payment configuration is incomplete");
  }

  const integrationIDValue =
    order.paymentMethod === "paymob_card"
      ? process.env.PAYMOB_CARD_INTEGRATION_ID
      : order.paymentMethod === "mobile_wallet"
        ? process.env.PAYMOB_MOBILE_WALLET_INTEGRATION_ID
        : null;
  const integrationID = Number.parseInt(integrationIDValue ?? "", 10);

  if (Number.isNaN(integrationID)) {
    throw new Error("Unsupported or unconfigured payment method");
  }

  const amount = toCents(order.totalPrice);
  let items = [
    ...order.orderItems.map((item) => ({
      name: item.productName,
      amount: toCents(item.totalPrice / item.quantity),
      description: item.product?.description || item.productName,
      quantity: item.quantity,
    })),
    {
      name: "Shipping",
      amount: toCents(order.shippingFees),
      description: "Shipping fee",
      quantity: 1,
    },
  ];

  // Paymob rejects intentions whose items don't add up to the amount; fall
  // back to a single line if per-unit rounding ever causes a mismatch.
  const itemsTotal = items.reduce((sum, i) => sum + i.amount * i.quantity, 0);
  if (itemsTotal !== amount) {
    items = [
      {
        name: `Qaf Coffee order #${order.id}`,
        amount,
        description: "Coffee order including shipping",
        quantity: 1,
      },
    ];
  }

  const nameParts = order.customerName.trim().split(/\s+/);

  const response = await fetch(`${PAYMOB_API_URL}/v1/intention/`, {
    method: "POST",
    headers: {
      Authorization: `Token ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount,
      currency: "EGP",
      payment_methods: [integrationID],
      items,
      billing_data: {
        first_name: nameParts[0] || "Customer",
        last_name: nameParts.slice(1).join(" ") || "Customer",
        email: order.customerEmail,
        phone_number: order.customerPhone,
        city: order.city,
        state: order.district,
        street: order.street,
        building: order.apartment,
        apartment: order.apartment,
        floor: "NA",
        country: "EG",
      },
      special_reference: `${order.id}-${Date.now()}`,
      expiration: 3600,
      // Paymob must reach the webhook publicly, so always use the configured
      // site address rather than whatever host the request came in on.
      notification_url: siteUrl("/api/webhooks/paymob"),
      redirection_url: siteUrl(`/order-success/${order.id}`),
    }),
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);
  const clientSecret =
    typeof data?.client_secret === "string" ? data.client_secret : null;

  if (!response.ok || !clientSecret) {
    throw new Error(
      typeof data?.detail === "string"
        ? data.detail
        : typeof data?.details === "string"
          ? data.details
          : "Paymob could not create the payment",
    );
  }

  return (
    `${PAYMOB_API_URL}/unifiedcheckout/` +
    `?publicKey=${encodeURIComponent(publicKey)}` +
    `&clientSecret=${encodeURIComponent(clientSecret)}`
  );
}

/**
 * Refunds a cancelled, paid Paymob order in full. Returns of delivered
 * orders are refunded in cash by Bosta instead (see createBostaReturnPickup).
 * The order row is claimed with a "refunding" status first so two
 * concurrent refunds cannot both go through.
 */
export async function refundPaymobOrder(orderID: number) {
  const secretKey = process.env.PAYMOB_SECRET_KEY;
  if (!secretKey) throw new Error("Paymob secret key is not configured");

  const { data: order, error: orderError } = await supabaseAdmin
    .from("Order")
    .select(
      "id, totalPrice, paymentStatus, paymobTransactionID, shippingStatus",
    )
    .eq("id", orderID)
    .single();

  if (orderError || !order) {
    throw new Error(orderError?.message ?? "Order not found");
  }
  if (order.paymentStatus !== "paid" || !order.paymobTransactionID) {
    throw new Error("Order has no successful Paymob payment");
  }
  if (normalizeShippingStatus(order.shippingStatus) !== "cancelled") {
    throw new Error(
      "Only cancelled orders are refunded through Paymob. Returns are refunded in cash by Bosta.",
    );
  }

  const amountCents = toCents(order.totalPrice);
  if (amountCents <= 0) {
    throw new Error("This order has nothing to refund");
  }

  const { data: claimed, error: claimError } = await supabaseAdmin
    .from("Order")
    .update({ paymentStatus: "refunding" })
    .eq("id", orderID)
    .eq("paymentStatus", "paid")
    .select("id")
    .maybeSingle();

  if (claimError || !claimed) {
    throw new Error(claimError?.message ?? "A refund is already in progress");
  }

  let responseData: {
    success?: boolean;
    detail?: string;
    message?: string;
  } | null;
  let ok: boolean;
  try {
    const response = await fetch(
      `${PAYMOB_API_URL}/api/acceptance/void_refund/refund`,
      {
        method: "POST",
        headers: {
          Authorization: `Token ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transaction_id: order.paymobTransactionID,
          amount_cents: String(amountCents),
        }),
        cache: "no-store",
      },
    );
    responseData = await response.json().catch(() => null);
    ok = response.ok && responseData?.success === true;
  } catch {
    // Network failure: we cannot know whether Paymob processed it, so leave
    // the order in "refunding" for a human to verify.
    throw new Error("Refund result is uncertain; check Paymob before retrying");
  }

  if (!ok) {
    await supabaseAdmin
      .from("Order")
      .update({ paymentStatus: "paid" })
      .eq("id", orderID)
      .eq("paymentStatus", "refunding");

    throw new Error(
      responseData?.detail ??
        responseData?.message ??
        "Paymob could not process the refund",
    );
  }

  const { error: finalizeError } = await supabaseAdmin
    .from("Order")
    .update({ paymentStatus: "refunded" })
    .eq("id", orderID)
    .eq("paymentStatus", "refunding");

  if (finalizeError) {
    throw new Error(
      "Paymob accepted the refund, but the order could not be updated. Mark it refunded manually.",
    );
  }
}
