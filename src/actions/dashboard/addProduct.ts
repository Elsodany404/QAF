"use server";

import sharp from "sharp";

import { revalidateEveryLanguage } from "@/i18n/revalidate";
import { isAdminUser } from "@/lib/adminAccess";
import { isAllowedImageUrl } from "@/lib/imageHosts";
import supabaseAdmin from "@/supabase/admin";
import {
  CATEGORIES,
  type AddProductResult,
  type ProductOptionFormInput,
} from "@/types/customTypes";
import type { ImageDimensions } from "@/utils/imageDimensions";

// An option value changes the price by this fraction of the base price.
// Below -1 the price would be zero or negative; above 10 (+1000%) it's
// almost certainly a typo (e.g. 50 meant as +50 EGP).
const MIN_PRICE_MODIFIER = -0.99;
const MAX_PRICE_MODIFIER = 10;

async function getImageDimensions(
  url: string,
): Promise<ImageDimensions | null> {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;

    const metadata = await sharp(
      Buffer.from(await response.arrayBuffer()),
    ).metadata();
    if (!metadata.width || !metadata.height) return null;

    return { width: metadata.width, height: metadata.height };
  } catch {
    return null;
  }
}

function fail(message: string): AddProductResult {
  return { type: "error", message };
}

/**
 * The optional Arabic version of a field, as columns to insert: left out
 * when empty, so the insert also works before the Arabic columns exist.
 */
function arabic<Key extends string>(key: Key, value: unknown) {
  const text = typeof value === "string" ? value.trim() : "";
  return (text ? { [key]: text } : {}) as Partial<Record<Key, string>>;
}

/** Removes a partially created product so a failed insert leaves no orphans. */
async function rollbackProduct(productID: number, optionIDs: number[]) {
  await supabaseAdmin
    .from("ProductOptions")
    .delete()
    .eq("productID", productID);
  if (optionIDs.length > 0) {
    await supabaseAdmin.from("OptionValues").delete().in("optionID", optionIDs);
    await supabaseAdmin.from("Options").delete().in("id", optionIDs);
  }
  await supabaseAdmin.from("Product").delete().eq("id", productID);
}

export async function addProduct(
  prevState: AddProductResult,
  formData: FormData,
): Promise<AddProductResult> {
  try {
    if (!(await isAdminUser())) {
      return fail("Not authorized to create products");
    }

    const name = (formData.get("name") as string | null)?.trim();
    const description = (formData.get("description") as string | null)?.trim();
    const nameAr = formData.get("nameAr");
    const descriptionAr = formData.get("descriptionAr");
    const priceRaw = formData.get("priceRaw") as string | null;
    const category = formData.get("category") as string | null;
    const imageUrl = (formData.get("imageUrl") as string | null)?.trim();
    const blurredImageUrl = (
      formData.get("blurredImageUrl") as string | null
    )?.trim();
    const optionsRaw = formData.get("options") as string | null;
    const featured = formData.get("featured") === "true";
    const inStock = formData.get("inStock") !== "false";

    if (
      !name ||
      !description ||
      !priceRaw ||
      !category ||
      !imageUrl ||
      !blurredImageUrl
    ) {
      return fail("All product fields are required");
    }

    let options: ProductOptionFormInput[];
    try {
      options = JSON.parse(optionsRaw || "[]") as ProductOptionFormInput[];
    } catch {
      return fail("Product options are malformed");
    }

    if (
      !Array.isArray(options) ||
      options.some(
        (option) =>
          !option.name?.trim() ||
          !option.icon?.trim() ||
          !Array.isArray(option.values) ||
          option.values.length === 0 ||
          option.values.filter((value) => value.default).length !== 1 ||
          option.values.some((value) => !value.label?.trim()),
      )
    ) {
      return fail(
        "Every option needs a name, an icon, labelled values and exactly one default value",
      );
    }

    if (
      options.some((option) =>
        option.values.some((value) => {
          const modifier = Number(value.priceModifier ?? 0);
          return (
            !Number.isFinite(modifier) ||
            modifier < MIN_PRICE_MODIFIER ||
            modifier > MAX_PRICE_MODIFIER
          );
        }),
      )
    ) {
      return fail("Price changes must be between -99% and +1000%");
    }

    const imageUrls = [
      imageUrl,
      blurredImageUrl,
      ...options.map((option) => option.icon.trim()),
    ];
    // next/image can only render images from the configured hosts; anything
    // else would break every page that lists the product.
    if (!imageUrls.every(isAllowedImageUrl)) {
      return fail(
        "Images must be https links to this project's Supabase storage",
      );
    }
    // Signed storage links expire, and the images would break with them.
    if (
      imageUrls.some((url) =>
        new URL(url).pathname.startsWith("/storage/v1/object/sign/"),
      )
    ) {
      return fail("Use the image's public URL; signed links expire");
    }

    const productDimensions = await getImageDimensions(imageUrl);
    const blurredDimensions = await getImageDimensions(blurredImageUrl);

    if (
      !productDimensions ||
      productDimensions.width < 1400 ||
      productDimensions.height < 1100 ||
      !blurredDimensions ||
      productDimensions.width % 5 !== 0 ||
      productDimensions.height % 5 !== 0 ||
      blurredDimensions.width !== productDimensions.width / 5 ||
      blurredDimensions.height !== productDimensions.height / 5
    ) {
      return fail(
        "Product image must be at least 1400×1100 with sides divisible by 5, and the blurred image exactly 1/5 of its size",
      );
    }

    const iconDimensions = await Promise.all(
      options.map((option) => getImageDimensions(option.icon.trim())),
    );

    if (
      iconDimensions.some(
        (dimensions) =>
          !dimensions || dimensions.width !== 512 || dimensions.height !== 512,
      )
    ) {
      return fail("Option icons must be 512×512 images");
    }

    // Product.price is an integer column (whole pounds).
    const price = Number(priceRaw);
    if (!Number.isInteger(price) || price <= 0) {
      return fail("Price must be a whole number of EGP greater than zero");
    }

    const validCategories = CATEGORIES.filter((c) => c.id !== "all").map(
      (c) => c.id,
    );
    if (!validCategories.includes(category)) {
      return fail("Invalid category");
    }

    const { data, error } = await supabaseAdmin
      .from("Product")
      .insert({
        name,
        description,
        ...arabic("nameAr", nameAr),
        ...arabic("descriptionAr", descriptionAr),
        price,
        category,
        imageUrl,
        "blurred-image": blurredImageUrl,
        featured,
        inStock,
      })
      .select("id")
      .single();

    if (error || !data) {
      return fail(
        `Could not save product: ${error?.message ?? "unknown error"}`,
      );
    }

    const createdOptionIDs: number[] = [];
    const abort = async (message: string) => {
      await rollbackProduct(data.id, createdOptionIDs);
      return fail(message);
    };

    for (const option of options) {
      const { data: optionData, error: optionError } = await supabaseAdmin
        .from("Options")
        .insert({
          name: option.name.trim(),
          description: option.description?.trim() || "",
          ...arabic("nameAr", option.nameAr),
          ...arabic("descriptionAr", option.descriptionAr),
          icon: option.icon?.trim() || "",
        })
        .select("id")
        .single();

      if (optionError || !optionData) {
        return abort(
          `Could not save option "${option.name}": ${optionError?.message ?? "unknown error"}`,
        );
      }
      createdOptionIDs.push(optionData.id);

      const { error: valuesError } = await supabaseAdmin
        .from("OptionValues")
        .insert(
          option.values.map((value) => ({
            optionID: optionData.id,
            label: value.label.trim(),
            ...arabic("labelAr", value.labelAr),
            priceModifier: Number(value.priceModifier) || 0,
            default: Boolean(value.default),
            inStock: value.inStock !== false,
          })),
        );

      if (valuesError) {
        return abort(
          `Could not save values for "${option.name}": ${valuesError.message}`,
        );
      }

      const { error: relationError } = await supabaseAdmin
        .from("ProductOptions")
        .insert({ productID: data.id, optionID: optionData.id });

      if (relationError) {
        return abort(
          `Could not link option "${option.name}": ${relationError.message}`,
        );
      }
    }

    // Show the new product on the home page and give it a product page, in
    // both languages.
    revalidateEveryLanguage("/");
    revalidateEveryLanguage(`/products/${data.id}`);
    return {
      type: "success",
      message: "Product created",
      productID: data.id,
    };
  } catch (err) {
    return fail(
      err instanceof Error ? err.message : "Failed to create product",
    );
  }
}
