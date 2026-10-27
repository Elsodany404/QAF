import crypto from "node:crypto";
import { NextResponse } from "next/server";

import { normalizePaymentStatus } from "@/lib/orderStatus";
import { createBostaDelivery } from "@/services/Bosta";
import { sendOrderConfirmation } from "@/services/OrderEmails";
import {
  parsePaymobReference,
  paymobReferenceLocale,
  toCents,
} from "@/services/Paymob";
import supabaseAdmin from "@/supabase/admin";

export const runtime = "nodejs";

type PaymobTransaction = {
  id: number;
  amount_cents: number;
  created_at: string;
  currency: string;
  error_occured: boolean;
  has_parent_transaction: boolean;
  integration_id: number;
  is_3d_secure: boolean;
  is_auth: boolean;
  is_capture: boolean;
  is_refunded: boolean;
  is_standalone_payment: boolean;
  is_voided: boolean;
  is_refund?: boolean;
  is_void?: boolean;
  owner: number;
  pending: boolean;
  success: boolean;
  order?: { id?: number; merchant_order_id?: string | number };
  source_data?: { pan?: string; sub_type?: string; type?: string };
};

// Verify HMAC using Paymob's exact field order
function verifyPaymobHmac(
  transaction: PaymobTransaction,
  receivedHmac: string | null,
): boolean {
  if (!receivedHmac) {
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

// Paymob retries on non-2xx, so only fail for errors a retry could fix.
function ack(message: string) {
  return NextResponse.json({ message }, { status: 200 });
}

export async function POST(req: Request) {
  try {
    const payload = await req.json().catch(() => null);
    const transaction: PaymobTransaction | undefined = payload?.obj;

    if (!transaction?.id) {
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
    }

    const receivedHmac = new URL(req.url).searchParams.get("hmac");

    if (!verifyPaymobHmac(transaction, receivedHmac)) {
      return NextResponse.json(
        { message: "Invalid or missing HMAC" },
        { status: 401 },
      );
    }

    // Refund / void callbacks: refunds are made by hand in the Paymob
    // dashboard, and the admin marks the order refunded.
    if (transaction.is_refund || transaction.is_void) {
      return ack("Refund/void notification ignored");
    }

    // Still waiting on the customer (e.g. wallet OTP) — a final callback follows.
    if (transaction.pending) {
      return ack("Pending transaction ignored");
    }

    const orderID = parsePaymobReference(transaction.order?.merchant_order_id);
    if (!orderID) {
      return NextResponse.json(
        { message: "Merchant order ID missing" },
        { status: 400 },
      );
    }

    const { data: order, error: findError } = await supabaseAdmin
      .from("Order")
      .select("id, totalPrice, paymentStatus, shippingStatus, bostaOrderID")
      .eq("id", orderID)
      .maybeSingle();

    if (findError) {
      throw new Error(`Failed to load order ${orderID}: ${findError.message}`);
    }
    if (!order) {
      console.error(`Paymob webhook: order ${orderID} not found`);
      return ack("Unknown order");
    }

    const currentPayment = normalizePaymentStatus(order.paymentStatus);
    if (currentPayment !== "pending" && currentPayment !== "failed") {
      // Already paid / refunded — this is a retry or a stale attempt.
      return ack("Payment already processed");
    }

    const isSuccess = transaction.success === true;

    if (isSuccess && transaction.amount_cents !== toCents(order.totalPrice)) {
      console.error(
        `Paymob webhook: amount mismatch for order ${orderID}: paid ${transaction.amount_cents}, expected ${toCents(order.totalPrice)}`,
      );
      return ack("Amount mismatch — flagged for review");
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("Order")
      .update({
        paymentStatus: isSuccess ? "paid" : "failed",
        paymobTransactionID: String(transaction.id),
        paymobOrderID:
          transaction.order?.id != null ? String(transaction.order.id) : null,
      })
      .eq("id", orderID)
      .in("paymentStatus", ["pending", "failed"])
      .select("id")
      .maybeSingle();

    if (updateError) {
      throw new Error(`Failed to update order: ${updateError.message}`);
    }
    if (!updated) {
      return ack("Payment already processed");
    }

    if (isSuccess && !order.bostaOrderID) {
      if (order.shippingStatus === "cancelled") {
        // Customer paid after cancelling: the dashboard lists it under
        // "Needs action" so the admin can arrange a refund on WhatsApp.
        console.error(`Paymob webhook: order ${orderID} paid after cancel`);
      } else {
        try {
          await createBostaDelivery(orderID);
        } catch (err) {
          // The admin can create the shipment from the dashboard.
          console.error(`Bosta delivery for order ${orderID} failed:`, err);
        }

        // The conditional update above only succeeds once per order, so the
        // customer gets exactly one confirmation, in the checkout's language.
        await sendOrderConfirmation(
          orderID,
          paymobReferenceLocale(transaction.order?.merchant_order_id),
        );
      }
    }

    return ack("Webhook processed successfully");
  } catch (err: unknown) {
    console.error("Paymob webhook error:", err);

    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
