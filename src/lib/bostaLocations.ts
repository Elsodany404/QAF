import bostaAddresses from "@/assets/data/bostaDistricts.json";
import type { BostaCity, BostaDistrict } from "@/types/customTypes";

/*
 * Cities and districts Bosta delivers to (`npm run update-bosta-locations`
 * refreshes the list). The checkout form only offers these, and the server
 * re-checks every order against them, so shipping is priced and booked for
 * the same, real address.
 */
export const DELIVERY_CITIES: BostaCity[] = bostaAddresses.data;

export function findDeliveryCity(cityName: string) {
  return DELIVERY_CITIES.find((city) => city.cityName === cityName) ?? null;
}

/** Resolves a city/district pair by ID; null unless Bosta delivers there. */
export function findDeliveryAddress(cityID: string, districtID: string) {
  const city = DELIVERY_CITIES.find((c) => c.cityId === cityID);
  const district = city?.districts.find((d) => d.districtId === districtID);
  return city && district ? { city, district } : null;
}

/**
 * Bosta's upper bound for cash collected on delivery. Checkout offers cash
 * on delivery up to this total.
 */
export const MAX_COD_AMOUNT = 30000;

/**
 * Bosta refuses a delivery whose street line is 5 characters or shorter, so
 * checkout and manual orders ask for at least this many.
 */
export const MIN_STREET_LENGTH = 6;
export const STREET_TOO_SHORT_MESSAGE = `Please enter the full street address (at least ${MIN_STREET_LENGTH} characters), e.g. 12 El Nasr Street`;

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

/**
 * Egyptian mobile numbers in the local form Bosta and Paymob expect, e.g.
 * "010 1234 5678", "+20 10 1234 5678", "(010) 1234-5678" or the number in
 * Arabic digits → "01012345678". Browser autofill usually inserts the +20
 * form.
 */
export function normalizeEgyptianMobile(value: string): string | null {
  const digits = value
    // Arabic-Indic (٠-٩) and Persian (۰-۹) digits → 0-9. Both blocks start
    // at a multiple of 16 (U+0660, U+06F0), so the low 4 bits are the digit.
    .replace(/[\u0660-\u0669\u06f0-\u06f9]/g, (digit) =>
      String(digit.charCodeAt(0) & 0xf),
    )
    .replace(/[\s\-().]/g, "")
    // Country code: +20 / 0020 / 20 before the number, with or without its
    // leading 0 ("+20 10…" and "+20 010…").
    .replace(/^(?:\+|00)?200?(?=1\d{9}$)/, "0");
  return /^01[0125]\d{8}$/.test(digits) ? digits : null;
}
