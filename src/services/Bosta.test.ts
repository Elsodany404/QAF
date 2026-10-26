import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createFakeSupabase } from "@/test/fakeSupabase";

const db = vi.hoisted(() => ({
  fake: null as ReturnType<typeof createFakeSupabase> | null,
}));
vi.mock("@/supabase/admin", async () => {
  const { createFakeSupabase } = await import("@/test/fakeSupabase");
  db.fake = createFakeSupabase();
  return { default: db.fake.client };
});

const {
  createBostaDelivery,
  createBostaPickup,
  getBostaFees,
  getBostaPickupDates,
  terminateBostaDelivery,
} = await import("./Bosta");
const { DELIVERY_CITIES } = await import("@/lib/bostaLocations");
const fake = () => db.fake!;
const fetchMock = vi.fn();

const jsonResponse = (body: unknown, status = 200) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) as Response;

beforeEach(() => {
  fake().reset();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

// Trimmed from a real reply for Cairo with 1000 EGP cash on delivery.
const cairoQuote = {
  tier: { cost: 54 },
  transit: { cost: 38, originSectorId: 1, destinationSectorId: 1 },
  shippingFee: 118,
  expediteFee: { amount: 13, percentage: 0.013 },
  vat: 0.14,
  priceBeforeVat: 131,
  priceAfterVat: 149.34,
};

describe("getBostaFees", () => {
  it("asks Bosta for the city and cash amount and returns its price", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: cairoQuote }));

    expect(await getBostaFees("6th of October", 924)).toBe(150);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://app.bosta.co/api/v2/pricing/shipment/calculator?dropOffCity=6th%20of%20October&cod=924&size=Normal",
    );
    expect(init).toMatchObject({
      method: "GET",
      headers: { Authorization: "bosta-key" },
      // Quotes are reused for a while instead of asking Bosta every time.
      next: { revalidate: 600 },
    });
  });

  it("charges Bosta's full price, not the plan's base rate", async () => {
    // tier.cost is the same 54 EGP for every city; the price isn't.
    fetchMock.mockResolvedValue(
      jsonResponse({ data: { ...cairoQuote, priceAfterVat: 207.48 } }),
    );
    expect(await getBostaFees("South Sinai", 0)).toBe(208);
  });

  it("rounds up to whole pounds without floating-point noise", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ data: { priceAfterVat: 207.48000000000002 } }),
    );
    expect(await getBostaFees("Cairo", 0)).toBe(208);

    fetchMock.mockResolvedValue(jsonResponse({ data: { priceAfterVat: 134 } }));
    expect(await getBostaFees("Cairo", 0)).toBe(134);
  });

  it("returns free shipping as 0, not as an error", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: { priceAfterVat: 0 } }));
    expect(await getBostaFees("Cairo", 0)).toBe(0);
  });

  it.each([
    ["no price", { data: { tier: { cost: 54 } } }],
    ["no data", {}],
    ["a text price", { data: { priceAfterVat: "cheap" } }],
    ["a negative price", { data: { priceAfterVat: -10 } }],
  ])("rejects a response with %s", async (_, body) => {
    fetchMock.mockResolvedValue(jsonResponse(body));
    await expect(getBostaFees("Cairo", 0)).rejects.toThrow(
      "invalid shipping fee",
    );
  });

  it("fails when Bosta does", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 500));
    await expect(getBostaFees("Cairo", 0)).rejects.toThrow(
      "Failed to calculate Bosta shipping fees",
    );
  });

  it("refuses to run without an API key", async () => {
    vi.stubEnv("BOSTA_API_KEY", "");
    await expect(getBostaFees("Cairo", 0)).rejects.toThrow(
      "BOSTA_API_KEY is not configured",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("createBostaDelivery", () => {
  const order = (overrides: Record<string, unknown> = {}) => ({
    id: 42,
    customerName: "  Sara   Ahmed Ali ",
    customerEmail: "sara@example.com",
    customerPhone: "01012345678",
    city: "Cairo",
    cityID: "c1",
    district: "Maadi",
    districtID: "d1",
    street: "9 Road",
    apartment: "4",
    paymentMethod: "cash_on_delivery",
    paymentStatus: "pending",
    shippingStatus: "processing",
    subTotal: 924,
    shippingFees: 60,
    totalPrice: 984,
    bostaOrderID: null,
    orderItems: [{ quantity: 2 }, { quantity: 3 }],
    ...overrides,
  });

  const created = () =>
    jsonResponse({
      success: true,
      data: { _id: "bosta-1", trackingNumber: 987 },
    });

  it("books a cash delivery for the order total and records it", async () => {
    fake().queue("Order", { data: order() }, { data: null });
    fetchMock.mockResolvedValue(created());

    expect(await createBostaDelivery(42)).toEqual({ trackingNumber: "987" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://app.bosta.co/api/v2/deliveries?apiVersion=1");
    expect(JSON.parse(init.body)).toEqual({
      type: 10,
      businessLocationId: "loc-1",
      businessReference: "42",
      cod: 984,
      specs: {
        packageType: "Parcel",
        size: "SMALL",
        packageDetails: { itemsCount: 5, description: "Coffee Packages" },
      },
      // Bosta's documented format: the district by ID only.
      dropOffAddress: {
        city: "Cairo",
        districtId: "d1",
        firstLine: "9 Road",
        apartment: "4",
      },
      goodsInfo: { amount: 924 },
      receiver: {
        firstName: "Sara",
        lastName: "Ahmed Ali",
        phone: "01012345678",
        email: "sara@example.com",
      },
      // Status changes come to our webhook, signed with the shared secret.
      webhookUrl: "https://shop.test/api/webhooks/bosta",
      webhookCustomHeaders: { Authorization: "bosta-webhook-secret" },
    });
    expect(fake().updates("Order")[0].payload).toEqual({
      bostaOrderID: "bosta-1",
      bostaTrackingNumber: "987",
      bostaTrackingUrl:
        "https://bosta.co/tracking-shipments?shipment-number=987",
      shippingStatus: "ready_for_pickup",
    });
  });

  it("sends the district's zone with a real Bosta address", async () => {
    const city = DELIVERY_CITIES[0];
    const district = city.districts[0];
    fake().queue(
      "Order",
      {
        data: order({
          city: city.cityName,
          cityID: city.cityId,
          district: district.districtName,
          districtID: district.districtId,
        }),
      },
      { data: null },
    );
    fetchMock.mockResolvedValue(created());

    await createBostaDelivery(42);

    expect(
      JSON.parse(fetchMock.mock.calls[0][1].body).dropOffAddress,
    ).toMatchObject({
      city: city.cityName,
      districtId: district.districtId,
      zoneId: district.zoneId,
    });
  });

  it("adds the apartment to a street line Bosta would find too short", async () => {
    fake().queue(
      "Order",
      { data: order({ street: "Nasr", apartment: "Bldg 4, apt 7" }) },
      { data: null },
    );
    fetchMock.mockResolvedValue(created());

    await createBostaDelivery(42);

    expect(
      JSON.parse(fetchMock.mock.calls[0][1].body).dropOffAddress.firstLine,
    ).toBe("Nasr, Bldg 4, apt 7");
  });

  it("doesn't send Bosta a webhook it can't reach from a local site", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    fake().queue("Order", { data: order() }, { data: null });
    fetchMock.mockResolvedValue(created());

    await createBostaDelivery(42);

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).not.toHaveProperty("webhookUrl");
    expect(body).not.toHaveProperty("webhookCustomHeaders");
  });

  it("collects nothing for a paid online order", async () => {
    fake().queue(
      "Order",
      { data: order({ paymentMethod: "paymob_card", paymentStatus: "paid" }) },
      { data: null },
    );
    fetchMock.mockResolvedValue(created());

    await createBostaDelivery(42);

    expect(JSON.parse(fetchMock.mock.calls[0][1].body).cod).toBe(0);
  });

  it("rounds the cash amount to whole pounds", async () => {
    fake().queue(
      "Order",
      { data: order({ totalPrice: 976.3 }) },
      { data: null },
    );
    fetchMock.mockResolvedValue(created());

    await createBostaDelivery(42);

    expect(JSON.parse(fetchMock.mock.calls[0][1].body).cod).toBe(976);
  });

  it("uses a placeholder last name for one-word names", async () => {
    fake().queue(
      "Order",
      { data: order({ customerName: "Sara" }) },
      { data: null },
    );
    fetchMock.mockResolvedValue(created());

    await createBostaDelivery(42);

    expect(JSON.parse(fetchMock.mock.calls[0][1].body).receiver).toMatchObject({
      firstName: "Sara",
      lastName: "Customer",
    });
  });

  it.each([
    [
      "an unpaid online order",
      { paymentMethod: "paymob_card" },
      "not been paid",
    ],
    [
      "a failed online payment",
      { paymentMethod: "mobile_wallet", paymentStatus: "failed" },
      "not been paid",
    ],
    ["a cancelled order", { shippingStatus: "cancelled" }, "cancelled"],
    [
      "an order that already has a delivery",
      { bostaOrderID: "b-0" },
      "already exists",
    ],
    ["cash above Bosta's limit", { totalPrice: 30001 }, "between 1 and 30000"],
    ["a zero cash amount", { totalPrice: 0 }, "between 1 and 30000"],
  ])("refuses %s without calling Bosta", async (_, overrides, message) => {
    fake().queue("Order", { data: order(overrides) });

    await expect(createBostaDelivery(42)).rejects.toThrow(message);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(fake().updates("Order")).toHaveLength(0);
  });

  it("refuses unknown orders", async () => {
    fake().queue("Order", { data: null, error: { message: "no rows" } });
    await expect(createBostaDelivery(42)).rejects.toThrow("no rows");
  });

  it("leaves the order alone when Bosta rejects the delivery", async () => {
    fake().queue("Order", { data: order() });
    fetchMock.mockResolvedValue(
      jsonResponse({ success: false, message: "Invalid district" }, 400),
    );

    await expect(createBostaDelivery(42)).rejects.toThrow("Invalid district");
    expect(fake().updates("Order")).toHaveLength(0);
  });

  it("treats a success reply without a delivery id as a failure", async () => {
    fake().queue("Order", { data: order() });
    fetchMock.mockResolvedValue(jsonResponse({ success: true, data: {} }));

    await expect(createBostaDelivery(42)).rejects.toThrow("Bosta rejected");
  });

  it("says so when the delivery exists but the order couldn't be updated", async () => {
    fake().queue("Order", { data: order() }, { error: { message: "timeout" } });
    fetchMock.mockResolvedValue(created());

    await expect(createBostaDelivery(42)).rejects.toThrow(
      "Bosta created delivery 987, but the order could not be updated",
    );
  });

  it("needs the business location", async () => {
    vi.stubEnv("BOSTA_BUSINESS_LOCATION_ID", "");
    await expect(createBostaDelivery(42)).rejects.toThrow(
      "BOSTA_BUSINESS_LOCATION_ID",
    );
    expect(fake().queries).toHaveLength(0);
  });

  it("says when Bosta didn't answer, so nobody books twice blindly", async () => {
    fake().queue("Order", { data: order() });
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    await expect(createBostaDelivery(42)).rejects.toThrow(
      "Bosta didn't answer, so the delivery may or may not exist",
    );
    expect(fake().updates("Order")).toHaveLength(0);
  });
});

describe("terminateBostaDelivery", () => {
  it("terminates the delivery by tracking number", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true }));

    await terminateBostaDelivery("TRK 1/2");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://app.bosta.co/api/v2/deliveries/business/TRK%201%2F2/terminate",
    );
    expect(init.method).toBe("DELETE");
  });

  it("passes Bosta's reason on", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ success: false, message: "Already picked up" }, 400),
    );
    await expect(terminateBostaDelivery("T1")).rejects.toThrow(
      "Already picked up",
    );
  });

  it("fails when the reply isn't JSON", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => {
        throw new SyntaxError("Unexpected token <");
      },
    } as unknown as Response);
    await expect(terminateBostaDelivery("T1")).rejects.toThrow("(502)");
  });
});

describe("getBostaPickupDates", () => {
  it("lists the days Bosta can come, as Bosta sends them", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        success: true,
        data: ["2026-10-26", "2026-10-27", "2026-10-29", "2026-10-31"],
      }),
    );

    expect(await getBostaPickupDates()).toEqual([
      "2026-10-26",
      "2026-10-27",
      "2026-10-29",
      "2026-10-31",
    ]);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://app.bosta.co/api/v2/pickups/available-dates?days=10",
    );
    expect(init.headers).toMatchObject({ Authorization: "bosta-key" });
  });

  it("drops anything that isn't a real date", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        success: true,
        data: ["2026-10-26", "Mon, 27 Oct.", null, "2026-02-30"],
      }),
    );
    expect(await getBostaPickupDates()).toEqual(["2026-10-26"]);
  });

  it("fails with Bosta's reason", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ success: false, message: "Business not found." }, 400),
    );
    await expect(getBostaPickupDates()).rejects.toThrow("Business not found.");
  });
});

describe("createBostaPickup", () => {
  it("books the pickup for the day in Bosta's YYYY-MM-DD format", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ success: true, data: { _id: "p-1", puid: "778" } }),
    );

    expect(
      await createBostaPickup({
        scheduledDate: "2026-10-27",
        numberOfParcels: 3,
        contactPerson: { name: "Mahmoud Saif", phone: "01012345678" },
      }),
    ).toEqual({ id: "p-1" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://app.bosta.co/api/v2/pickups");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({
      businessLocationId: "loc-1",
      scheduledDate: "2026-10-27",
      numberOfParcels: 3,
      packageType: "Normal",
      contactPerson: { name: "Mahmoud Saif", phone: "01012345678" },
    });
  });

  it("leaves the contact to the pickup location's default when there's none", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ success: true, data: { puid: 778 } }),
    );

    expect(
      await createBostaPickup({ scheduledDate: "2026-10-27", numberOfParcels: 1 }),
    ).toEqual({ id: "778" });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).not.toHaveProperty(
      "contactPerson",
    );
  });

  it("passes Bosta's reason on", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        { success: false, message: "Scheduled date can not be Friday!" },
        400,
      ),
    );
    await expect(
      createBostaPickup({ scheduledDate: "2026-10-30", numberOfParcels: 1 }),
    ).rejects.toThrow("Scheduled date can not be Friday!");
  });

  it("warns to check Bosta when it didn't answer", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    await expect(
      createBostaPickup({ scheduledDate: "2026-10-27", numberOfParcels: 1 }),
    ).rejects.toThrow("Check the Bosta dashboard before trying again");
  });
});
