import { NextRequest, NextResponse } from "next/server";
import { findDeliveryCity } from "@/lib/bostaLocations";
import { getBostaFees } from "@/services/Bosta";

export async function GET(request: NextRequest) {
  const dropOffCity = request.nextUrl.searchParams.get("dropOffCity");
  const cod = Number(request.nextUrl.searchParams.get("cod") || 0);

  // Public endpoint backed by our Bosta API key: only price real delivery
  // cities.
  if (!dropOffCity || !findDeliveryCity(dropOffCity)) {
    return NextResponse.json(
      { error: "Choose a city we deliver to" },
      { status: 400 },
    );
  }

  if (!Number.isFinite(cod) || cod < 0) {
    return NextResponse.json({ error: "Invalid COD amount" }, { status: 400 });
  }

  try {
    const shippingFees = await getBostaFees(dropOffCity, cod);

    return NextResponse.json({
      success: true,
      shippingFees,
    });
  } catch (error) {
    console.error("Shipping fee lookup failed:", error);
    return NextResponse.json(
      { error: "Couldn't calculate shipping right now" },
      { status: 502 },
    );
  }
}
