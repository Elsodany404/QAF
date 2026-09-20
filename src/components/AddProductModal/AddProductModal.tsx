import { X, Package, CheckCircle2, AlertCircle, Plus } from "lucide-react";
import styles from "./AddProductModal.module.css";
import { useFieldArray, useForm, SubmitHandler } from "react-hook-form";
import {
  AddProductResult,
  CATEGORIES,
  ProductFormInputs,
  ProductOptionFormInput,
} from "@/types/customTypes";
import { useActionState } from "react";
import { addProduct } from "@/actions/addProduct";
import OptionFields from "@/components/OptionFields/OptionFields";
import { getImageDimensions } from "@/utils/imageDimensions";

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
    formData.append("options", JSON.stringify(data.options));

    dispatchAction(formData);
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.icon}>
              <Package />
            </span>
            <h2 className={styles.title}>Add New Product</h2>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            <X />
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
                    required: "please insert product name",
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
                  step="0.01"
                  className={styles.input}
                  placeholder="e.g. 120"
                  {...register("priceRaw", {
                    minLength: {
                      value: 1,
                      message: "not valid number",
                    },
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
                placeholder="product description shown on product page"
                rows={4}
                {...register("description", {
                  required: "insert description",
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
                    required: "select from listed category",
                  })}
                >
                  <option value="">Select category…</option>
                  {CATEGORIES.map((c) => (
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
                    required: "insert valid image url",
                    validate: async (value) => {
                      const dimensions = await getImageDimensions(value);

                      if (!dimensions) return "unable to load image";
                      if (dimensions.width < 1400 || dimensions.height < 1100) {
                        return "image must be at least 1400 × 1100 px";
                      }

                      if (
                        dimensions.width % 5 !== 0 ||
                        dimensions.height % 5 !== 0
                      ) {
                        return "image dimensions must be divisible by 5 for the blurred image";
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
                    required: "insert blurred image url",
                    validate: async (value) => {
                      const productUrl = getValues("imageUrl");
                      const productDimensions =
                        await getImageDimensions(productUrl);
                      const blurredDimensions = await getImageDimensions(value);

                      if (!productDimensions || !blurredDimensions) {
                        return "unable to load image dimensions";
                      }

                      return blurredDimensions.width ===
                        productDimensions.width / 5 &&
                        blurredDimensions.height ===
                          productDimensions.height / 5
                        ? true
                        : `blurred image must be ${productDimensions.width / 5} × ${productDimensions.height / 5} px`;
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
