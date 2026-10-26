"use client";

import { startTransition, useActionState, useEffect } from "react";
import { useFieldArray, useForm, type SubmitHandler } from "react-hook-form";
import { AlertCircle, CheckCircle2, Package, Plus, X } from "lucide-react";

import { addProduct } from "@/actions/dashboard/addProduct";
import OptionFields from "@/components/OptionFields/OptionFields";
import { useDialog } from "@/hooks/useDialog";
import {
  CATEGORIES,
  type AddProductResult,
  type ProductFormInputs,
  type ProductOptionFormInput,
} from "@/types/customTypes";
import { getImageDimensions } from "@/utils/imageDimensions";
import styles from "./AddProductModal.module.css";

// "All Coffee" is a menu filter, not a category a product can have.
const PRODUCT_CATEGORIES = CATEGORIES.filter((c) => c.id !== "all");

type Props = {
  onClose: () => void;
};

const emptyOption = (): ProductOptionFormInput => ({
  name: "",
  description: "",
  icon: "",
  values: [{ label: "", priceModifier: 0, default: true, inStock: true }],
});

export default function AddProductModal({ onClose }: Props) {
  const initialState: AddProductResult = {
    type: "idle",
  };
  const [state, dispatchAction, isPending] = useActionState(
    addProduct,
    initialState,
  );
  const dialogRef = useDialog<HTMLDivElement>(true, onClose);

  // The server's answer shows at the top of the (long) form: bring it into view.
  useEffect(() => {
    if (state.type !== "idle") {
      dialogRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [state, dialogRef]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<ProductFormInputs>({
    defaultValues: { options: [emptyOption()] },
  });

  const {
    fields: optionFields,
    append: appendOption,
    remove: removeOption,
  } = useFieldArray({ control, name: "options" });

  const onSubmit: SubmitHandler<ProductFormInputs> = (
    data: ProductFormInputs,
  ) => {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("category", data.category);
    formData.append("description", data.description);
    formData.append("featured", String(data.featured));
    formData.append("inStock", String(data.inStock));
    formData.append("priceRaw", String(data.priceRaw));
    formData.append("imageUrl", data.imageUrl);
    formData.append("blurredImageUrl", data.blurredImageUrl);
    // The form takes price changes in percent; products store a fraction.
    const options = data.options.map((option) => ({
      ...option,
      values: option.values.map((value) => ({
        ...value,
        priceModifier: Number.isFinite(value.priceModifier)
          ? value.priceModifier / 100
          : 0,
      })),
    }));
    formData.append("options", JSON.stringify(options));

    startTransition(() => dispatchAction(formData));
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        ref={dialogRef}
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-product-title"
        tabIndex={-1}
      >
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.icon}>
              <Package aria-hidden="true" />
            </span>
            <h2 id="add-product-title" className={styles.title}>
              Add New Product
            </h2>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            <X aria-hidden="true" />
          </button>
        </div>

        {state.type === "success" ? (
          <div className={styles.successBox}>
            <CheckCircle2 className={styles.resultIcon} />
            <div>
              <p className={styles.resultMsg}>{state.message}</p>
              <p className={styles.resultMeta}>
                The product is now live on the website.
              </p>
            </div>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
            {state?.type === "error" && (
              <div className={styles.errorBox}>
                <AlertCircle className={styles.resultIcon} />
                <p className={styles.resultMsg}>{state.message}</p>
              </div>
            )}

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="name">
                  Product name *
                </label>
                <input
                  id="name"
                  type="text"
                  className={styles.input}
                  placeholder="e.g. Arabica Blend"
                  {...register("name", {
                    required: "Enter the product name",
                  })}
                />
                <span className={styles.errorText}>
                  {errors.name && errors.name.message}
                </span>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="priceRaw">
                  Price (EGP) *
                </label>
                <input
                  id="priceRaw"
                  type="number"
                  step="1"
                  min="1"
                  className={styles.input}
                  placeholder="e.g. 120"
                  {...register("priceRaw", {
                    required: "Enter the price",
                    validate: (value) =>
                      (Number.isInteger(Number(value)) && Number(value) > 0) ||
                      "The price must be a whole number above zero",
                  })}
                />
                <span className={styles.errorText}>
                  {errors.priceRaw && errors.priceRaw.message}
                </span>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="description">
                Description *
              </label>
              <textarea
                id="description"
                className={styles.textarea}
                placeholder="Shown on the product page"
                rows={4}
                {...register("description", {
                  required: "Enter a description",
                })}
              />
              <span className={styles.errorText}>
                {errors.description && errors.description.message}
              </span>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="category">
                  Category *
                </label>
                <select
                  id="category"
                  className={styles.select}
                  {...register("category", {
                    required: "Choose a category",
                  })}
                >
                  <option value="">Select category…</option>
                  {PRODUCT_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <span className={styles.errorText}>
                  {errors.category && errors.category.message}
                </span>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="imageUrl">
                  Product image URL * (minimum 1400 × 1100)
                </label>
                <input
                  id="imageUrl"
                  type="url"
                  className={styles.input}
                  placeholder="https://…"
                  {...register("imageUrl", {
                    required: "Enter the image URL",
                    validate: async (value) => {
                      const dimensions = await getImageDimensions(value);

                      if (!dimensions) return "The image couldn't be loaded";
                      if (dimensions.width < 1400 || dimensions.height < 1100) {
                        return "The image must be at least 1400 × 1100 px";
                      }

                      if (
                        dimensions.width % 5 !== 0 ||
                        dimensions.height % 5 !== 0
                      ) {
                        return "The image's width and height must be divisible by 5";
                      }

                      return true;
                    },
                  })}
                />
                <span className={styles.errorText}>
                  {errors.imageUrl?.message?.toString()}
                </span>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="blurredImageUrl">
                  Blurred image URL * (exactly 20% dimensions)
                </label>
                <input
                  id="blurredImageUrl"
                  type="url"
                  className={styles.input}
                  placeholder="https://…"
                  {...register("blurredImageUrl", {
                    required: "Enter the blurred image URL",
                    validate: async (value) => {
                      const productUrl = getValues("imageUrl");
                      const productDimensions =
                        await getImageDimensions(productUrl);
                      const blurredDimensions = await getImageDimensions(value);

                      if (!productDimensions || !blurredDimensions) {
                        return "The images couldn't be loaded";
                      }

                      return blurredDimensions.width ===
                        productDimensions.width / 5 &&
                        blurredDimensions.height ===
                          productDimensions.height / 5
                        ? true
                        : `The blurred image must be ${productDimensions.width / 5} × ${productDimensions.height / 5} px, a fifth of the product image`;
                    },
                  })}
                />
                <span className={styles.errorText}>
                  {errors.blurredImageUrl?.message?.toString()}
                </span>
              </div>
            </div>

            <div className={styles.checkRow}>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  value="true"
                  className={styles.checkbox}
                  {...register("featured")}
                />
                Featured on home page
              </label>

              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  value="true"
                  defaultChecked
                  className={styles.checkbox}
                  {...register("inStock")}
                />
                In stock
              </label>
            </div>

            <section className={styles.optionsSection}>
              <div className={styles.optionsSectionHeader}>
                <div>
                  <h3 className={styles.sectionTitle}>Product options</h3>
                  <p className={styles.sectionHint}>
                    Add choices such as size, roast, or grind.
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.addOptionButton}
                  onClick={() => appendOption(emptyOption())}
                >
                  <Plus /> Add option
                </button>
              </div>

              <div className={styles.optionsList}>
                {optionFields.map((field, optionIndex) => (
                  <OptionFields
                    key={field.id}
                    control={control}
                    optionIndex={optionIndex}
                    register={register}
                    setValue={setValue}
                    errors={errors}
                    removeOption={removeOption}
                  />
                ))}
              </div>
            </section>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={isPending}
              >
                {isPending ? "Adding…" : "Add Product"}
              </button>
            </div>
          </form>
        )}

        {state.type === "success" && (
          <div className={styles.doneActions}>
            <button
              type="button"
              className={styles.closeBtn2}
              onClick={onClose}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
