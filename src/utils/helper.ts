import { OptionValue, Product } from "../types/db";

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

  // Drop floating-point noise before rounding up: 200 * (1 + 0.1) is
  // 220.00000000000003, which Math.ceil alone would turn into 221.
  return Math.ceil(Math.round(finalPrice * 100) / 100);
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
