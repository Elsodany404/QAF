import { NextResponse } from "next/server";
import supabaseAdmin from "@/supabase/admin";

// State Name	Dashboard State Name	Type	State Code
// Pickup requested	New	All (Except Cash Collection)	10
// Waiting for route	In progress	Cash Collection	11
// Route Assigned	In progress	All Types	20
// Picking up from consignee	Heading to customer	CRP, Exchange	22
// Picking up	Heading to customer	Cash Collection	40
// Picked up from business	Picked up	Send, Exchange	21
// Picked up from consignee	Picked up	CRP, Exchange	23
// Picked up	Heading to customer	Send, Fulfillment Send,	41
// Picked up	Heading to you	Exchange, CRP, RTO	41
// Received at warehouse	In progress	All (Except Cash Collection)	24
// Fulfilled	Fulfilled	Fulfillment	25
// In transit between Hubs	In progress	All (Except Cash Collection)	30
// Delivered	Successful	Send, Fulfillment Send, Cash Collection	45
// Returned to business	Successful	Exchange, CRP, RTO	46
// Exception	In progress	All Types	47
// Canceled	In progress	All Types	49
// Terminated	Terminated	All Types	48
// Lost	Unsuccessful	All Types	100
// Damaged	Unsuccessful	All Except (Cash Collection)	101
// Returned to stock	Returned	Fulfillment	60
// Investigation	In progress	All	102
// Awaiting your action	Awaiting your action	Exchange, CRP, RTO	103
// Archived	Archived	All (Except Cash Collection)	104
// On hold	In progress	All (Except Cash Collection)	105
const bostaStateMap: Record<string, string> = {
  "10": "pickup_requested",
  "11": "waiting_for_route",
  "20": "route_assigned",
  "22": "picking_up_from_consignee",
  "40": "picking_up",
  "21": "picked_up_from_business",
  "23": "picked_up_from_consignee",
  "41": "picked_up",
  "24": "received_at_warehouse",
  "25": "fulfilled",
  "30": "in_transit_between_hubs",
  "45": "delivered",
  "46": "returned_to_business",
  "47": "exception",
  "49": "canceled",
  "48": "terminated",
  "100": "lost",
  "101": "damaged",
  "60": "returned_to_stock",
  "102": "investigation",
  "103": "awaiting_your_action",
  "104": "archived",
  "105": "on_hold",
};

function mapBostaState(stateCode: string): string {
  return bostaStateMap[stateCode] ?? "unknown";
}
export async function POST(req: Request) {
  try {
    // Optional: verify a shared secret set in your Bosta webhook settings
    const bostaSecret = process.env.BOSTA_SECRET_KEY;
    if (bostaSecret) {
      const authHeader = req.headers.get("Authorization") ?? "";
      if (authHeader !== bostaSecret) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }
    }

    const delivery = await req.json();
    // {
    //   "_id": "The order id",
    //   "trackingNumber": "The order tracking Number",
    //   "state": "A code representing the current state of the order",
    //   "type": "SEND | EXCHANGE | CUSTOMER_RETURN_PICKUP | RTO | SIGN_AND_RETURN | FXF_SEND (fulfillment)",
    //   "cod": "The amount collected from you customer", // only in Deliverd state,
    //   "timeStamp": "The timestamp at which the state was changed",
    //   "isConfirmedDelivery":"Boolean value",// Will be sent as a proof of delivery
    //   "deliveryPromiseDate":"Date in ('DD-MM-YYYY') format", // e.x 23-02-2023
    //   "exceptionReason": "Reason (NDR)", // only in Exception state,
    //   "exceptionCode":"A code representing the exception reason ",// All codes is listed below
    //   "businessReference": "The businessReference value that was sent in the creation request",
    //   "numberOfAttempts": "The number of attempts that Bosta made to deliver the shipment to your customer"
    // }
    // Bosta sends the delivery object at the top level

    const bostaOrderID = delivery._id;
    if (!bostaOrderID) {
      console.warn("Bosta webhook: missing _id", delivery);
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
    }

    const orderID = delivery.businessReference;

    if (!bostaOrderID || !orderID) {
      console.warn("Bosta webhook: missing _id", delivery);
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
    }

    const stateCode = delivery.status;

    const trackingNumber = delivery.trackingNumber;

    const trackingUrl =
      delivery.trackingUrl ??
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
