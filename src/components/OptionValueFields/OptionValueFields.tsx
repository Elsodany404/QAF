"use client";

import { Trash2 } from "lucide-react";
import type { UseFormRegister } from "react-hook-form";

import type { ProductFormInputs } from "@/types/customTypes";
import styles from "./OptionValueFields.module.css";

type OptionValueFieldsProps = {
  optionIndex: number;
  valueIndex: number;
  register: UseFormRegister<ProductFormInputs>;
  labelError?: string;
  setDefault: (valueIndex: number) => void;
  remove: (index: number) => void;
  isOnlyValue: boolean;
};

export default function OptionValueFields({
  optionIndex,
  valueIndex,
  register,
  labelError,
  setDefault,
  remove,
  isOnlyValue,
}: OptionValueFieldsProps) {
  return (
    <div className={styles.valueRow}>
      <input
        className={`${styles.input} ${labelError ? styles.inputError : ""}`}
        placeholder="e.g. 250g"
        aria-label={`Value ${valueIndex + 1} label`}
        aria-invalid={Boolean(labelError)}
        title={labelError}
        {...register(`options.${optionIndex}.values.${valueIndex}.label`, {
          required: "Enter a label",
        })}
      />
      <input
        className={styles.input}
        dir="rtl"
        lang="ar"
        placeholder="250 جم"
        aria-label={`Value ${valueIndex + 1} Arabic label (optional)`}
        title="Arabic label (optional)"
        {...register(`options.${optionIndex}.values.${valueIndex}.labelAr`)}
      />
      <input
        className={styles.input}
        type="number"
        step="any"
        aria-label={`Value ${valueIndex + 1} price change in percent`}
        placeholder="Price change %"
        {...register(
          `options.${optionIndex}.values.${valueIndex}.priceModifier`,
          { valueAsNumber: true },
        )}
      />
      <label className={styles.checkLabel}>
        <input
          type="checkbox"
          className={styles.checkbox}
          {...register(`options.${optionIndex}.values.${valueIndex}.default`)}
          onChange={() => setDefault(valueIndex)}
        />
        Default
      </label>
      <label className={styles.checkLabel}>
        <input
          type="checkbox"
          className={styles.checkbox}
          defaultChecked
          {...register(`options.${optionIndex}.values.${valueIndex}.inStock`)}
        />
        In stock
      </label>
      <button
        type="button"
        className={styles.removeValueButton}
        onClick={() => remove(valueIndex)}
        disabled={isOnlyValue}
        aria-label={`Remove value ${valueIndex + 1}`}
      >
        <Trash2 />
      </button>
    </div>
  );
}
