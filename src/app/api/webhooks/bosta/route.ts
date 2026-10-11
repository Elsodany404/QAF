import crypto from "node:crypto";
import { NextResponse } from "next/server";

import {
  bostaStateToShippingStatus,
  bostaTrackingUrl,
  normalizeShippingStatus,
  shouldApplyShippingUpdate,
} from "@/lib/orderStatus";
import supabaseAdmin from "@/supabase/admin";
import type { OrderUpdate } from "@/types/db";

export const runtime = "nodejs";

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
  _id?: string;
  trackingNumber?: string | number;
  state?: number | string;
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

export async function POST(req: Request) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const delivery: BostaWebhookPayload | null = await req
      .json()
      .catch(() => null);

    if (!delivery?._id) {
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
    }

    // Match on the Bosta delivery id we stored, not on businessReference, so
    // return / exchange shipments for the same order can't overwrite it.
    const { data: order, error: findError } = await supabaseAdmin
      .from("Order")
      .select("id, paymentMethod, shippingStatus, bostaTrackingNumber")
      .eq("bostaOrderID", delivery._id)
      .maybeSingle();

    if (findError) {
      throw new Error(`Failed to load order: ${findError.message}`);
    }
    if (!order) {
      return NextResponse.json(
        { message: "Unknown delivery" },
        { status: 200 },
      );
    }

    const nextStatus = bostaStateToShippingStatus(delivery.state);
    const currentStatus = normalizeShippingStatus(order.shippingStatus);

    if (!nextStatus || !shouldApplyShippingUpdate(currentStatus, nextStatus)) {
      return NextResponse.json({ message: "No change" }, { status: 200 });
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

    const { error } = await supabaseAdmin
      .from("Order")
      .update(updates)
      .eq("id", order.id)
      .eq("shippingStatus", order.shippingStatus);

    if (error) {
      throw new Error(`Failed to update order ${order.id}: ${error.message}`);
    }

    return NextResponse.json({ message: "ok" }, { status: 200 });
  } catch (err) {
    console.error("Bosta webhook error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
