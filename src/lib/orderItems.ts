import type { Locale } from "@/i18n/config";

/**
 * Labels of the option values saved with an order line, in order: "250g",
 * "Medium" (or "250 جم", "وسط" in Arabic, for lines saved with their Arabic
 * label). OrderItem.options is JSON written when the order was placed, so
 * anything without a label is skipped rather than trusted.
 */
export function optionLabels(options: unknown, locale: Locale = "en"): string[] {
  if (!Array.isArray(options)) return [];
  return options
    .map((option) => {
      if (typeof option !== "object" || option === null) return "";
      const { label, labelAr } = option as { label?: unknown; labelAr?: unknown };
      if (locale === "ar" && typeof labelAr === "string" && labelAr.trim()) {
        return labelAr.trim();
      }
      return label === undefined ? "" : String(label).trim();
    })
    .filter(Boolean);
}
