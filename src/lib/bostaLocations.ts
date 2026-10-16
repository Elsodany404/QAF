import bostaAddresses from "@/assets/data/bostaDistricts.json";
import type { BostaCity, BostaDistrict } from "@/types/customTypes";

/*
 * Cities and districts Bosta delivers to. The checkout form only offers
 * these, and the server re-checks every order against them, so shipping is
 * priced and booked for the same, real address.
 */
const ALL_CITIES: BostaCity[] = bostaAddresses.data;

export const DELIVERY_CITIES: BostaCity[] = ALL_CITIES.filter(
  (city) => city.dropOffAvailability,
).map((city) => ({
  ...city,
  districts: city.districts.filter((district) => district.dropOffAvailability),
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

/** "Cairo · القاهره" — customers may look for either spelling. */
export function bilingualName(name: string, otherName?: string | null) {
  return otherName && otherName !== name ? `${name} · ${otherName}` : name;
}

export type DistrictZone = {
  zoneId: string;
  label: string;
  districts: BostaDistrict[];
};

/**
 * A city's districts grouped by Bosta zone (in Bosta's order), for <optgroup>s.
 * Large cities have hundreds of districts; the zones make them findable.
 */
export function districtsByZone(city: BostaCity): DistrictZone[] {
  const zones = new Map<string, DistrictZone>();
  for (const district of city.districts) {
    let zone = zones.get(district.zoneId);
    if (!zone) {
      zone = {
        zoneId: district.zoneId,
        label: bilingualName(district.zoneName, district.zoneOtherName),
        districts: [],
      };
      zones.set(district.zoneId, zone);
    }
    zone.districts.push(district);
  }
  return [...zones.values()];
}

/** Egyptian mobile numbers, e.g. "010 1234 5678" → "01012345678". */
export function normalizeEgyptianMobile(value: string): string | null {
  const digits = value.replace(/[\s-]/g, "");
  return /^01[0125]\d{8}$/.test(digits) ? digits : null;
}
