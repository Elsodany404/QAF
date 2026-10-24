import { describe, expect, it } from "vitest";

import { isAllowedImageUrl, remoteImageSources } from "./imageHosts";

describe("isAllowedImageUrl", () => {
  it.each([
    "https://supabase.test/storage/v1/object/public/images/espresso.png",
    "https://supabase.test/storage/v1/object/public/icons/size.png",
    "https://images.pexels.com/photos/123/coffee.jpeg",
  ])("allows %s", (url) => {
    expect(isAllowedImageUrl(url)).toBe(true);
  });

  it.each([
    "http://supabase.test/storage/v1/object/public/images/espresso.png",
    "https://supabase.test/rest/v1/Product",
    "https://supabase.test.evil.example/storage/v1/object/public/x.png",
    "https://evil.example/storage/v1/object/public/x.png",
    "https://images.pexels.com/videos/1.mp4",
    "//supabase.test/storage/v1/object/public/x.png",
    "espresso.png",
    "",
  ])("rejects %j", (url) => {
    expect(isAllowedImageUrl(url)).toBe(false);
  });
});

it("serves product images from this project's storage", () => {
  expect(remoteImageSources()).toContainEqual({
    hostname: "supabase.test",
    pathnamePrefix: "/storage/v1/object/",
  });
});
