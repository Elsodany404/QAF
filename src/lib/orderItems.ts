/**
 * Labels of the option values saved with an order line, in order: "250g",
 * "Medium". OrderItem.options is JSON written when the order was placed, so
 * anything without a label is skipped rather than trusted.
 */
export function optionLabels(options: unknown): string[] {
  if (!Array.isArray(options)) return [];
  return options
    .map((option) =>
      typeof option === "object" && option !== null && "label" in option
        ? String((option as { label: unknown }).label).trim()
        : "",
    )
    .filter(Boolean);
}
