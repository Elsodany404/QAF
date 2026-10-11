"use server";
import { formatDate } from "@/utils/helper";
import { errorMessage, isAdminUser } from "@/lib/adminAccess";
import supabaseAdmin from "@/supabase/admin";

export type CreatePickupResult =
  | { status: "success"; message: string; pickupID: string }
  | { status: "failed"; message: string };

function getPickupContact() {
  const name = process.env.BOSTA_PICKUP_CONTACT_NAME?.trim();
  const phone = process.env.BOSTA_PICKUP_CONTACT_PHONE?.trim();
  const email = process.env.BOSTA_PICKUP_CONTACT_EMAIL?.trim();

  if (!name || !phone) {
    throw new Error(
      "Pickup contact is not configured. Set BOSTA_PICKUP_CONTACT_NAME and BOSTA_PICKUP_CONTACT_PHONE.",
    );
  }
  return { name, phone, ...(email && { email }) };
}

/**
 * Schedule a Bosta pickup for every order waiting for the courier.
 * @param scheduledDate - ISO date string (YYYY-MM-DD). Defaults to today.
 */
export async function createPickup(
  scheduledDate?: string,
): Promise<CreatePickupResult> {
  try {
    if (!(await isAdminUser())) {
      return {
        status: "failed",
        message: "Not authorized to schedule pickups",
      };
    }

    const businessLocationId = process.env.BOSTA_BUSINESS_LOCATION_ID;
    const apiKey = process.env.BOSTA_API_KEY;
    if (!businessLocationId || !apiKey) {
      throw new Error("Bosta pickup configuration is incomplete");
    }
    const contactPerson = getPickupContact();

    let pickupDate = new Date();
    if (scheduledDate) {
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(scheduledDate);
      if (!match) {
        throw new Error("Pickup date must use YYYY-MM-DD format");
      }

      const [, year, month, day] = match.map(Number);
      pickupDate = new Date(year, month - 1, day);
      if (
        pickupDate.getFullYear() !== year ||
        pickupDate.getMonth() !== month - 1 ||
        pickupDate.getDate() !== day
      ) {
        throw new Error("Pickup date is invalid");
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (pickupDate < today) {
      throw new Error("Pickup date cannot be in the past");
    }

    const { count, error: countError } = await supabaseAdmin
      .from("Order")
      .select("id", { count: "exact", head: true })
      .eq("shippingStatus", "ready_for_pickup");

    if (countError) {
      throw new Error(`Could not count parcels: ${countError.message}`);
    }
    if (!count) {
      throw new Error("No orders are waiting for the courier");
    }

    const formattedDate = formatDate(pickupDate);

    const pickupRes = await fetch("https://app.bosta.co/api/v2/pickups", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey,
      },
      body: JSON.stringify({
        businessLocationId,
        scheduledDate: formattedDate,
        contactPerson,
        numberOfParcels: count,
        packageType: "Normal",
      }),
      cache: "no-store",
    });

    const pickupObj = await pickupRes.json().catch(() => null);

    if (!pickupRes.ok || !pickupObj?.success) {
      throw new Error(
        `Failed to schedule pickup: ${pickupObj?.message ?? pickupRes.status}`,
      );
    }

    return {
      status: "success",
      message: `Pickup for ${count} parcel${count === 1 ? "" : "s"} scheduled for ${formattedDate}`,
      pickupID: pickupObj.data?._id ?? pickupObj._id ?? "unknown",
    };
  } catch (err) {
    return {
      status: "failed",
      message: errorMessage(err, "Unexpected error happened"),
    };
  }
}
