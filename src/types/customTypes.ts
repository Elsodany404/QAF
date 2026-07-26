import type { Option, OptionValue, Product } from "./db";

export type OptionWithValue = Option & {
  OptionValues: OptionValue[];
};

export type ProductWithOptions = Product & {
  ProductOptions: {
    optionID: OptionWithValue;
  }[];
};
export const CATEGORIES = [
  { id: "all", label: "All Coffee" },
  { id: "turkish", label: "Turkish Coffee" },
  { id: "espresso", label: "Espresso" },
  { id: "flavored", label: "Flavored Coffee" },
  { id: "arabian & green blends", label: "Arabian & Green Blends" },
];

export type Item = {
  itemID: string;
  options: OptionValue[];
  product: Product;
  quantity: number;
  itemPrice: number;
};
