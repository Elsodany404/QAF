import { OptionWithValue } from "../types/customTypes";
import { OptionValue, Product } from "../types/db";

export function getOptionByName(
  name: string,
  data: OptionWithValue[],
): OptionValue[] | undefined {
  return data
    ?.find((op) => op.name === name)
    ?.OptionValues.sort((a, b) => a.id - b.id);
}
export function getOptionsDefaultValues(data: OptionWithValue[]) {
  const values = data?.map((op) => op.OptionValues)?.flatMap((arr) => [...arr]);

  return values?.filter((v) => v.default === true);
}
export function calcPrice(product: Product, options: OptionValue[]) {
  const basePrice = product.price;
  const priceModifier = options.reduce(
    (acc, curr) => acc + (curr?.priceModifier ?? 0),
    0,
  );
  const finalPrice = basePrice * (1 + priceModifier);

  return Math.ceil(finalPrice);
}
export function generateItemID(product: Product, options: OptionValue[]) {
  const optionsID = options.reduce((acc, curr) => (acc += curr.id), "");
  return `${product.id}${optionsID}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ar-US", {
    style: "currency",
    currency: "EGP",
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  }).format(amount);
}
