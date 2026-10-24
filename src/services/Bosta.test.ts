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
  createBostaReturnPickup,
  getBostaFees,
  terminateBostaDelivery,
} = await import("./Bosta");
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

describe("getBostaFees", () => {
  it("asks Bosta for the city and cash amount and returns the cost", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: { tier: { cost: 75 } } }));

    expect(await getBostaFees("6th of October", 924)).toBe(75);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://app.bosta.co/api/v2/pricing/shipment/calculator?dropOffCity=6th%20of%20October&cod=924&size=Normal",
    );
    expect(init).toMatchObject({
      method: "GET",
      headers: { Authorization: "bosta-key" },
      cache: "no-store",
    });
  });

  it("returns free shipping as 0, not as an error", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: { tier: { cost: 0 } } }));
    expect(await getBostaFees("Cairo", 0)).toBe(0);
  });

  it.each([
    ["no tier", { data: {} }],
    ["a text cost", { data: { tier: { cost: "cheap" } } }],
    ["a negative cost", { data: { tier: { cost: -10 } } }],
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
      dropOffAddress: {
        cityId: "c1",
        city: "Cairo",
        districtId: "d1",
        districtName: "Maadi",
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
    });
    expect(fake().updates("Order")[0].payload).toEqual({
      bostaOrderID: "bosta-1",
      bostaTrackingNumber: "987",
      bostaTrackingUrl:
        "https://bosta.co/tracking-shipments?shipment-number=987",
      shippingStatus: "ready_for_pickup",
    });
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

describe("createBostaReturnPickup", () => {
  const returning = (overrides: Record<string, unknown> = {}) => ({
    id: 42,
    customerName: "Sara Ahmed",
    customerEmail: "sara@example.com",
    customerPhone: "01012345678",
    city: "Cairo",
    cityID: "c1",
    district: "Maadi",
    districtID: "d1",
    street: "9 Road",
    apartment: "4",
    paymentMethod: "cash_on_delivery",
    paymentStatus: "paid",
    shippingStatus: "delivered",
    subTotal: 924,
    shippingFees: 60,
    totalPrice: 984,
    returnStatus: "requested",
    refundAmount: null,
    bostaOrderID: "bosta-1",
    bostaReturnID: null,
    orderItems: [{ quantity: 2 }],
    ...overrides,
  });

  const booked = () =>
    jsonResponse({
      success: true,
      data: { _id: "crp-1", trackingNumber: 555 },
    });

  it("books a pickup that refunds the customer in cash", async () => {
    fake().queue(
      "Order",
      { data: returning() },
      { data: { id: 42 } }, // claim
      { data: null }, // record the pickup
    );
    fetchMock.mockResolvedValue(booked());

    expect(await createBostaReturnPickup(42, 924)).toEqual({
      trackingNumber: "555",
      refund: 924,
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://app.bosta.co/api/v2/deliveries?apiVersion=1");
    expect(JSON.parse(init.body)).toEqual({
      type: 25,
      businessLocationId: "loc-1",
      businessReference: "42-return",
      // A refund is the cash the courier hands over: a negative amount.
      cod: -924,
      specs: {
        packageType: "Parcel",
        size: "SMALL",
        packageDetails: { itemsCount: 2, description: "Coffee return" },
      },
      pickupAddress: {
        cityId: "c1",
        city: "Cairo",
        districtId: "d1",
        districtName: "Maadi",
        firstLine: "9 Road",
        apartment: "4",
      },
      receiver: {
        firstName: "Sara",
        lastName: "Ahmed",
        phone: "01012345678",
        email: "sara@example.com",
      },
    });

    const [claim, record] = fake().updates("Order");
    expect(claim.payload).toEqual({
      returnStatus: "pickup_scheduled",
      refundAmount: 924,
    });
    expect(claim.filters).toContainEqual(["eq", "returnStatus", "requested"]);
    expect(record.payload).toEqual({
      bostaReturnID: "crp-1",
      bostaReturnTrackingNumber: "555",
    });
  });

  it("claims the return before calling Bosta", async () => {
    fake().queue("Order", { data: returning() }, { data: { id: 42 } }, {});
    fetchMock.mockImplementation(async () => {
      // By now the order is already marked as booked.
      expect(fake().updates("Order")).toHaveLength(1);
      return booked();
    });

    await createBostaReturnPickup(42, 900);
  });

  it("books again after Bosta cancelled the first pickup", async () => {
    fake().queue(
      "Order",
      {
        data: returning({
          returnStatus: "pickup_failed",
          bostaReturnID: "old",
        }),
      },
      { data: { id: 42 } },
      { data: null },
    );
    fetchMock.mockResolvedValue(booked());

    await createBostaReturnPickup(42, 500);

    expect(fake().updates("Order")[0].filters).toContainEqual([
      "eq",
      "returnStatus",
      "pickup_failed",
    ]);
  });

  it("rounds the refund to whole pounds", async () => {
    fake().queue("Order", { data: returning() }, { data: { id: 42 } }, {});
    fetchMock.mockResolvedValue(booked());

    expect(await createBostaReturnPickup(42, 499.6)).toMatchObject({
      refund: 500,
    });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).cod).toBe(-500);
  });

  it.each([0, -10, 985, Number.NaN])(
    "refuses a refund of %s (it must be 1 to the order total)",
    async (refund) => {
      fake().queue("Order", { data: returning() });

      await expect(createBostaReturnPickup(42, refund)).rejects.toThrow(
        "The refund must be between 1 and 984 EGP",
      );
      expect(fetchMock).not.toHaveBeenCalled();
      expect(fake().updates("Order")).toHaveLength(0);
    },
  );

  it("caps the refund at what Bosta can pay out", async () => {
    fake().queue("Order", { data: returning({ totalPrice: 40000 }) });

    await expect(createBostaReturnPickup(42, 30001)).rejects.toThrow(
      "between 1 and 30000 EGP",
    );
  });

  it.each([
    ["no return was requested", { returnStatus: null }],
    ["the return was declined", { returnStatus: "rejected" }],
    ["a pickup is already booked", { returnStatus: "pickup_scheduled" }],
    ["the items are already back", { returnStatus: "returned" }],
    ["the order isn't delivered", { shippingStatus: "out_for_delivery" }],
  ])("refuses when %s", async (_, overrides) => {
    fake().queue("Order", { data: returning(overrides) });

    await expect(createBostaReturnPickup(42, 500)).rejects.toThrow(
      "This order has no return waiting for a pickup",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("doesn't book twice when another click claimed it first", async () => {
    fake().queue("Order", { data: returning() }, { data: null });

    await expect(createBostaReturnPickup(42, 500)).rejects.toThrow(
      "already being booked",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("releases the claim when Bosta rejects the pickup", async () => {
    fake().queue("Order", { data: returning() }, { data: { id: 42 } }, {});
    fetchMock.mockResolvedValue(
      jsonResponse(
        { success: false, message: "CRP orders accept only refund COD values" },
        400,
      ),
    );

    await expect(createBostaReturnPickup(42, 500)).rejects.toThrow(
      "CRP orders accept only refund COD values",
    );
    const [, release] = fake().updates("Order");
    expect(release.payload).toEqual({
      returnStatus: "requested",
      refundAmount: null,
    });
    expect(release.filters).toContainEqual([
      "eq",
      "returnStatus",
      "pickup_scheduled",
    ]);
  });

  it("warns to check Bosta when it didn't answer", async () => {
    fake().queue("Order", { data: returning() }, { data: { id: 42 } }, {});
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    await expect(createBostaReturnPickup(42, 500)).rejects.toThrow(
      "Check the Bosta dashboard before trying again",
    );
  });

  it("says so when the pickup is booked but the order can't be updated", async () => {
    fake().queue(
      "Order",
      { data: returning() },
      { data: { id: 42 } },
      { error: { message: "timeout" } },
    );
    fetchMock.mockResolvedValue(booked());

    await expect(createBostaReturnPickup(42, 500)).rejects.toThrow(
      "Bosta booked return pickup 555, but the order could not be updated",
    );
  });

  it("needs the business location to send the items back to", async () => {
    vi.stubEnv("BOSTA_BUSINESS_LOCATION_ID", "");
    await expect(createBostaReturnPickup(42, 500)).rejects.toThrow(
      "BOSTA_BUSINESS_LOCATION_ID",
    );
    expect(fake().queries).toHaveLength(0);
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
