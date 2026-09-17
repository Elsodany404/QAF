"use client";

import { useTransition, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { X, Package, CheckCircle2, AlertCircle } from "lucide-react";
import { addProduct } from "@/actions/addProduct";
import { CATEGORIES } from "@/types/customTypes";
import styles from "./AddProductModal.module.css";

interface Props {
  onClose: () => void;
}

export default function AddProductModal({ onClose }: Props) {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResult(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await addProduct(undefined, formData);
      if (res.status === "success") {
        setResult({ type: "success", message: res.message });
        queryClient.invalidateQueries({ queryKey: ["products"] });
      } else {
        setResult({ type: "error", message: res.message });
      }
    });
  }

  const productCategories = CATEGORIES.filter((c) => c.id !== "all");

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

        {result?.type === "success" ? (
          <div className={styles.successBox}>
            <CheckCircle2 className={styles.resultIcon} />
            <div>
              <p className={styles.resultMsg}>{result.message}</p>
              <p className={styles.resultMeta}>
                The product is now live on the website.
              </p>
            </div>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            {result?.type === "error" && (
              <div className={styles.errorBox}>
                <AlertCircle className={styles.resultIcon} />
                <p className={styles.resultMsg}>{result.message}</p>
              </div>
            )}

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="prod-name">
                  Product name *
                </label>
                <input
                  id="prod-name"
                  name="name"
                  className={styles.input}
                  placeholder="e.g. Arabica Blend"
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="prod-price">
                  Price (EGP) *
                </label>
                <input
                  id="prod-price"
                  name="price"
                  type="number"
                  min="1"
                  step="0.01"
                  className={styles.input}
                  placeholder="e.g. 120"
                  required
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="prod-desc">
                Description *
              </label>
              <textarea
                id="prod-desc"
                name="description"
                className={styles.textarea}
                placeholder="Short product description shown on the menu"
                rows={3}
                required
              />
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="prod-category">
                  Category *
                </label>
                <select
                  id="prod-category"
                  name="category"
                  className={styles.select}
                  required
                >
                  <option value="">Select category…</option>
                  {productCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="prod-image">
                  Image URL *
                </label>
                <input
                  id="prod-image"
                  name="imageUrl"
                  type="url"
                  className={styles.input}
                  placeholder="https://…"
                  required
                />
              </div>
            </div>

            <div className={styles.checkRow}>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  name="featured"
                  value="true"
                  className={styles.checkbox}
                />
                Featured on home page
              </label>

              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  name="inStock"
                  value="true"
                  defaultChecked
                  className={styles.checkbox}
                />
                In stock
              </label>
            </div>

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

        {result?.type === "success" && (
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

