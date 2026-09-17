"use server";
import { formatDate } from "@/helper/helper";

const businessLocationId = "q3g2v58sxw";

export type CreatePickupResult =
  | { status: "success"; message: string; pickupID: string }
  | { status: "failed"; message: string };

/**
 * Schedule a Bosta pickup.
 * @param scheduledDate - ISO date string (YYYY-MM-DD). Defaults to today.
 */
export async function createPickup(
  scheduledDate?: string,
): Promise<CreatePickupResult> {
  try {
    const formattedDate = scheduledDate
      ? formatDate(new Date(scheduledDate))
      : formatDate(new Date());

    const pickupOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.BOSTA_API_KEY!,
      },
      body: JSON.stringify({
        businessLocationId,
        scheduledDate: formattedDate,
        contactPerson: {
          name: "Mahmoud Saif",
          phone: "0124048400",
          email: "sales@qafcoffee.store",
        },
        numberOfParcels: 1,
        packageType: "Normal",
      }),
    };

    const pickupRes = await fetch(
      "https://app.bosta.co/api/v2/pickups",
      pickupOptions,
    );

    const pickupObj = await pickupRes.json();

    if (!pickupRes.ok || !pickupObj.success) {
      throw new Error(`Failed to schedule pickup: ${pickupObj.message}`);
    }

    return {
      status: "success",
      message: `Pickup scheduled for ${formattedDate}`,
      pickupID: pickupObj.data?._id ?? pickupObj._id ?? "unknown",
    };
  } catch (err) {
    console.error(err);
    return {
      status: "failed",
      message: err instanceof Error ? err.message : "Unexpected error happened",
    };
  }
}
