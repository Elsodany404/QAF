/**
 * Only allow same-site relative paths as post-login destinations, so a link
 * like /sign-in?next=https://evil.example can't bounce users off-site.
 */
export function safeRedirectPath(value: unknown, fallback = "/user"): string {
  if (typeof value !== "string") return fallback;
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return fallback;
  }
  return value;
}

export function signInPath(next: string) {
  return `/sign-in?next=${encodeURIComponent(next)}`;
}
