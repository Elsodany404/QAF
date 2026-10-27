import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createFakeSupabase } from "@/test/fakeSupabase";
import type { ProductOptionFormInput } from "@/types/customTypes";

const mocks = vi.hoisted(() => ({
  fake: null as ReturnType<typeof createFakeSupabase> | null,
  isAdmin: true,
  revalidatePath: vi.fn(),
  // Image size per URL, as sharp would read it.
  sizes: new Map<string, { width: number; height: number }>(),
}));

vi.mock("@/supabase/admin", async () => {
  const { createFakeSupabase } = await import("@/test/fakeSupabase");
  mocks.fake = createFakeSupabase();
  return { default: mocks.fake.client };
});
vi.mock("@/lib/adminAccess", () => ({
  isAdminUser: async () => mocks.isAdmin,
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
// The fake download below carries the URL, so sharp can look its size up.
vi.mock("sharp", () => ({
  default: (buffer: Buffer) => ({
    metadata: async () => mocks.sizes.get(buffer.toString()) ?? {},
  }),
}));

const { addProduct } = await import("./addProduct");
const fake = () => mocks.fake!;

const STORAGE = "https://supabase.test/storage/v1/object/public";
const IMAGE = `${STORAGE}/images/espresso.png`;
const BLURRED = `${STORAGE}/images/espresso-blurred.png`;
const ICON = `${STORAGE}/icons/size.png`;

function sizeOption(
  overrides: Partial<ProductOptionFormInput> = {},
): ProductOptionFormInput {
  return {
    name: " Size ",
    description: " Pick a bag ",
    icon: ICON,
    values: [
      { label: " 250g ", priceModifier: 0, default: true, inStock: true },
      { label: "500g", priceModifier: 1, default: false, inStock: true },
    ],
    ...overrides,
  };
}

function form(
  overrides: Record<string, string | null> = {},
  options: unknown = [sizeOption()],
) {
  const values: Record<string, string | null> = {
    name: " Espresso ",
    description: " Rich and dark ",
    priceRaw: "165",
    category: "espresso",
    imageUrl: IMAGE,
    blurredImageUrl: BLURRED,
    featured: "true",
    inStock: "true",
    options: JSON.stringify(options),
    ...overrides,
  };
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) {
    if (value !== null) data.append(key, value);
  }
  return data;
}

const run = (data: FormData) => addProduct({ type: "idle" }, data);

/** Queue the inserts of a product with one option. */
function queueSuccessfulInserts() {
  fake().queue("Product", { data: { id: 9 } });
  fake().queue("Options", { data: { id: 300 } });
  fake().queue("OptionValues", { data: null });
  fake().queue("ProductOptions", { data: null });
}

beforeEach(() => {
  fake().reset();
  mocks.isAdmin = true;
  mocks.revalidatePath.mockReset();
  mocks.sizes = new Map([
    [IMAGE, { width: 1500, height: 1200 }],
    [BLURRED, { width: 300, height: 240 }],
    [ICON, { width: 512, height: 512 }],
  ]);
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => ({
      ok: true,
      arrayBuffer: async () => new TextEncoder().encode(url).buffer,
    })),
  );
});
afterEach(() => vi.unstubAllGlobals());

describe("addProduct", () => {
  it("is admin-only", async () => {
    mocks.isAdmin = false;
    expect(await run(form())).toEqual({
      type: "error",
      message: "Not authorized to create products",
    });
    expect(fake().queries).toHaveLength(0);
  });

  it("saves the product, its options and values, trimmed", async () => {
    queueSuccessfulInserts();

    expect(await run(form())).toEqual({
      type: "success",
      message: "Product created",
      productID: 9,
    });

    const inserts = fake().queries.filter((q) => q.operation === "insert");
    expect(inserts.map((q) => [q.table, q.payload])).toEqual([
      [
        "Product",
        {
          name: "Espresso",
          description: "Rich and dark",
          price: 165,
          category: "espresso",
          imageUrl: IMAGE,
          "blurred-image": BLURRED,
          featured: true,
          inStock: true,
        },
      ],
      ["Options", { name: "Size", description: "Pick a bag", icon: ICON }],
      [
        "OptionValues",
        [
          {
            optionID: 300,
            label: "250g",
            priceModifier: 0,
            default: true,
            inStock: true,
          },
          {
            optionID: 300,
            label: "500g",
            priceModifier: 1,
            default: false,
            inStock: true,
          },
        ],
      ],
      ["ProductOptions", { productID: 9, optionID: 300 }],
    ]);
    // In both languages: the routes behind /products/9 and /ar/products/9.
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/en/products/9");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/ar/products/9");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/ar");
  });

  it("saves the optional Arabic text, trimmed", async () => {
    queueSuccessfulInserts();

    await run(
      form({ nameAr: " إسبريسو ", descriptionAr: " غني وداكن " }, [
        sizeOption({
          nameAr: " الحجم ",
          descriptionAr: "اختر العبوة",
          values: [
            {
              label: "250g",
              labelAr: " 250 جم ",
              priceModifier: 0,
              default: true,
              inStock: true,
            },
            // Left empty: the English label is used on the Arabic site.
            {
              label: "500g",
              labelAr: "  ",
              priceModifier: 1,
              default: false,
              inStock: true,
            },
          ],
        }),
      ]),
    );

    const inserts = fake().queries.filter((q) => q.operation === "insert");
    expect(inserts[0].payload).toMatchObject({
      name: "Espresso",
      nameAr: "إسبريسو",
      descriptionAr: "غني وداكن",
    });
    expect(inserts[1].payload).toMatchObject({
      name: "Size",
      nameAr: "الحجم",
      descriptionAr: "اختر العبوة",
    });
    const [first, second] = inserts[2].payload as Record<string, unknown>[];
    expect(first.labelAr).toBe("250 جم");
    expect(second).not.toHaveProperty("labelAr");
  });

  it("removes what it created when a later insert fails", async () => {
    fake().queue("Product", { data: { id: 9 } });
    fake().queue("Options", { data: { id: 300 } });
    fake().queue("OptionValues", { error: { message: "bad value" } });
    // Rollback deletes
    fake().queue("ProductOptions", { data: null });
    fake().queue("OptionValues", { data: null });
    fake().queue("Options", { data: null });
    fake().queue("Product", { data: null });

    expect(await run(form({}, [sizeOption({ name: "Size" })]))).toEqual({
      type: "error",
      message: 'Could not save values for "Size": bad value',
    });

    const deletes = fake().queries.filter((q) => q.operation === "delete");
    expect(deletes.map((q) => [q.table, q.filters])).toEqual([
      ["ProductOptions", [["eq", "productID", 9]]],
      ["OptionValues", [["in", "optionID", [300]]]],
      ["Options", [["in", "id", [300]]]],
      ["Product", [["eq", "id", 9]]],
    ]);
  });

  it.each([
    "name",
    "description",
    "priceRaw",
    "category",
    "imageUrl",
    "blurredImageUrl",
  ])("requires %s", async (field) => {
    expect(await run(form({ [field]: "  " }))).toMatchObject({
      type: "error",
    });
    expect(fake().queries).toHaveLength(0);
  });

  it("rejects malformed options", async () => {
    expect(await run(form({ options: "[{" }))).toEqual({
      type: "error",
      message: "Product options are malformed",
    });
  });

  it.each([
    [
      "no default value",
      {
        values: [
          { label: "250g", priceModifier: 0, default: false, inStock: true },
        ],
      },
    ],
    [
      "two default values",
      {
        values: [
          { label: "250g", priceModifier: 0, default: true, inStock: true },
          { label: "500g", priceModifier: 1, default: true, inStock: true },
        ],
      },
    ],
    ["no values", { values: [] }],
    [
      "an unlabelled value",
      {
        values: [
          { label: " ", priceModifier: 0, default: true, inStock: true },
        ],
      },
    ],
    ["no name", { name: "" }],
    ["no icon", { icon: " " }],
  ])("rejects an option with %s", async (_, overrides) => {
    expect(await run(form({}, [sizeOption(overrides)]))).toEqual({
      type: "error",
      message:
        "Every option needs a name, an icon, labelled values and exactly one default value",
    });
    expect(fake().queries).toHaveLength(0);
  });

  it("rejects options that aren't a list", async () => {
    expect(await run(form({}, { name: "Size" }))).toMatchObject({
      type: "error",
    });
  });

  it.each([-1, -0.995, 10.01, "abc"])(
    "rejects a price change of %s",
    async (priceModifier) => {
      const option = sizeOption({
        values: [
          {
            label: "250g",
            priceModifier: priceModifier as number,
            default: true,
            inStock: true,
          },
        ],
      });

      expect(await run(form({}, [option]))).toEqual({
        type: "error",
        message: "Price changes must be between -99% and +1000%",
      });
    },
  );

  it.each([
    ["an http link", { imageUrl: IMAGE.replace("https:", "http:") }],
    [
      "another host",
      { imageUrl: "https://example.com/storage/v1/object/public/x.png" },
    ],
    [
      "a lookalike host",
      {
        blurredImageUrl:
          "https://supabase.test.evil.example/storage/v1/object/x.png",
      },
    ],
    ["not a URL", { imageUrl: "espresso.png" }],
  ])("rejects images from %s", async (_, overrides) => {
    expect(await run(form(overrides))).toEqual({
      type: "error",
      message: "Images must be https links to this project's Supabase storage",
    });
  });

  it("rejects signed links, which expire", async () => {
    const signed =
      "https://supabase.test/storage/v1/object/sign/images/x.png?token=t";
    expect(await run(form({ imageUrl: signed }))).toEqual({
      type: "error",
      message: "Use the image's public URL; signed links expire",
    });
  });

  it.each([
    ["a small product photo", IMAGE, { width: 1395, height: 1100 }],
    ["sides not divisible by 5", IMAGE, { width: 1401, height: 1200 }],
    ["a blurred image of the wrong size", BLURRED, { width: 301, height: 240 }],
  ])("rejects %s", async (_, url, size) => {
    mocks.sizes.set(url, size);
    expect(await run(form())).toMatchObject({
      type: "error",
      message: expect.stringContaining("at least 1400×1100"),
    });
  });

  it("rejects icons that aren't 512×512", async () => {
    mocks.sizes.set(ICON, { width: 256, height: 256 });
    expect(await run(form())).toEqual({
      type: "error",
      message: "Option icons must be 512×512 images",
    });
  });

  it("rejects images that can't be downloaded", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false })),
    );
    expect(await run(form())).toMatchObject({ type: "error" });
  });

  it.each(["0", "-5", "165.5", "abc"])(
    "rejects a price of %s",
    async (priceRaw) => {
      expect(await run(form({ priceRaw }))).toEqual({
        type: "error",
        message: "Price must be a whole number of EGP greater than zero",
      });
      expect(fake().queries).toHaveLength(0);
    },
  );

  it.each(["all", "tea"])("rejects the category %s", async (category) => {
    expect(await run(form({ category }))).toEqual({
      type: "error",
      message: "Invalid category",
    });
  });

  it("saves a sold-out, non-featured product", async () => {
    queueSuccessfulInserts();

    await run(form({ featured: null, inStock: "false" }));

    expect(fake().queries[0].payload).toMatchObject({
      featured: false,
      inStock: false,
    });
  });
});
