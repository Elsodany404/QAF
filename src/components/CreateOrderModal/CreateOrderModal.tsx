"use client";

import { useState, useTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  X,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
} from "lucide-react";
import {
  adminCreateOrder,
  AdminCreateOrderPayload,
} from "@/actions/dashboard/createManualOrder";
import { getAllProducts } from "@/services/Product";
import { formatCurrency } from "@/utils/helper";
import type { PaymentMethod } from "@/types/customTypes";
import bostaAddresses from "@/assets/data/bostaDistricts.json";
import styles from "./CreateOrderModal.module.css";

interface Props {
  onClose: () => void;
}

type Result =
  | {
      type: "success_cod";
      orderID: number;
      warning?: string;
    }
  | {
      type: "success_payment";
      orderID: number;
      paymentUrl: string;
    }
  | { type: "error"; message: string };

export default function CreateOrderModal({ onClose }: Props) {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedProductID, setSelectedProductID] = useState("");

  const { data: products = [], isPending: productsPending } = useQuery({
    queryKey: ["admin-products"],
    queryFn: getAllProducts,
  });

  // Derived city/district state for Bosta dropdowns
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");

  const availableCities = bostaAddresses.data.filter(
    (c) => c.dropOffAvailability,
  );
  const city =
    availableCities.find((c) => c.cityOtherName === selectedCity) ?? null;
  const availableDistricts =
    city?.districts.filter((d) => d.dropOffAvailability) ?? [];
  const district =
    availableDistricts.find((d) => d.districtOtherName === selectedDistrict) ??
    null;
  const selectedProduct = products.find(
    (item) => item.product.id === Number(selectedProductID),
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResult(null);

    const fd = new FormData(e.currentTarget);
    const shippingFees = Number(fd.get("shippingFees") ?? 0);
    const quantity = Number(fd.get("quantity") ?? 0);

    if (
      !city ||
      !district ||
      !selectedProduct ||
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      setResult({
        type: "error",
        message: "Choose a product, quantity, and shipping address.",
      });
      return;
    }

    const payload: AdminCreateOrderPayload = {
      customerName: String(fd.get("customerName") ?? ""),
      customerEmail: String(fd.get("customerEmail") ?? ""),
      customerPhone: String(fd.get("customerPhone") ?? ""),
      city: selectedCity,
      cityID: city.cityId,
      district: selectedDistrict,
      districtID: district.districtId,
      street: String(fd.get("street") ?? ""),
      apartment: String(fd.get("apartment") ?? ""),
      paymentMethod: String(fd.get("paymentMethod") ?? "") as PaymentMethod,
      shippingFees,
      items: [
        {
          productID: selectedProduct.product.id,
          quantity,
        },
      ],
    };

    startTransition(async () => {
      const res = await adminCreateOrder(payload);
      if (res.status === "success") {
        queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
        if (res.paymentUrl) {
          setResult({
            type: "success_payment",
            orderID: res.orderID,
            paymentUrl: res.paymentUrl,
          });
        } else {
          setResult({
            type: "success_cod",
            orderID: res.orderID,
            warning: res.warning,
          });
        }
      } else {
        setResult({ type: "error", message: res.message });
      }
    });
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.icon}>
              <ShoppingCart />
            </span>
            <h2 className={styles.title}>Create Order</h2>
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

        {/* ── Result states ── */}
        {result?.type === "success_cod" && (
          <div className={styles.successBox}>
            <CheckCircle2 className={styles.resultIcon} />
            <div>
              <p className={styles.resultMsg}>
                Order #{String(result.orderID).padStart(5, "0")} created
              </p>
              {result.warning && (
                <p className={styles.resultMsg}>{result.warning}</p>
              )}
            </div>
          </div>
        )}

        {result?.type === "success_payment" && (
          <div className={styles.successBox}>
            <CheckCircle2 className={styles.resultIcon} />
            <div style={{ flex: 1 }}>
              <p className={styles.resultMsg}>
                Order #{String(result.orderID).padStart(5, "0")} created — send
                the payment link:
              </p>
              <div className={styles.linkRow}>
                <code className={styles.payLink}>{result.paymentUrl}</code>
                <button
                  type="button"
                  className={styles.copyBtn}
                  onClick={() => copyUrl(result.paymentUrl)}
                >
                  <Copy /> {copied ? "Copied!" : "Copy"}
                </button>
                <a
                  href={result.paymentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.openBtn}
                >
                  <ExternalLink />
                </a>
              </div>
            </div>
          </div>
        )}

        {result?.type === "error" && (
          <div className={styles.errorBox} style={{ marginBottom: "1rem" }}>
            <AlertCircle className={styles.resultIcon} />
            <p className={styles.resultMsg}>{result.message}</p>
          </div>
        )}

        {/* ── Form (hidden after success) ── */}
        {result?.type !== "success_cod" &&
          result?.type !== "success_payment" && (
            <form className={styles.form} onSubmit={handleSubmit}>
              <p className={styles.section}>Customer</p>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="co-name">
                    Name *
                  </label>
                  <input
                    id="co-name"
                    name="customerName"
                    className={styles.input}
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="co-phone">
                    Phone *
                  </label>
                  <input
                    id="co-phone"
                    name="customerPhone"
                    className={styles.input}
                    required
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="co-email">
                  Email *
                </label>
                <input
                  id="co-email"
                  name="customerEmail"
                  type="email"
                  className={styles.input}
                  required
                />
              </div>

              <p className={styles.section}>Shipping address</p>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="co-city">
                    City *
                  </label>
                  <select
                    id="co-city"
                    name="city"
                    className={styles.select}
                    value={selectedCity}
                    onChange={(e) => {
                      setSelectedCity(e.target.value);
                      setSelectedDistrict("");
                    }}
                    required
                  >
                    <option value="">Select city…</option>
                    {availableCities.map((c) => (
                      <option key={c.cityId} value={c.cityOtherName}>
                        {c.cityOtherName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="co-district">
                    District *
                  </label>
                  <select
                    id="co-district"
                    name="district"
                    className={styles.select}
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    disabled={!selectedCity}
                    required
                  >
                    <option value="">Select district…</option>
                    {availableDistricts.map((d) => (
                      <option key={d.districtId} value={d.districtOtherName}>
                        {d.districtOtherName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="co-street">
                    Street *
                  </label>
                  <input
                    id="co-street"
                    name="street"
                    className={styles.input}
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="co-apt">
                    Apartment
                  </label>
                  <input
                    id="co-apt"
                    name="apartment"
                    className={styles.input}
                  />
                </div>
              </div>

              <p className={styles.section}>Order details</p>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="co-prod">
                    Product *
                  </label>
                  <select
                    id="co-prod"
                    name="productID"
                    className={styles.select}
                    value={selectedProductID}
                    onChange={(event) =>
                      setSelectedProductID(event.target.value)
                    }
                    required
                    disabled={productsPending}
                  >
                    <option value="">
                      {productsPending
                        ? "Loading products…"
                        : "Select product…"}
                    </option>
                    {products
                      .filter((item) => item.product.inStock)
                      .map((item) => (
                        <option key={item.product.id} value={item.product.id}>
                          {item.product.name} ·{" "}
                          {formatCurrency(item.product.price)}
                        </option>
                      ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="co-qty">
                    Qty *
                  </label>
                  <input
                    id="co-qty"
                    name="quantity"
                    type="number"
                    min="1"
                    defaultValue="1"
                    className={styles.input}
                    required
                  />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <span className={styles.label}>Unit price</span>
                  <p className={styles.input}>
                    {selectedProduct
                      ? formatCurrency(selectedProduct.product.price)
                      : "Select a product"}
                  </p>
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="co-shipping">
                    Shipping fees (EGP)
                  </label>
                  <input
                    id="co-shipping"
                    name="shippingFees"
                    type="number"
                    min="0"
                    defaultValue="0"
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="co-payment">
                  Payment method *
                </label>
                <select
                  id="co-payment"
                  name="paymentMethod"
                  className={styles.select}
                  required
                >
                  <option value="cash_on_delivery">Cash on Delivery</option>
                  <option value="paymob_card">Paymob Card</option>
                  <option value="mobile_wallet">Mobile wallet</option>
                </select>
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
                  disabled={isPending || !city || !district}
                >
                  {isPending ? "Creating…" : "Create Order"}
                </button>
              </div>
            </form>
          )}

        {(result?.type === "success_cod" ||
          result?.type === "success_payment") && (
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
