import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getBostaFees: vi.fn() }));
vi.mock("@/services/Bosta", () => ({ getBostaFees: mocks.getBostaFees }));

const { GET } = await import("./route");

const quote = (query: string) =>
  GET(new NextRequest(`https://shop.test/api/payment-fees?${query}`));

beforeEach(() => {
  mocks.getBostaFees.mockReset().mockResolvedValue(65);
});

describe("GET /api/payment-fees", () => {
  it("quotes Bosta's price for a delivery city and cash amount", async () => {
    const response = await quote("dropOffCity=Cairo&cod=924");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, shippingFees: 65 });
    expect(mocks.getBostaFees).toHaveBeenCalledWith("Cairo", 924);
  });

  it("treats a missing cash amount as prepaid", async () => {
    await quote("dropOffCity=Cairo");
    expect(mocks.getBostaFees).toHaveBeenCalledWith("Cairo", 0);
  });

  it.each(["", "dropOffCity=", "dropOffCity=Atlantis", "dropOffCity=cairo"])(
    "only prices real delivery cities (%j)",
    async (query) => {
      const response = await quote(query);

      expect(response.status).toBe(400);
      // The endpoint is public and uses our Bosta key.
      expect(mocks.getBostaFees).not.toHaveBeenCalled();
    },
  );

  it.each(["-1", "abc", "Infinity"])(
    "rejects a cash amount of %s",
    async (cod) => {
      const response = await quote(`dropOffCity=Cairo&cod=${cod}`);

      expect(response.status).toBe(400);
      expect(mocks.getBostaFees).not.toHaveBeenCalled();
    },
  );

  it("answers 502 when Bosta can't price it", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.getBostaFees.mockRejectedValue(new Error("Bosta down"));

    const response = await quote("dropOffCity=Cairo&cod=0");

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      error: "Couldn't calculate shipping right now",
    });
  });
});
