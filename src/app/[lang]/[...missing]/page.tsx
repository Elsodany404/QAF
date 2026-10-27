import { notFound } from "next/navigation";

/*
 * Addresses that match no page: the not-found page then renders inside the
 * site's layout, in the visitor's language. It stays outside (site), whose
 * loading.tsx would stream the page before notFound() and turn the 404 into
 * a 200.
 */
export default function MissingPage() {
  notFound();
}
