import { constructedData, ProductQuery } from "../types/customTypes";
import { OptionValue, Product } from "../types/db";

export function constructData(data: ProductQuery): constructedData {
  const { options, ...product } = data;
  const transformedOption = options.map(({ OptionValues: values, ...rest }) => {
    const defaultValue = values?.find((v) => v.default);
    return {
      ...rest,
      values,
      defaultValue,
    };
  });
  return { product, options: transformedOption };
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
export function generateItemID(product: Product, values: OptionValue[]) {
  const valuesIDs = values.map((v) => v.id).join(":");
  return `${product.id}${valuesIDs}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ar-US", {
    style: "currency",
    currency: "EGP",
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  }).format(amount);
}

