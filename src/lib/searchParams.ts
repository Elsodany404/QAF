/**
 * A query parameter repeated in the URL (?a=1&a=2) arrives as an array.
 * Pages only ever want one value.
 */
export function firstParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
