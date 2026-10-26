"use server";
import { errorMessage } from "@/lib/actionHelpers";
import { isAdminUser } from "@/lib/adminAccess";
import { normalizeEgyptianMobile } from "@/lib/bostaLocations";
import {
  formatISODate,
  parseISODate,
  todayInEgypt,
  weekdayOfISODate,
} from "@/lib/egyptDate";
import {
  createBostaPickup,
  getBostaPickupDates,
  type PickupContact,
} from "@/services/Bosta";
import supabaseAdmin from "@/supabase/admin";

export type CreatePickupResult =
  | { status: "success"; message: string; pickupID: string | null }
  | { status: "failed"; message: string };

const FRIDAY = 5;

/**
 * The person the courier asks for. Optional: without
 * BOSTA_PICKUP_CONTACT_NAME / _PHONE, Bosta uses the pickup location's
 * default contact.
 */
function getPickupContact(): PickupContact | undefined {
  const name = process.env.BOSTA_PICKUP_CONTACT_NAME?.trim();
  const rawPhone = process.env.BOSTA_PICKUP_CONTACT_PHONE?.trim();
  const email = process.env.BOSTA_PICKUP_CONTACT_EMAIL?.trim();

  if (!name && !rawPhone) return undefined;
  const phone = rawPhone ? normalizeEgyptianMobile(rawPhone) : null;
  if (!name || !phone) {
    throw new Error(
      "The pickup contact is incomplete: BOSTA_PICKUP_CONTACT_NAME needs a name and BOSTA_PICKUP_CONTACT_PHONE an Egyptian mobile number (01xxxxxxxxx). Fix them, or remove both to use the pickup location's default contact.",
    );
  }
  return { name, phone, ...(email && { email }) };
}

/** Admin: the days Bosta can collect parcels (YYYY-MM-DD), soonest first. */
export async function getPickupDates(): Promise<string[]> {
  if (!(await isAdminUser())) {
    throw new Error("Not authorized to schedule pickups");
  }
  return getBostaPickupDates();
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

    const contactPerson = getPickupContact();

    // Dates are Egypt calendar days; the server's own clock runs in UTC.
    const today = todayInEgypt();
    const isoDate = scheduledDate ?? today;
    if (!parseISODate(isoDate)) {
      throw new Error("Pickup date must be a real date in YYYY-MM-DD format");
    }
    // ISO dates compare correctly as strings.
    if (isoDate < today) {
      throw new Error("Pickup date cannot be in the past");
    }
    if (weekdayOfISODate(isoDate) === FRIDAY) {
      throw new Error("Bosta doesn't collect on Fridays. Choose another day.");
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

    const pickup = await createBostaPickup({
      scheduledDate: isoDate,
      numberOfParcels: count,
      contactPerson,
    });

    return {
      status: "success",
      message: `Pickup for ${count} parcel${count === 1 ? "" : "s"} scheduled for ${formatISODate(isoDate)}`,
      pickupID: pickup.id,
    };
  } catch (err) {
    return {
      status: "failed",
      message: errorMessage(err, "Unexpected error happened"),
    };
  }
}
