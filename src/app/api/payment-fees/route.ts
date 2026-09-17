import { NextRequest, NextResponse } from "next/server";
import { calculateBostaFees } from "@/services/Bosta";

export async function GET(request: NextRequest) {
  const dropOffCity = request.nextUrl.searchParams.get("dropOffCity");
  const cod = Number(request.nextUrl.searchParams.get("cod") || 0);

  if (!dropOffCity) {
    return NextResponse.json(
      { error: "dropOffCity is required" },
      { status: 400 },
    );
  }

  if (!Number.isFinite(cod) || cod < 0) {
    return NextResponse.json({ error: "Invalid COD amount" }, { status: 400 });
  }

  try {
    const shippingFees = await calculateBostaFees(dropOffCity, cod);

    return NextResponse.json({
      success: true,
      shippingFees,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unexpected error happened",
      },
      { status: 500 },
    );
  }
}
