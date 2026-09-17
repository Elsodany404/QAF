export async function calculateBostaFees(dropOffCity: string, cod: number) {
  const response = await fetch(
    `https://app.bosta.co/api/v2/pricing/shipment/calculator?dropOffCity=${encodeURIComponent(
      dropOffCity,
    )}&cod=${cod}&size=Normal`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.BOSTA_API_KEY!,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error("Failed to calculate Bosta shipping fees");
  }

  const data = await response.json();
  const shippingFees = Number(data.data.tier.cost);

  if (!Number.isFinite(shippingFees) || shippingFees < 0) {
    throw new Error("Bosta returned an invalid shipping fee");
  }
  return shippingFees;
}
