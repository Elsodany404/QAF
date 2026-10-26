/*
 * Refreshes src/assets/data/bostaDistricts.json from Bosta's public list of
 * cities and districts. Only places Bosta delivers to are kept, with the
 * fields checkout uses, so the file stays small in the browser bundle.
 *
 *   npm run update-bosta-locations
 *
 * Bosta switches delivery on and off for districts from time to time: run
 * this every few weeks, check the summary, and commit the result.
 */
import { readFile, writeFile } from "node:fs/promises";

const EGYPT = "60e4482c7cb7d4bc4849c4d5";
const SOURCE = `https://app.bosta.co/api/v2/cities/getAllDistricts?countryId=${EGYPT}`;
const TARGET = new URL("../src/assets/data/bostaDistricts.json", import.meta.url);

const response = await fetch(SOURCE);
const body = await response.json().catch(() => null);
if (!response.ok || body?.success !== true || !Array.isArray(body.data)) {
  throw new Error(`Bosta's district list didn't load (HTTP ${response.status})`);
}

const data = body.data
  .filter((city) => city.dropOffAvailability)
  .map((city) => ({
    cityId: city.cityId,
    cityName: city.cityName,
    cityOtherName: city.cityOtherName,
    districts: city.districts
      .filter((district) => district.dropOffAvailability)
      .map((district) => ({
        zoneId: district.zoneId,
        zoneName: district.zoneName,
        zoneOtherName: district.zoneOtherName,
        districtId: district.districtId,
        districtName: district.districtName,
        districtOtherName: district.districtOtherName,
      })),
  }))
  .filter((city) => city.districts.length > 0);

const ids = (cities) =>
  new Set(cities.flatMap((c) => c.districts.map((d) => d.districtId)));
const before = await readFile(TARGET, "utf8")
  .then((text) => ids(JSON.parse(text).data))
  .catch(() => new Set());
const after = ids(data);
const added = [...after].filter((id) => !before.has(id)).length;
const removed = [...before].filter((id) => !after.has(id)).length;

await writeFile(TARGET, `${JSON.stringify({ data }, null, 2)}\n`);
console.log(
  `${data.length} cities, ${after.size} districts (${added} added, ${removed} no longer delivered to)`,
);
