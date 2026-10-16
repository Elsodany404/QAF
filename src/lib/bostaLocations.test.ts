import { describe, expect, it } from "vitest";

import {
  bilingualName,
  DELIVERY_CITIES,
  districtsByZone,
  findDeliveryAddress,
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

describe("firstParam", () => {
  it("takes the first of a repeated query parameter", () => {
    expect(firstParam(["a", "b"])).toBe("a");
    expect(firstParam("a")).toBe("a");
    expect(firstParam(undefined)).toBeUndefined();
  });
});
