import { createDelivery } from "@/actions/createDelivery";
import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
);

// Verify HMAC using Paymob's exact field order
function verifyPaymobHmac(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transaction: any,
  receivedHmac: string | null,
): boolean {
  if (!transaction || !receivedHmac) {
    return false;
  }

  const secret = process.env.PAYMOB_HMAC_KEY;

  if (!secret) {
    throw new Error("PAYMOB_HMAC_KEY is missing");
  }

  const sourceData = transaction.source_data ?? {};

  const rawData = [
    transaction.amount_cents,
    transaction.created_at,
    transaction.currency,
    transaction.error_occured,
    transaction.has_parent_transaction,
    transaction.id,
    transaction.integration_id,
    transaction.is_3d_secure,
    transaction.is_auth,
    transaction.is_capture,
    transaction.is_refunded,
    transaction.is_standalone_payment,
    transaction.is_voided,
    transaction.order?.id,
    transaction.owner,
    transaction.pending,
    sourceData.pan,
    sourceData.sub_type,
    sourceData.type,
    transaction.success,
  ]
    .map((value) => String(value ?? ""))
    .join("");

  const calculatedHmac = crypto
    .createHmac("sha512", secret)
    .update(rawData, "utf8")
    .digest("hex");

  const expected = Buffer.from(calculatedHmac, "hex");
  const received = Buffer.from(receivedHmac.trim(), "hex");

  if (expected.length !== received.length) {
    return false;
  }

  return crypto.timingSafeEqual(expected, received);
}

export async function POST(req: Request) {
  console.log("paymob-webhook requested");
  try {
    const payload = await req.json();
    const transaction = payload?.obj;

    if (!transaction || !transaction.id) {
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
    }

    // Get HMAC from query, verify immediately
    const { searchParams } = new URL(req.url);

    const receivedHmac = new URL(req.url).searchParams.get("hmac");

    if (!verifyPaymobHmac(transaction, receivedHmac)) {
      return NextResponse.json(
        { message: "Invalid or missing HMAC" },
        { status: 401 },
      );
    }

    const orderId = transaction.order?.merchant_order_id;
    if (!orderId) {
      return NextResponse.json(
        { message: "Merchant order ID missing" },
        { status: 400 },
      );
    }

    const isSuccess =
      transaction.success === true && transaction.pending === false;
    const paymobTransactionID = String(transaction.id);

    // Fetch the order to check idempotency
    const { data: order, error: findError } = await supabaseAdmin
      .from("Order")
      .select("id, status, paymentStatus, paymobTransactionID, bostaOrderID")
      .eq("id", orderId)
      .single();

    if (findError || !order) {
      throw new Error(`Order ${orderId} not found`);
    }

    // Idempotency: if already paid, do nothing further
    if (order.paymentStatus === "paid") {
      if (!order.bostaOrderID) {
        const delivery = await createDelivery(orderId);

        if (delivery.status !== "success") {
          throw new Error(delivery.message);
        }
      }

      return NextResponse.json(
        { message: "Payment already processed" },
        { status: 200 },
      );
    }

    // Update order status
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from("Order")
      .update({
        status: isSuccess ? "completed" : "failed",
        paymentStatus: isSuccess ? "paid" : "failed",
        paymobTransactionID,
      })
      .eq("id", orderId)
      .select("id")
      .single();

    if (updateError || !updatedOrder) {
      throw new Error(
        `Failed to update order: ${updateError?.message || "unknown error"}`,
      );
    }

    // Only create a delivery after successful payment
    if (isSuccess) {
      const delivery = await createDelivery(orderId);

      if (delivery.status !== "success") {
        throw new Error(delivery.message);
      }
    }

    // Acknowledge Paymob
    return NextResponse.json(
      { message: "Webhook processed successfully" },
      { status: 200 },
    );
  } catch (err: unknown) {
    console.error("Paymob webhook error:", err);

    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
