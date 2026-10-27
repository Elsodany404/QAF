import { describe, expect, it } from "vitest";

import { makeOptionValue, makeProduct } from "@/test/fixtures";
import { pickDefaultValue, toDataItem, type ProductRow } from "./constructAPI";

function row(options: ProductRow["ProductOptions"]): ProductRow {
  return { ...makeProduct(), ProductOptions: options };
}

const option = (id: number, valueIDs: number[]) => ({
  optionID: {
    id,
    name: `Option ${id}`,
    nameAr: null,
    description: "",
    descriptionAr: null,
    icon: "",
    OptionValues: valueIDs.map((valueID, index) =>
      makeOptionValue({ id: valueID, optionID: id, default: index === 0 }),
    ),
  },
});

describe("toDataItem", () => {
  it("sorts options and their values by ID", () => {
    const item = toDataItem(row([option(200, [22, 21]), option(100, [12, 11])]));

    expect(item.options.map((o) => o.id)).toEqual([100, 200]);
    expect(item.options[0].values.map((v) => v.id)).toEqual([11, 12]);
    expect(item.options[1].values.map((v) => v.id)).toEqual([21, 22]);
  });

  it("handles products without options", () => {
    expect(toDataItem(row(null)).options).toEqual([]);
  });
});

describe("pickDefaultValue", () => {
  it("prefers the in-stock default", () => {
    const values = [
      makeOptionValue({ id: 1, default: false }),
      makeOptionValue({ id: 2, default: true }),
    ];
    expect(pickDefaultValue(values).id).toBe(2);
  });

  it("falls back to an in-stock value when the default is sold out", () => {
    const values = [
      makeOptionValue({ id: 1, default: true, inStock: false }),
      makeOptionValue({ id: 2, default: false, inStock: true }),
    ];
    expect(pickDefaultValue(values).id).toBe(2);
  });

  it("still returns the default when everything is sold out", () => {
    const values = [
      makeOptionValue({ id: 1, default: false, inStock: false }),
      makeOptionValue({ id: 2, default: true, inStock: false }),
    ];
    expect(pickDefaultValue(values).id).toBe(2);
  });

  it("uses the first value when no default is marked", () => {
    const values = [
      makeOptionValue({ id: 1, default: false }),
      makeOptionValue({ id: 2, default: false }),
    ];
    expect(pickDefaultValue(values).id).toBe(1);
  });
});
