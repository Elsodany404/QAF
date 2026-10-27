import { describe, expect, it } from "vitest";

import { optionLabels } from "./orderItems";

describe("optionLabels", () => {
  const saved = [
    { id: 10, optionID: 100, label: "250g", labelAr: "250 جم" },
    { id: 6, optionID: 2, label: "Medium", labelAr: null },
  ];

  it("lists the labels saved with an order line", () => {
    expect(optionLabels(saved)).toEqual(["250g", "Medium"]);
  });

  it("prefers the Arabic label on Arabic pages, when it was saved", () => {
    expect(optionLabels(saved, "ar")).toEqual(["250 جم", "Medium"]);
    // Orders placed before Arabic labels existed.
    expect(optionLabels([{ label: "Dark" }], "ar")).toEqual(["Dark"]);
    expect(optionLabels([{ label: "Dark", labelAr: "  " }], "ar")).toEqual([
      "Dark",
    ]);
  });

  it("skips anything without a label", () => {
    expect(optionLabels([{ id: 1 }, null, "x", { label: " " }])).toEqual([]);
    expect(optionLabels("not a list")).toEqual([]);
  });
});
