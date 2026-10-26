"use client";

import { useRef, useState, useTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Plus,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";

import {
  adminCreateOrder,
  type AdminCreateOrderPayload,
} from "@/actions/dashboard/createManualOrder";
import { useDialog } from "@/hooks/useDialog";
import useShippingFees from "@/hooks/useShippingFees";
import {
  bilingualName,
  DELIVERY_CITIES,
  districtsByZone,
  MIN_STREET_LENGTH,
} from "@/lib/bostaLocations";
import { formatOrderNumber } from "@/lib/orderStatus";
import { getAllProducts } from "@/services/Product";
import type { PaymentMethod } from "@/types/customTypes";
import type { OptionValue } from "@/types/db";
import { MAX_CART_LINES, MAX_QUANTITY_PER_ITEM } from "@/utils/cartLimits";
import { calcPrice, formatCurrency } from "@/utils/helper";
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

/** One product line. `values` maps option ID → chosen value ID. */
type Line = {
  key: number;
  productID: string;
  values: Record<number, number>;
  quantity: string;
};

const emptyLine = (key: number): Line => ({
  key,
  productID: "",
  values: {},
  quantity: "1",
});

function percentLabel(modifier: number) {
  if (!modifier) return "";
  const percent = Math.round(modifier * 100);
  return ` (${percent > 0 ? "+" : ""}${percent}%)`;
}

export default function CreateOrderModal({ onClose }: Props) {
  const queryClient = useQueryClient();
  const dialogRef = useDialog<HTMLDivElement>(true, onClose);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    data: products = [],
    isPending: productsPending,
    isError: productsError,
  } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => getAllProducts(),
  });
  const availableProducts = products.filter((item) => item.product.inStock);

  // Bosta city/district dropdowns, keyed by Bosta ID
  const [selectedCityID, setSelectedCityID] = useState("");
  const [selectedDistrictID, setSelectedDistrictID] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("cash_on_delivery");
  const [shippingOverride, setShippingOverride] = useState("");

  const nextLineKey = useRef(1);
  const [lines, setLines] = useState<Line[]>(() => [emptyLine(0)]);

  const city = DELIVERY_CITIES.find((c) => c.cityId === selectedCityID) ?? null;
  const zones = city ? districtsByZone(city) : [];
  const district =
    city?.districts.find((d) => d.districtId === selectedDistrictID) ?? null;

  // Each line resolved against the catalog, priced like the storefront.
  const resolvedLines = lines.map((line) => {
    const item =
      products.find((p) => String(p.product.id) === line.productID) ?? null;
    const values = item
      ? item.options
          .map(
            (option) =>
              option.values.find((v) => v.id === line.values[option.id]) ??
              option.defaultValue,
          )
          .filter((value): value is OptionValue => value !== undefined)
      : [];
    const quantity = Number(line.quantity);
    const validQuantity =
      Number.isInteger(quantity) &&
      quantity >= 1 &&
      quantity <= MAX_QUANTITY_PER_ITEM;
    const unitPrice = item ? calcPrice(item.product, values) : 0;
    return {
      line,
      item,
      values,
      quantity,
      validQuantity,
      total: validQuantity ? unitPrice * quantity : 0,
    };
  });
  const subtotal = resolvedLines.reduce((sum, r) => sum + r.total, 0);

  const quote = useShippingFees({
    cityName: city?.cityName ?? null,
    cartPrice: subtotal,
    paymentMethod,
  });
  const manualShipping =
    shippingOverride.trim() === "" ? null : Number(shippingOverride);
  const shipping = manualShipping ?? quote.shippingFees;

  function updateLine(key: number, patch: Partial<Line>) {
    setLines((prev) =>
      prev.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );
  }

  function addLine() {
    const key = nextLineKey.current++;
    setLines((prev) => [...prev, emptyLine(key)]);
  }

  function removeLine(key: number) {
    setLines((prev) => prev.filter((line) => line.key !== key));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResult(null);

    const fd = new FormData(e.currentTarget);
    const fail = (message: string) => setResult({ type: "error", message });

    if (!city || !district) {
      return fail("Choose the delivery city and district.");
    }
    if (
      resolvedLines.some(
        (r) =>
          !r.item ||
          !r.validQuantity ||
          r.values.some((value) => !value.inStock),
      )
    ) {
      return fail(
        `Each line needs an in-stock product and option, and a quantity from 1 to ${MAX_QUANTITY_PER_ITEM}.`,
      );
    }
    if (
      manualShipping !== null &&
      (!Number.isFinite(manualShipping) || manualShipping < 0)
    ) {
      return fail("The shipping fee must be 0 or more.");
    }

    const payload: AdminCreateOrderPayload = {
      customerName: String(fd.get("customerName") ?? ""),
      customerEmail: String(fd.get("customerEmail") ?? ""),
      customerPhone: String(fd.get("customerPhone") ?? ""),
      cityID: city.cityId,
      districtID: district.districtId,
      street: String(fd.get("street") ?? ""),
      apartment: String(fd.get("apartment") ?? ""),
      paymentMethod,
      shippingFees: manualShipping,
      items: resolvedLines.map((r) => ({
        productID: r.item!.product.id,
        optionsIDs: r.item!.options.map((option) => option.id),
        valuesIDs: r.values.map((value) => value.id),
        quantity: r.quantity,
      })),
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

  const shippingPlaceholder = !city
    ? "Choose a city first"
    : quote.shippingFeesLoading
      ? "Getting Bosta's price…"
      : quote.shippingFees !== null
        ? `${quote.shippingFees} (Bosta's price)`
        : "Bosta's price is unavailable";

  const done =
    result?.type === "success_cod" || result?.type === "success_payment";

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        ref={dialogRef}
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-order-title"
        tabIndex={-1}
      >
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.icon}>
              <ShoppingCart aria-hidden="true" />
            </span>
            <h2 id="create-order-title" className={styles.title}>
              Create Order
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

        {/* ── Result states ── */}
        {result?.type === "success_cod" && (
          <div className={styles.successBox} role="status">
            <CheckCircle2 className={styles.resultIcon} aria-hidden="true" />
            <div>
              <p className={styles.resultMsg}>
                Order {formatOrderNumber(result.orderID)} created
              </p>
              {result.warning && (
                <p className={styles.resultMsg}>{result.warning}</p>
              )}
            </div>
          </div>
        )}

        {result?.type === "success_payment" && (
          <div className={styles.successBox} role="status">
            <CheckCircle2 className={styles.resultIcon} aria-hidden="true" />
            <div style={{ flex: 1 }}>
              <p className={styles.resultMsg}>
                Order {formatOrderNumber(result.orderID)} created — send the
                payment link:
              </p>
              <div className={styles.linkRow}>
                <code className={styles.payLink}>{result.paymentUrl}</code>
                <button
                  type="button"
                  className={styles.copyBtn}
                  onClick={() => copyUrl(result.paymentUrl)}
                >
                  <Copy aria-hidden="true" /> {copied ? "Copied!" : "Copy"}
                </button>
                <a
                  href={result.paymentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.openBtn}
                  aria-label="Open the payment link"
                >
                  <ExternalLink aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        )}

        {result?.type === "error" && (
          <div
            className={styles.errorBox}
            style={{ marginBottom: "1rem" }}
            role="alert"
          >
            <AlertCircle className={styles.resultIcon} aria-hidden="true" />
            <p className={styles.resultMsg}>{result.message}</p>
          </div>
        )}

        {/* ── Form (hidden after success) ── */}
        {!done && (
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
                  maxLength={100}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="co-phone">
                  Mobile *
                </label>
                <input
                  id="co-phone"
                  name="customerPhone"
                  type="tel"
                  inputMode="tel"
                  placeholder="01xxxxxxxxx"
                  className={styles.input}
                  required
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="co-email">
                Account email *
              </label>
              <input
                id="co-email"
                name="customerEmail"
                type="email"
                className={styles.input}
                maxLength={254}
                required
              />
              <span className={styles.hint}>
                The email of the customer&apos;s Qaf Coffee account — the order
                appears there.
              </span>
            </div>

            <p className={styles.section}>Shipping address</p>
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="co-city">
                  City *
                </label>
                <select
                  id="co-city"
                  className={styles.select}
                  value={selectedCityID}
                  onChange={(e) => {
                    setSelectedCityID(e.target.value);
                    setSelectedDistrictID("");
                  }}
                  required
                >
                  <option value="">Select city…</option>
                  {DELIVERY_CITIES.map((c) => (
                    <option key={c.cityId} value={c.cityId}>
                      {bilingualName(c.cityName, c.cityOtherName)}
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
                  className={styles.select}
                  value={selectedDistrictID}
                  onChange={(e) => setSelectedDistrictID(e.target.value)}
                  disabled={!city}
                  required
                >
                  <option value="">
                    {city ? "Select district…" : "Choose a city first"}
                  </option>
                  {zones.map((zone) => (
                    <optgroup key={zone.zoneId} label={zone.label}>
                      {zone.districts.map((d) => (
                        <option key={d.districtId} value={d.districtId}>
                          {bilingualName(d.districtName, d.districtOtherName)}
                        </option>
                      ))}
                    </optgroup>
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
                  placeholder="e.g. 12 El Nasr Street"
                  minLength={MIN_STREET_LENGTH}
                  maxLength={200}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="co-apt">
                  Building &amp; apartment
                </label>
                <input
                  id="co-apt"
                  name="apartment"
                  className={styles.input}
                  maxLength={100}
                />
              </div>
            </div>

            <p className={styles.section}>Items</p>
            {resolvedLines.map(({ line, item, total }, index) => (
              <div key={line.key} className={styles.lineItem}>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label
                      className={styles.label}
                      htmlFor={`co-prod-${line.key}`}
                    >
                      Product *
                    </label>
                    <select
                      id={`co-prod-${line.key}`}
                      className={styles.select}
                      value={line.productID}
                      onChange={(event) =>
                        updateLine(line.key, {
                          productID: event.target.value,
                          values: {},
                        })
                      }
                      required
                      disabled={productsPending}
                    >
                      <option value="">
                        {productsPending
                          ? "Loading products…"
                          : productsError
                            ? "Couldn't load products"
                            : "Select product…"}
                      </option>
                      {availableProducts.map((p) => (
                        <option key={p.product.id} value={p.product.id}>
                          {p.product.name} · {formatCurrency(p.product.price)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label
                      className={styles.label}
                      htmlFor={`co-qty-${line.key}`}
                    >
                      Qty *
                    </label>
                    <input
                      id={`co-qty-${line.key}`}
                      type="number"
                      min="1"
                      max={MAX_QUANTITY_PER_ITEM}
                      step="1"
                      className={styles.input}
                      value={line.quantity}
                      onChange={(event) =>
                        updateLine(line.key, { quantity: event.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                {item && item.options.length > 0 && (
                  <div className={styles.row}>
                    {item.options.map((option) => (
                      <div key={option.id} className={styles.field}>
                        <label
                          className={styles.label}
                          htmlFor={`co-opt-${line.key}-${option.id}`}
                        >
                          {option.name}
                        </label>
                        <select
                          id={`co-opt-${line.key}-${option.id}`}
                          className={styles.select}
                          value={
                            line.values[option.id] ??
                            option.defaultValue?.id ??
                            ""
                          }
                          onChange={(event) =>
                            updateLine(line.key, {
                              values: {
                                ...line.values,
                                [option.id]: Number(event.target.value),
                              },
                            })
                          }
                        >
                          {option.values.map((value) => (
                            <option
                              key={value.id}
                              value={value.id}
                              disabled={!value.inStock}
                            >
                              {value.label}
                              {percentLabel(value.priceModifier)}
                              {value.inStock ? "" : " — sold out"}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                )}

                <div className={styles.lineFooter}>
                  <span className={styles.lineTotal}>
                    {item ? formatCurrency(total) : ""}
                  </span>
                  {lines.length > 1 && (
                    <button
                      type="button"
                      className={styles.removeLineBtn}
                      onClick={() => removeLine(line.key)}
                      aria-label={`Remove item ${index + 1}`}
                    >
                      <Trash2 aria-hidden="true" /> Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button
              type="button"
              className={styles.addLineBtn}
              onClick={addLine}
              disabled={lines.length >= MAX_CART_LINES}
            >
              <Plus aria-hidden="true" /> Add another product
            </button>

            <p className={styles.section}>Payment &amp; shipping</p>
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="co-payment">
                  Payment method *
                </label>
                <select
                  id="co-payment"
                  className={styles.select}
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(e.target.value as PaymentMethod)
                  }
                  required
                >
                  <option value="cash_on_delivery">Cash on delivery</option>
                  <option value="paymob_card">Card (payment link)</option>
                  <option value="mobile_wallet">
                    Mobile wallet (payment link)
                  </option>
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="co-shipping">
                  Shipping fee (EGP)
                </label>
                <input
                  id="co-shipping"
                  type="number"
                  min="0"
                  step="1"
                  className={styles.input}
                  value={shippingOverride}
                  onChange={(e) => setShippingOverride(e.target.value)}
                  placeholder={shippingPlaceholder}
                />
                <span className={styles.hint}>
                  Leave empty to charge Bosta&apos;s price. Enter 0 for free
                  delivery.
                </span>
              </div>
            </div>

            <dl className={styles.totals}>
              <dt>Subtotal</dt>
              <dd>{formatCurrency(subtotal)}</dd>
              <dt>Shipping</dt>
              <dd>{shipping === null ? "—" : formatCurrency(shipping)}</dd>
              <dt>Total</dt>
              <dd>
                {shipping === null
                  ? `${formatCurrency(subtotal)} + shipping`
                  : formatCurrency(subtotal + shipping)}
              </dd>
            </dl>

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

        {done && (
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
