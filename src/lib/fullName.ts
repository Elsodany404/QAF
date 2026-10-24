/*
 * The courier and Paymob both need a first and a last name. Shared by the
 * checkout form (checked before anything is sent) and the server.
 */

export const FULL_NAME_MESSAGE =
  "Please enter your full name: first and last name";

// Letters in any script (Arabic too, with its marks), plus the apostrophes,
// dots and hyphens names use: "O'Brien", "Abdel-Rahman", "M. Ali".
const NAME_PART = /^\p{L}[\p{L}\p{M}'’.-]*$/u;

/** "Sara Ahmed" → true; "Sara", "S A" or "Sara 2" → false. */
export function isFullName(value: string): boolean {
  const parts = value.trim().split(/\s+/);
  return (
    parts.length >= 2 &&
    parts.every((part) => NAME_PART.test(part)) &&
    parts[0].length >= 2 &&
    parts[parts.length - 1].length >= 2
  );
}
