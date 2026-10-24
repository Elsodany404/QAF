/**
 * Only allow same-site relative paths as post-login destinations, so a link
 * like /sign-in?next=https://evil.example can't bounce users off-site.
 */
export function safeRedirectPath(value: unknown, fallback = "/user"): string {
  if (typeof value !== "string" || !value.startsWith("/")) return fallback;

  // Resolve it the way the browser will. Browsers drop tabs and newlines
  // and read "\" as "/", so "/\t/evil.example" would become "//evil.example".
  const origin = "https://this.site";
  let url: URL;
  try {
    url = new URL(value, origin);
  } catch {
    return fallback;
  }
  if (url.origin !== origin) return fallback;

  return `${url.pathname}${url.search}${url.hash}`;
}

export function signInPath(next: string) {
  return `/sign-in?next=${encodeURIComponent(next)}`;
}
