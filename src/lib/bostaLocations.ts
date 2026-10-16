import bostaAddresses from "@/assets/data/bostaDistricts.json";

/*
 * Cities and districts Bosta delivers to. The checkout form only offers
 * these, and the server re-checks every order against them, so shipping is
 * priced and booked for the same, real address.
 */
export const DELIVERY_CITIES = bostaAddresses.data
  .filter((city) => city.dropOffAvailability)
  .map((city) => ({
    ...city,
    districts: city.districts.filter(
      (district) => district.dropOffAvailability,
    ),
  }));

export function findDeliveryCity(cityName: string) {
  return DELIVERY_CITIES.find((city) => city.cityName === cityName) ?? null;
}

/** Resolves a city/district pair by ID; null unless Bosta delivers there. */
export function findDeliveryAddress(cityID: string, districtID: string) {
  const city = DELIVERY_CITIES.find((c) => c.cityId === cityID);
  const district = city?.districts.find((d) => d.districtId === districtID);
  return city && district ? { city, district } : null;
}

/** Egyptian mobile numbers, e.g. "010 1234 5678" → "01012345678". */
export function normalizeEgyptianMobile(value: string): string | null {
  const digits = value.replace(/[\s-]/g, "");
  return /^01[0125]\d{8}$/.test(digits) ? digits : null;
}
