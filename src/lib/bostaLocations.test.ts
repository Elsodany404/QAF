import { describe, expect, it } from "vitest";

import {
  bilingualName,
  DELIVERY_CITIES,
  districtsByZone,
  findDeliveryAddress,
  findDeliveryCity,
  normalizeEgyptianMobile,
} from "./bostaLocations";
import { firstParam } from "./searchParams";

describe("bilingualName", () => {
  it("shows both spellings", () => {
    expect(bilingualName("Cairo", "القاهره")).toBe("Cairo · القاهره");
  });

  it("doesn't repeat a name that has no translation", () => {
    expect(bilingualName("Maadi", "Maadi")).toBe("Maadi");
    expect(bilingualName("Maadi", "")).toBe("Maadi");
  });
});

describe("districtsByZone", () => {
  it("groups every delivery district exactly once, in Bosta's order", () => {
    const city = DELIVERY_CITIES.find((c) => c.cityName === "Cairo")!;
    const zones = districtsByZone(city);

    const flattened = zones.flatMap((zone) => zone.districts);
    expect(flattened.map((d) => d.districtId)).toEqual(
      [...city.districts]
        .sort(
          (a, b) =>
            zones.findIndex((z) => z.zoneId === a.zoneId) -
            zones.findIndex((z) => z.zoneId === b.zoneId),
        )
        .map((d) => d.districtId),
    );
    expect(new Set(zones.map((z) => z.zoneId)).size).toBe(zones.length);
    for (const zone of zones) {
      expect(zone.districts.every((d) => d.zoneId === zone.zoneId)).toBe(true);
    }
  });
});

describe("findDeliveryAddress", () => {
  it("only accepts districts that belong to the city", () => {
    const [first, second] = DELIVERY_CITIES;
    expect(
      findDeliveryAddress(first.cityId, first.districts[0].districtId),
    ).not.toBeNull();
    expect(
      findDeliveryAddress(first.cityId, second.districts[0].districtId),
    ).toBeNull();
  });
});

describe("findDeliveryCity", () => {
  it("only knows cities Bosta delivers to, by exact name", () => {
    expect(findDeliveryCity("Cairo")?.cityName).toBe("Cairo");
    expect(findDeliveryCity("cairo")).toBeNull();
    expect(findDeliveryCity("Atlantis")).toBeNull();
  });

  it("lists only districts Bosta delivers to", () => {
    for (const city of DELIVERY_CITIES) {
      expect(city.dropOffAvailability).toBe(true);
      expect(city.districts.every((d) => d.dropOffAvailability)).toBe(true);
    }
  });
});

describe("normalizeEgyptianMobile", () => {
  it.each([
    ["01012345678", "01012345678"],
    ["010 1234 5678", "01012345678"],
    ["010-1234-5678", "01012345678"],
    ["(010) 1234.5678", "01012345678"],
    ["  01112345678  ", "01112345678"],
    ["01212345678", "01212345678"],
    ["01512345678", "01512345678"],
    // International forms, e.g. from browser autofill
    ["+201012345678", "01012345678"],
    ["+20 10 1234 5678", "01012345678"],
    ["00201012345678", "01012345678"],
    ["201012345678", "01012345678"],
    ["+2001012345678", "01012345678"],
    // Arabic-Indic and Persian digits
    ["٠١٠١٢٣٤٥٦٧٨", "01012345678"],
    ["+٢٠ ١٠ ١٢٣٤ ٥٦٧٨", "01012345678"],
    ["۰۱۰۱۲۳۴۵۶۷۸", "01012345678"],
  ])("reads %j as %s", (input, expected) => {
    expect(normalizeEgyptianMobile(input)).toBe(expected);
  });

  it.each([
    "",
    "0101234567", // one digit short
    "010123456789", // one digit long
    "01312345678", // no 013 network
    "02012345678", // Cairo landline
    "+441012345678", // another country
    "+2010123456789",
    "2101012345678",
    "01012345678x",
    "phone",
  ])("rejects %j", (input) => {
    expect(normalizeEgyptianMobile(input)).toBeNull();
  });
});

describe("firstParam", () => {
  it("takes the first of a repeated query parameter", () => {
    expect(firstParam(["a", "b"])).toBe("a");
    expect(firstParam("a")).toBe("a");
    expect(firstParam(undefined)).toBeUndefined();
  });
});
