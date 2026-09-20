import { DataItem, ProductQuery } from "../types/customTypes";
import { OptionValue, Product } from "../types/db";

export function constructData(data: ProductQuery): DataItem {
  const { options, ...product } = data;
  const transformedOption = options.map(({ OptionValues: values, ...rest }) => {
    const defaultValue = values.filter((v) => v.default)[0];
    return {
      ...rest,
      values,
      defaultValue,
    };
  });
  return { product, options: transformedOption };
}
export function formatDate(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
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
export function generateItemID(productID: number, optionsIDs: number[]) {
  return `${productID}:${optionsIDs.join(":")}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ar-US", {
    style: "currency",
    currency: "EGP",
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  }).format(amount);
}
