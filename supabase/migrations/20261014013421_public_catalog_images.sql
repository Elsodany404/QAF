-- Product photos and option icons were linked with signed URLs, which expire
-- (the existing ones between July and September 2027) and would then break
-- every product image on the site. Catalog images aren't secret, so serve
-- them from public buckets with permanent URLs.
UPDATE storage.buckets SET public = true WHERE id IN ('images', 'icons');

UPDATE public."Product"
SET
  "imageUrl" = regexp_replace(
    "imageUrl",
    '/storage/v1/object/sign/([^?]+)\?.*$',
    '/storage/v1/object/public/\1'
  ),
  "blurred-image" = regexp_replace(
    "blurred-image",
    '/storage/v1/object/sign/([^?]+)\?.*$',
    '/storage/v1/object/public/\1'
  );

UPDATE public."Options"
SET icon = regexp_replace(
  icon,
  '/storage/v1/object/sign/([^?]+)\?.*$',
  '/storage/v1/object/public/\1'
);
