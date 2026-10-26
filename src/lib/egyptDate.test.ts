import { describe, expect, it } from "vitest";

import {
  formatISODate,
  parseISODate,
  todayInEgypt,
  weekdayOfISODate,
} from "./egyptDate";

describe("todayInEgypt", () => {
  it("is already tomorrow in Egypt late in the UTC evening", () => {
    // 23:30 UTC on 15 Oct is 01:30 (EEST, UTC+3) or 02:30 on 16 Oct in Cairo.
    expect(todayInEgypt(new Date("2026-10-15T23:30:00Z"))).toBe("2026-10-16");
  });

  it("matches the UTC date at midday", () => {
    expect(todayInEgypt(new Date("2026-01-05T12:00:00Z"))).toBe("2026-01-05");
  });
});

describe("parseISODate", () => {
  it("parses real dates", () => {
    expect(parseISODate("2026-02-28")).toEqual({ year: 2026, month: 2, day: 28 });
  });

  it("rejects impossible or malformed dates", () => {
    expect(parseISODate("2026-02-30")).toBeNull();
    expect(parseISODate("2026-13-01")).toBeNull();
    expect(parseISODate("16-10-2026")).toBeNull();
    expect(parseISODate("2026-1-5")).toBeNull();
  });
});

describe("weekdayOfISODate", () => {
  it("knows the day of the week, whatever the server's time zone", () => {
    expect(weekdayOfISODate("2026-10-30")).toBe(5); // Friday
    expect(weekdayOfISODate("2026-10-26")).toBe(1); // Monday
    expect(weekdayOfISODate("2026-02-30")).toBeNull();
  });
});

describe("formatISODate", () => {
  it("reads like a calendar day", () => {
    expect(formatISODate("2026-10-26")).toBe("Mon, 26 Oct");
    expect(formatISODate("2099-01-31")).toBe("Sat, 31 Jan");
  });

  it("leaves anything that isn't a date as it is", () => {
    expect(formatISODate("tomorrow")).toBe("tomorrow");
  });
});
