/**
 * Fills a message's {placeholders}: format("Hi {name}", { name: "Sara" }) is
 * "Hi Sara". A placeholder without a value is left as it is.
 */
export function format(
  message: string,
  values: Record<string, string | number>,
): string {
  return message.replace(/\{(\w+)\}/g, (placeholder, key: string) =>
    Object.hasOwn(values, key) ? String(values[key]) : placeholder,
  );
}

/** The {placeholders} a message expects, e.g. ["name"] for "Hi {name}". */
export function placeholders(message: string): string[] {
  return [...message.matchAll(/\{(\w+)\}/g)].map((match) => match[1]);
}
