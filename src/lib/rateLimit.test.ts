import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createFakeSupabase } from "@/test/fakeSupabase";

const mocks = vi.hoisted(() => ({
  fake: null as ReturnType<typeof createFakeSupabase> | null,
  headers: new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }),
}));

vi.mock("@/supabase/admin", async () => {
  const { createFakeSupabase } = await import("@/test/fakeSupabase");
  mocks.fake = createFakeSupabase();
  return { default: mocks.fake.client };
});
vi.mock("next/headers", () => ({ headers: async () => mocks.headers }));

const { allowRequest } = await import("./rateLimit");
const fake = () => mocks.fake!;
const LIMIT = { max: 3, windowMs: 60_000 };
const NOW = new Date("2026-10-26T10:00:00Z").getTime();

beforeEach(() => {
  fake().reset();
  mocks.headers = new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" });
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("allowRequest", () => {
  it("counts a first visit per form and visitor", async () => {
    fake().queue("rateLimit", { data: null }, { data: null });

    expect(await allowRequest("contact", LIMIT)).toBe(true);

    const [lookup, insert] = fake().queries;
    // The client's own address: the first one a proxy forwarded.
    expect(lookup.filters).toEqual([["eq", "key", "contact|203.0.113.7"]]);
    expect(insert.operation).toBe("insert");
    expect(insert.payload).toMatchObject({
      key: "contact|203.0.113.7",
      count: 1,
      lastRequest: NOW,
    });
  });

  it("lets a visitor through until the limit", async () => {
    fake().queue(
      "rateLimit",
      { data: { id: "r1", count: 2, lastRequest: NOW - 1000 } },
      { data: null },
    );

    expect(await allowRequest("contact", LIMIT)).toBe(true);
    expect(fake().updates("rateLimit")[0].payload).toEqual({
      count: 3,
      lastRequest: NOW,
    });
  });

  it("refuses once the limit is reached", async () => {
    fake().queue("rateLimit", {
      data: { id: "r1", count: 3, lastRequest: NOW - 1000 },
    });

    expect(await allowRequest("contact", LIMIT)).toBe(false);
    expect(fake().updates("rateLimit")).toHaveLength(0);
  });

  it("starts over after a pause as long as the window", async () => {
    fake().queue(
      "rateLimit",
      { data: { id: "r1", count: 3, lastRequest: NOW - 60_001 } },
      { data: null },
    );

    expect(await allowRequest("contact", LIMIT)).toBe(true);
    expect(fake().updates("rateLimit")[0].payload).toEqual({
      count: 1,
      lastRequest: NOW,
    });
  });

  it("never locks people out because the database failed", async () => {
    fake().queue("rateLimit", { error: { message: "timeout" } });
    expect(await allowRequest("contact", LIMIT)).toBe(true);
  });

  it("falls back to x-real-ip without a forwarded address", async () => {
    mocks.headers = new Headers({ "x-real-ip": "198.51.100.4" });
    fake().queue("rateLimit", { data: null }, { data: null });

    await allowRequest("contact", LIMIT);

    expect(fake().queries[0].filters).toEqual([
      ["eq", "key", "contact|198.51.100.4"],
    ]);
  });
});
