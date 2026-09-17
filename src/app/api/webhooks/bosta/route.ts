import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
);

/**
 * Map Bosta delivery state codes to our internal shippingStatus values.
 * https://docs.bosta.co/#delivery-states
 */
function mapBostaState(stateCode: string): string {
  switch (stateCode) {
    case "PACKAGE_RECEIVED":
    case "IN_TRANSIT":
    case "OUT_FOR_DELIVERY":
      return "shipped";
    case "DELIVERED":
      return "delivered";
    case "CANCELLED":
    case "RETURNED_TO_ORIGIN":
      return "cancelled";
    case "WAITING_FOR_CUSTOMER_ACTION":
    case "EXCEPTION":
      return "exception";
    default:
      return stateCode.toLowerCase();
  }
}

export async function POST(req: Request) {
  try {
    // Optional: verify a shared secret set in your Bosta webhook settings
    const bostaSecret = process.env.BOSTA_WEBHOOK_SECRET;
    if (bostaSecret) {
      const authHeader = req.headers.get("Authorization") ?? "";
      if (authHeader !== bostaSecret) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }
    }

    const payload = await req.json();

    // Bosta sends the delivery object at the top level
    const delivery = payload;

    const bostaOrderID: string | undefined =
      delivery?._id ?? delivery?.id ?? undefined;

    // businessReference is the orderID we set in createDelivery.ts
    const orderID: string | undefined =
      delivery?.businessReference ?? undefined;

    if (!bostaOrderID || !orderID) {
      console.warn("Bosta webhook: missing _id or businessReference", payload);
      return NextResponse.json(
        { message: "Invalid payload" },
        { status: 400 },
      );
    }

    const stateCode: string =
      delivery?.state?.code ??
      delivery?.status?.code ??
      delivery?.status ??
      "";

    const trackingNumber: string | null =
      delivery?.trackingNumber ?? delivery?.bostaCourierTrackingNumber ?? null;

    const trackingUrl: string | null =
      delivery?.trackingUrl ??
      (trackingNumber
        ? `https://app.bosta.co/tracking-shipment/${trackingNumber}`
        : null);

    const shippingStatus = mapBostaState(stateCode);

    // Build the update object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = {
      shippingStatus,
      bostaOrderID,
    };

    if (trackingNumber) updates.bostaTrackingNumber = trackingNumber;
    if (trackingUrl) updates.bostaTrackingUrl = trackingUrl;

    // If the shipment was delivered, mark the overall order as completed
    if (shippingStatus === "delivered") {
      updates.status = "completed";
    }

    const { error } = await supabaseAdmin
      .from("Order")
      .update(updates)
      .eq("id", orderID);

    if (error) {
      console.error("Bosta webhook: failed to update order", error);
      return NextResponse.json(
        { message: "DB update failed" },
        { status: 500 },
      );
    }

    console.log(
      `Bosta webhook: order ${orderID} updated → shippingStatus=${shippingStatus}`,
    );

    return NextResponse.json({ message: "ok" }, { status: 200 });
  } catch (err) {
    console.error("Bosta webhook error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}

