/*
 * Remote locations product images may be served from. next/image throws
 * while rendering an image from any other host, which would take down every
 * page listing that product. next.config.ts builds images.remotePatterns from
 * this list, and the admin "Add product" action rejects URLs outside it.
 */

type ImageSource = { hostname: string; pathnamePrefix: string };

export function remoteImageSources(): ImageSource[] {
  const sources: ImageSource[] = [
    { hostname: "images.pexels.com", pathnamePrefix: "/photos/" },
  ];

  // Product images live in this project's Supabase storage.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    sources.push({
      hostname: new URL(supabaseUrl).hostname,
      pathnamePrefix: "/storage/v1/object/",
    });
  }
  return sources;
}

export function isAllowedImageUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }

  return (
    url.protocol === "https:" &&
    remoteImageSources().some(
      (source) =>
        url.hostname === source.hostname &&
        url.pathname.startsWith(source.pathnamePrefix),
    )
  );
}
