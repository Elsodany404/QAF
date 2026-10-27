import type { Locale } from "./config";

/*
 * Product text in the visitor's language. The catalog stores English in
 * name/description/label and Arabic in nameAr/descriptionAr/labelAr; a
 * product without an Arabic version shows its English text on Arabic pages.
 * The Arabic fields are optional here because carts saved in the browser
 * before they existed don't have them.
 */

function pick(
  locale: Locale,
  english: string,
  arabic: string | null | undefined,
): string {
  return locale === "ar" && arabic?.trim() ? arabic : english;
}

export function productName(
  product: { name: string; nameAr?: string | null },
  locale: Locale,
) {
  return pick(locale, product.name, product.nameAr);
}

export function productDescription(
  product: { description: string; descriptionAr?: string | null },
  locale: Locale,
) {
  return pick(locale, product.description, product.descriptionAr);
}

export function optionName(
  option: { name: string; nameAr?: string | null },
  locale: Locale,
) {
  return pick(locale, option.name, option.nameAr);
}

export function optionDescription(
  option: { description: string; descriptionAr?: string | null },
  locale: Locale,
) {
  return pick(locale, option.description, option.descriptionAr);
}

export function valueLabel(
  value: { label: string; labelAr?: string | null },
  locale: Locale,
) {
  return pick(locale, value.label, value.labelAr);
}

/** "turkish" → "Turkish Coffee" / "قهوة تركي". Unknown IDs show as they are. */
export function categoryName(
  names: Record<string, string>,
  categoryID: string | null | undefined,
) {
  if (!categoryID) return "";
  return Object.hasOwn(names, categoryID) ? names[categoryID] : categoryID;
}
