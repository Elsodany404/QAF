import type { Locale } from "../i18n/config";
import { CATEGORIES } from "../types/customTypes";
import type { OptionValue, Product } from "../types/db";

/**
 * "turkish" → "Turkish Coffee", in English (the dashboard). The storefront
 * uses categoryName() from src/i18n/catalog.ts. Unknown IDs are shown as they
 * are.
 */
export function categoryLabel(categoryID: string | null | undefined) {
  if (!categoryID) return "";
  return CATEGORIES.find((c) => c.id === categoryID)?.label ?? categoryID;
}

export function calcPrice(product: Product, options: OptionValue[]) {
  const basePrice = product.price;
  // Modifiers compound: each one scales the price set by the others, so
  // "+40% for 100% Arabica" is 40% of the 500g price, not of the base price.
  const multiplier = options.reduce(
    (acc, curr) => acc * (1 + (curr?.priceModifier ?? 0)),
    1,
  );
  const finalPrice = basePrice * multiplier;

  // Drop floating-point noise before rounding up: 200 * (1 + 0.1) is
  // 220.00000000000003, which Math.ceil alone would turn into 221.
  return Math.ceil(Math.round(finalPrice * 100) / 100);
}

/**
 * Cart line ID for a product with the given option values. The values are
 * sorted, so the same choice made on a product card and on the product page
 * lands on the same cart line.
 */
export function generateItemID(productID: number, valueIDs: number[]) {
  const sorted = [...valueIDs].sort((a, b) => a - b);
  return `${productID}:${sorted.join(":")}`;
}

const amountFormat = new Intl.NumberFormat("en-EG", {
  maximumFractionDigits: 0,
});

const CURRENCY: Record<Locale, string> = { en: "EGP", ar: "ج.م" };

/**
 * "1,250 EGP", or "1,250 ج.م" on Arabic pages: Western digits in both, like
 * the phone and order numbers. (The previous "ar-US" format prefixed an
 * invisible RTL mark.)
 */
export function formatCurrency(amount: number, locale: Locale = "en"): string {
  return `${amountFormat.format(amount)} ${CURRENCY[locale]}`;
}
