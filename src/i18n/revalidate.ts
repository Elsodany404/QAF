import { revalidatePath } from "next/cache";

import { LOCALES, routePath } from "./config";

/**
 * revalidatePath() for a page in every language. It needs the routes that
 * render the page (/en/user, /ar/user), not its address (/user): the proxy
 * rewrites English addresses.
 */
export function revalidateEveryLanguage(path: string) {
  for (const locale of LOCALES) {
    revalidatePath(routePath(locale, path));
  }
}
