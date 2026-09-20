"use server";

import {
  AddProductResult,
  CATEGORIES,
  ProductOptionFormInput,
} from "@/types/customTypes";
import supabaseAdmin from "@/supabase/admin";
import sharp from "sharp";

type ImageDimensions = {
  width: number;
  height: number;
};

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

export async function addProduct(
  prevState: AddProductResult,
  formData: FormData,
): Promise<AddProductResult> {
  try {
    const name = (formData.get("name") as string | null)?.trim();
    const description = (formData.get("description") as string | null)?.trim();
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
      console.error("All fields are required");
      return { type: "error", message: "Failed to create product" };
    }

    let options: ProductOptionFormInput[];
    try {
      options = JSON.parse(optionsRaw || "[]") as ProductOptionFormInput[];
    } catch {
      return { type: "error", message: "Failed to create product" };
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
      return { type: "error", message: "Failed to create product" };
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
      return { type: "error", message: "Failed to create product" };
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
      return { type: "error", message: "Failed to create product" };
    }

    const price = Number(priceRaw);
    if (isNaN(price) || price <= 0) {
      return { type: "error", message: "Failed to create product" };
    }

    const validCategories = CATEGORIES.filter((c) => c.id !== "all").map(
      (c) => c.id,
    );
    if (!validCategories.includes(category)) {
      console.error("invalid category");
      return { type: "error", message: "Failed to create product" };
    }

    const { data, error } = await supabaseAdmin
      .from("Product")
      .insert({
        name,
        description,
        price,
        category,
        imageUrl,
        "blurred-image": blurredImageUrl,
        featured,
        inStock,
      })
      .select("id")
      .single();

    if (error) {
      console.error(error.message);
      return { type: "error", message: "Failed to create product" };
    }

    for (const option of options) {
      const { data: optionData, error: optionError } = await supabaseAdmin
        .from("Options")
        .insert({
          name: option.name.trim(),
          description: option.description?.trim() || "",
          icon: option.icon?.trim() || "",
        })
        .select("id")
        .single();

      if (optionError || !optionData) {
        console.error(optionError?.message || "Failed to create option");
        return { type: "error", message: "Failed to create product" };
      }

      const { error: valuesError } = await supabaseAdmin
        .from("OptionValues")
        .insert(
          option.values.map((value) => ({
            optionID: optionData.id,
            label: value.label.trim(),
            priceModifier: Number(value.priceModifier) || 0,
            default: Boolean(value.default),
            inStock: value.inStock !== false,
          })),
        );

      if (valuesError) {
        console.error(valuesError.message);
        return { type: "error", message: "Failed to create product" };
      }

      const { error: relationError } = await supabaseAdmin
        .from("ProductOptions")
        .insert({ productID: data.id, optionID: optionData.id });

      if (relationError) {
        console.error(relationError.message);
        return { type: "error", message: "Failed to create product" };
      }
    }

    console.log(`Product "${name}" added successfully`);
    return {
      type: "success",
      message: "Product created",
      productID: data.id,
    };
  } catch (err) {
    console.error(err instanceof Error ? err.message : "Unexpected error");
    return {
      type: "error",
      message: "Failed to create product",
    };
  }
}
