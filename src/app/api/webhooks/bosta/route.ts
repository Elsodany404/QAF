import crypto from "node:crypto";
import { NextResponse } from "next/server";

import {
  bostaRtoStateToShippingStatus,
  bostaStateToShippingStatus,
  bostaTrackingUrl,
  normalizeShippingStatus,
  shouldApplyShippingUpdate,
} from "@/lib/orderStatus";
import supabaseAdmin from "@/supabase/admin";
import type { OrderUpdate } from "@/types/db";

export const runtime = "nodejs";

// Reads and conditional writes per webhook before giving up (see below).
const MAX_ATTEMPTS = 3;

/*
 * Bosta posts the delivery at the top level:
 * {
 *   "_id": "Bosta delivery id",
 *   "trackingNumber": "...",
 *   "state": 45,                      // numeric state code, see lib/orderStatus
 *   "type": "SEND | EXCHANGE | CUSTOMER_RETURN_PICKUP | RTO | ...",
 *   "cod": 250,                       // only in Delivered state
 *   "timeStamp": "...",
 *   "isConfirmedDelivery": true,
 *   "exceptionReason": "...",          // only in Exception state
 *   "businessReference": "our order id",
 * }
 * A delivery the customer didn't take comes back as type "RTO".
 */
type BostaWebhookPayload = {
  _id: string;
  trackingNumber?: string | number;
  state?: number | string;
  type?: string;
  businessReference?: string;
  exceptionReason?: string;
};

function isAuthorized(req: Request) {
  const secret = process.env.BOSTA_SECRET_KEY;
  if (!secret) {
    throw new Error("BOSTA_SECRET_KEY is not configured");
  }

  const received = Buffer.from(req.headers.get("Authorization") ?? "");
  const expected = Buffer.from(secret);
  return (
    received.length === expected.length &&
    crypto.timingSafeEqual(received, expected)
  );
}

const reply = (message: string) =>
  NextResponse.json({ message }, { status: 200 });

/*
 * Both updates below only apply if the status is still the one we read.
 * When another webhook for the same delivery wins that race, read the order
 * again and re-decide instead of dropping this update (a lost "delivered"
 * would leave a cash order unpaid).
 */

const DELIVERY_ORDER_FIELDS =
  "id, paymentMethod, shippingStatus, bostaTrackingNumber, bostaExceptionReason";

/**
 * The order a delivery belongs to. Matched on the Bosta delivery id we
 * stored, not on businessReference, so return / exchange shipments for the
 * same order can't overwrite it. A delivery coming back to us (RTO) keeps
 * its tracking number, in case Bosta gives it a new id.
 */
async function findDeliveryOrder(delivery: BostaWebhookPayload) {
  const byID = await supabaseAdmin
    .from("Order")
    .select(DELIVERY_ORDER_FIELDS)
    .eq("bostaOrderID", delivery._id)
    .maybeSingle();
  if (byID.error || byID.data || delivery.type !== "RTO") return byID;
  if (delivery.trackingNumber == null) return byID;

  return supabaseAdmin
    .from("Order")
    .select(DELIVERY_ORDER_FIELDS)
    .eq("bostaTrackingNumber", String(delivery.trackingNumber))
    .maybeSingle();
}

/** Why Bosta flagged the delivery ("Customer is not answering."), if it said. */
function exceptionReason(delivery: BostaWebhookPayload): string | null {
  const reason =
    typeof delivery.exceptionReason === "string"
      ? delivery.exceptionReason.trim()
      : "";
  return reason ? reason.slice(0, 300) : null;
}

/** A delivery to the customer (and its return to us if it fails). */
async function updateDelivery(delivery: BostaWebhookPayload) {
  const nextStatus =
    delivery.type === "RTO"
      ? bostaRtoStateToShippingStatus(delivery.state)
      : bostaStateToShippingStatus(delivery.state);
  if (!nextStatus) return reply("No change");
  const reason = nextStatus === "exception" ? exceptionReason(delivery) : null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const { data: order, error: findError } = await findDeliveryOrder(delivery);

    if (findError) {
      throw new Error(`Failed to load order: ${findError.message}`);
    }
    if (!order) return reply("Unknown delivery");

    const currentStatus = normalizeShippingStatus(order.shippingStatus);
    const updates: OrderUpdate = {};

    if (shouldApplyShippingUpdate(currentStatus, nextStatus)) {
      updates.shippingStatus = nextStatus;
      // A new issue replaces the reason of an earlier one.
      if (nextStatus === "exception") updates.bostaExceptionReason = reason;

      if (!order.bostaTrackingNumber && delivery.trackingNumber) {
        const trackingNumber = String(delivery.trackingNumber);
        updates.bostaTrackingNumber = trackingNumber;
        updates.bostaTrackingUrl = bostaTrackingUrl(trackingNumber);
      }

      // The courier collected the cash, so a COD order is now paid.
      if (
        nextStatus === "delivered" &&
        order.paymentMethod === "cash_on_delivery"
      ) {
        updates.paymentStatus = "paid";
      }
    } else if (
      currentStatus === "exception" &&
      nextStatus === "exception" &&
      reason !== null &&
      reason !== order.bostaExceptionReason
    ) {
      // Another failed attempt, for a new reason.
      updates.bostaExceptionReason = reason;
    } else {
      return reply("No change");
    }

    const { data: updated, error } = await supabaseAdmin
      .from("Order")
      .update(updates)
      .eq("id", order.id)
      .eq("shippingStatus", order.shippingStatus)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to update order ${order.id}: ${error.message}`);
    }
    if (updated) return reply("ok");
  }

  // Still contended: fail so Bosta sends it again later.
  throw new Error(`Order for delivery ${delivery._id} kept changing`);
}

export async function POST(req: Request) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const delivery: Partial<BostaWebhookPayload> | null = await req
      .json()
      .catch(() => null);

    if (!delivery?._id) {
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
    }

    // Returns are arranged with the customer on WhatsApp; a return pickup
    // booked in Bosta's dashboard doesn't change the order here. (Its state
    // codes also mean something else: 41 is "heading back to you".)
    if (delivery.type === "CUSTOMER_RETURN_PICKUP") {
      return reply("Return pickups aren't tracked");
    }
    return await updateDelivery(delivery as BostaWebhookPayload);
  } catch (err) {
    console.error("Bosta webhook error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
