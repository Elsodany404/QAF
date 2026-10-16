/*
 * Small, dependency-free helpers shared by server actions. Kept apart from
 * adminAccess.ts so code (and tests) can use them without loading Better Auth.
 */

export function isValidOrderID(orderID: unknown): orderID is number {
  return (
    typeof orderID === "number" && Number.isSafeInteger(orderID) && orderID > 0
  );
}

/** The message of an Error or of a Supabase error object ({ message }). */
export function errorMessage(error: unknown, fallback = "Unexpected error") {
  if (error instanceof Error) return error.message;
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return fallback;
}
