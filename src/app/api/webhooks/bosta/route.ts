import crypto from "node:crypto";
import { NextResponse } from "next/server";

import {
  bostaStateToReturnStatus,
  bostaStateToShippingStatus,
  bostaTrackingUrl,
  normalizeReturnStatus,
  normalizeShippingStatus,
  shouldApplyReturnUpdate,
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

/** A delivery to the customer (and its return to us if it fails). */
async function updateDelivery(delivery: BostaWebhookPayload) {
  const nextStatus = bostaStateToShippingStatus(delivery.state);
  if (!nextStatus) return reply("No change");

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    // Match on the Bosta delivery id we stored, not on businessReference,
    // so return / exchange shipments for the same order can't overwrite it.
    const { data: order, error: findError } = await supabaseAdmin
      .from("Order")
      .select("id, paymentMethod, shippingStatus, bostaTrackingNumber")
      .eq("bostaOrderID", delivery._id)
      .maybeSingle();

    if (findError) {
      throw new Error(`Failed to load order: ${findError.message}`);
    }
    if (!order) return reply("Unknown delivery");

    const currentStatus = normalizeShippingStatus(order.shippingStatus);
    if (!shouldApplyShippingUpdate(currentStatus, nextStatus)) {
      return reply("No change");
    }

    const updates: OrderUpdate = { shippingStatus: nextStatus };

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

/** A customer return pickup: the courier collects the items and refunds. */
async function updateReturnPickup(delivery: BostaWebhookPayload) {
  const nextStatus = bostaStateToReturnStatus(delivery.state);
  if (!nextStatus) return reply("No change");

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const { data: order, error: findError } = await supabaseAdmin
      .from("Order")
      .select("id, returnStatus")
      .eq("bostaReturnID", delivery._id)
      .maybeSingle();

    if (findError) {
      throw new Error(`Failed to load order: ${findError.message}`);
    }
    if (!order) return reply("Unknown return pickup");

    const currentStatus = normalizeReturnStatus(order.returnStatus);
    if (!shouldApplyReturnUpdate(currentStatus, nextStatus)) {
      return reply("No change");
    }

    const updates: OrderUpdate = { returnStatus: nextStatus };
    // The courier hands the customer the refund when collecting the items.
    if (nextStatus === "picked_up" || nextStatus === "returned") {
      updates.paymentStatus = "refunded";
    }
    if (nextStatus === "returned") updates.shippingStatus = "returned";

    const { data: updated, error } = await supabaseAdmin
      .from("Order")
      .update(updates)
      .eq("id", order.id)
      .eq("returnStatus", order.returnStatus!)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to update order ${order.id}: ${error.message}`);
    }
    if (updated) return reply("ok");
  }

  throw new Error(`Order for return pickup ${delivery._id} kept changing`);
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

    // The same state code means different things per delivery type (41 is
    // "out for delivery" on a send, "heading back to you" on a return).
    return delivery.type === "CUSTOMER_RETURN_PICKUP"
      ? await updateReturnPickup(delivery as BostaWebhookPayload)
      : await updateDelivery(delivery as BostaWebhookPayload);
  } catch (err) {
    console.error("Bosta webhook error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
