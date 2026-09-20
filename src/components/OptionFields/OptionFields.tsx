import { Plus, Trash2 } from "lucide-react";
import {
  Control,
  FieldErrors,
  useFieldArray,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form";

import type { ProductFormInputs } from "@/types/customTypes";
import OptionValueFields from "@/components/OptionValueFields/OptionValueFields";
import { getImageDimensions } from "@/utils/imageDimensions";
import styles from "./OptionFields.module.css";

type OptionFieldsProps = {
  control: Control<ProductFormInputs>;
  optionIndex: number;
  register: UseFormRegister<ProductFormInputs>;
  setValue: UseFormSetValue<ProductFormInputs>;
  errors: FieldErrors<ProductFormInputs>;
  removeOption: (index: number) => void;
};

export default function OptionFields({
  control,
  optionIndex,
  register,
  setValue,
  errors,
  removeOption,
}: OptionFieldsProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `options.${optionIndex}.values`,
  });

  return (
    <fieldset className={styles.optionCard}>
      <div className={styles.optionHeader}>
        <legend className={styles.optionTitle}>Option {optionIndex + 1}</legend>
        <button
          type="button"
          className={styles.removeButton}
          onClick={() => removeOption(optionIndex)}
          aria-label={`Remove option ${optionIndex + 1}`}
        >
          <Trash2 />
        </button>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label
            className={styles.label}
            htmlFor={`option-${optionIndex}-name`}
          >
            Option name *
          </label>
          <input
            id={`option-${optionIndex}-name`}
            className={styles.input}
            placeholder="e.g. Size"
            {...register(`options.${optionIndex}.name`, {
              required: "insert option name",
            })}
          />
        </div>

        <div className={styles.field}>
          <label
            className={styles.label}
            htmlFor={`option-${optionIndex}-icon`}
          >
            Icon URL * (exactly 512 × 512)
          </label>
          <input
            id={`option-${optionIndex}-icon`}
            type="url"
            className={styles.input}
            placeholder="https://…"
            {...register(`options.${optionIndex}.icon`, {
              required: "insert a 512 × 512 icon url",
              validate: async (value) => {
                const dimensions = await getImageDimensions(value);

                if (!dimensions) return "unable to load icon";

                return dimensions.width === 512 && dimensions.height === 512
                  ? true
                  : "icon must be exactly 512 × 512 px";
              },
            })}
          />
          <span className={styles.errorText}>
            {errors.options?.[optionIndex]?.icon?.message?.toString()}
          </span>
        </div>
      </div>

      <div className={styles.field}>
        <label
          className={styles.label}
          htmlFor={`option-${optionIndex}-description`}
        >
          Description
        </label>
        <input
          id={`option-${optionIndex}-description`}
          className={styles.input}
          placeholder="How this option changes the product"
          {...register(`options.${optionIndex}.description`)}
        />
      </div>

      <div className={styles.valuesHeader}>
        <span className={styles.label}>Option values *</span>
        <button
          type="button"
          className={styles.addValueButton}
          onClick={() =>
            append({
              label: "",
              priceModifier: 0,
              default: false,
              inStock: true,
            })
          }
        >
          <Plus /> Add value
        </button>
      </div>

      <div className={styles.valuesList}>
        {fields.map((field, valueIndex) => (
          <OptionValueFields
            key={field.id}
            optionIndex={optionIndex}
            valueIndex={valueIndex}
            register={register}
            setDefault={(selectedValueIndex) => {
              fields.forEach((_, index) => {
                setValue(
                  `options.${optionIndex}.values.${index}.default`,
                  index === selectedValueIndex,
                  { shouldDirty: true },
                );
              });
            }}
            remove={remove}
            isOnlyValue={fields.length === 1}
          />
        ))}
      </div>
    </fieldset>
  );
}
