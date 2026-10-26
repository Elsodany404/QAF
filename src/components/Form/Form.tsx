"use client";

import { useActionState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import toast from "react-hot-toast";
import {
  CreditCard,
  Lock,
  RefreshCw,
  Smartphone,
  Truck,
  Wallet,
} from "lucide-react";

import createOrder from "@/actions/createOrder";
import { useCart } from "@/context/CartContext";
import { useSession } from "@/lib/auth-client";
import {
  bilingualName,
  DELIVERY_CITIES,
  districtsByZone,
  MAX_COD_AMOUNT,
  MIN_STREET_LENGTH,
  normalizeEgyptianMobile,
  STREET_TOO_SHORT_MESSAGE,
} from "@/lib/bostaLocations";
import { FULL_NAME_MESSAGE, isFullName } from "@/lib/fullName";
import { isOnlinePayment } from "@/lib/orderStatus";
import type { FormValues, PaymentOptionsT } from "@/types/customTypes";
import { toSecureCart } from "@/utils/cart";
import { formatCurrency } from "@/utils/helper";
import styles from "./Form.module.css";

const paymentOptions: PaymentOptionsT = [
  {
    value: "paymob_card",
    title: "Online card",
    desc: "Pay securely through Paymob.",
    Icon: CreditCard,
  },
  {
    value: "mobile_wallet",
    title: "Mobile wallet",
    desc: "Complete wallet payment through Paymob.",
    Icon: Smartphone,
  },
  {
    value: "cash_on_delivery",
    title: "Cash on delivery",
    desc: "Pay in cash when your order arrives.",
    Icon: Wallet,
  },
];

function Form() {
  const router = useRouter();
  const {
    paymentMethod,
    setPaymentMethod,
    cartPrice,
    cart,
    setCityName,
    shippingFees,
    shippingFeesLoading,
    shippingFeesError,
    retryShippingFees,
    refreshCartPrices,
    cartLoaded,
  } = useCart();

  useEffect(() => {
    if (cartLoaded && cart.length === 0) {
      router.replace("/empty-cart");
    }
  }, [cart.length, router, cartLoaded]);

  // The form starts without a city on every visit, so the quote must too.
  useEffect(() => () => setCityName(null), [setCityName]);

  const { data: session } = useSession();
  const [orderState, formAction, isPending] = useActionState(
    createOrder,
    undefined,
  );
  const [, startTransition] = useTransition();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    getValues,
    setValue,
  } = useForm<FormValues>({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      city: "",
      district: "",
      street: "",
      apartment: "",
    },
  });

  // Prefill contact details from the signed-in account once it loads.
  useEffect(() => {
    if (!session?.user) return;
    if (!getValues("name")) setValue("name", session.user.name);
    if (!getValues("email")) setValue("email", session.user.email);
  }, [session?.user, getValues, setValue]);

  useEffect(() => {
    if (orderState && !orderState.success) {
      toast.error(orderState.error);
      // Show the customer the prices and shipping the server now charges.
      if (orderState.code === "price_changed") {
        void refreshCartPrices();
        retryShippingFees();
      }
    }
  }, [orderState, refreshCartPrices, retryShippingFees]);

  const selectedCity = useWatch({ control, name: "city" });
  const city = DELIVERY_CITIES.find((c) => c.cityName === selectedCity) ?? null;
  const zones = city ? districtsByZone(city) : [];

  // The district select holds the district ID: some cities have two
  // districts with the same name.
  const selectedDistrictID = useWatch({ control, name: "district" });
  const district =
    city?.districts.find((d) => d.districtId === selectedDistrictID) ?? null;

  const total = cartPrice + (shippingFees ?? 0);
  const online = isOnlinePayment(paymentMethod);
  // The courier can't collect more cash than Bosta allows.
  const codTooHigh = !online && total > MAX_COD_AMOUNT;
  // Only place an order against a real shipping quote.
  const blocked =
    isPending ||
    shippingFeesLoading ||
    Boolean(shippingFeesError) ||
    codTooHigh;

  function onValid(data: FormValues) {
    if (!city || !district) {
      toast.error("Please choose your city and district");
      return;
    }
    if (shippingFees === null) {
      toast.error("Shipping is still being calculated");
      return;
    }

    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("email", data.email);
    formData.append("phone", data.phone);
    formData.append("street", data.street);
    formData.append("apartment", data.apartment);
    formData.append("city", city.cityName);
    formData.append("district", district.districtName);
    formData.append("cityID", city.cityId);
    formData.append("districtID", district.districtId);
    formData.append("paymentMethod", paymentMethod);
    formData.append("secureCart", JSON.stringify(toSecureCart(cart)));
    // The server refuses the order if its total differs from this one.
    formData.append("expectedTotal", String(total));

    startTransition(() => {
      formAction(formData);
    });
  }

  if (cart.length === 0) {
    return null;
  }

  const submitLabel = isPending
    ? "Placing your order…"
    : shippingFeesLoading
      ? "Calculating shipping…"
      : shippingFees === null
        ? "Complete purchase"
        : `${online ? "Continue to payment" : "Place order"} — ${formatCurrency(total)}`;

  return (
    <form onSubmit={handleSubmit(onValid)} className={styles.formSection}>
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Contact Information</h2>

        <div className={styles.fieldGrid}>
          <div>
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              aria-invalid={Boolean(errors.name)}
              aria-describedby="name-error"
              className={`${styles.input} ${errors.name ? styles.inputError : ""}`}
              type="text"
              autoComplete="name"
              placeholder="e.g. Ahmed Hassan"
              maxLength={100}
              {...register("name", {
                required: FULL_NAME_MESSAGE,
                // Checked here so a one-word name never reaches the server.
                validate: (value) => isFullName(value) || FULL_NAME_MESSAGE,
              })}
            />
            <span id="name-error" className={styles.errorText}>
              {errors.name?.message}
            </span>
          </div>

          <div>
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              aria-invalid={Boolean(errors.email)}
              aria-describedby="email-error"
              className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              maxLength={254}
              {...register("email", {
                required: "Please enter your email address",
                pattern: {
                  value: /^\s*[^\s@]+@[^\s@]+\.[^\s@]+\s*$/,
                  message: "Please enter a valid email address",
                },
              })}
            />
            <span id="email-error" className={styles.errorText}>
              {errors.email?.message}
            </span>
          </div>

          <div>
            <label htmlFor="phone">Mobile Number</label>
            <input
              id="phone"
              aria-invalid={Boolean(errors.phone)}
              aria-describedby="phone-error"
              className={`${styles.input} ${errors.phone ? styles.inputError : ""}`}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="01xxxxxxxxx"
              {...register("phone", {
                required: "Please enter your mobile number",
                validate: (value) =>
                  normalizeEgyptianMobile(value) !== null ||
                  "Please enter a valid Egyptian mobile number (01xxxxxxxxx)",
              })}
            />
            <span id="phone-error" className={styles.errorText}>
              {errors.phone?.message}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Shipping Address</h2>

        <div className={styles.fieldGrid}>
          <div className={styles.dropdown}>
            <label htmlFor="city">City</label>
            <select
              id="city"
              aria-invalid={Boolean(errors.city)}
              aria-describedby="city-error"
              className={errors.city ? styles.inputError : undefined}
              {...register("city", {
                required: "Please choose your city",
                onChange: (event) => {
                  setCityName(event.target.value || null);
                  // The chosen district belonged to the previous city.
                  setValue("district", "");
                },
              })}
            >
              <option value="">Select your city</option>
              {DELIVERY_CITIES.map((c) => (
                <option key={c.cityId} value={c.cityName}>
                  {bilingualName(c.cityName, c.cityOtherName)}
                </option>
              ))}
            </select>
            <span id="city-error" className={styles.errorText}>
              {errors.city?.message}
            </span>
          </div>

          <div className={styles.dropdown}>
            <label htmlFor="district">District</label>
            <select
              id="district"
              aria-invalid={Boolean(errors.district)}
              aria-describedby="district-error"
              className={errors.district ? styles.inputError : undefined}
              {...register("district", {
                required: "Please choose your district",
              })}
              disabled={!city}
            >
              <option value="">
                {city ? "Select your district" : "Choose a city first"}
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
            <span id="district-error" className={styles.errorText}>
              {errors.district?.message}
            </span>
          </div>

          <div>
            <label htmlFor="street">Street</label>
            <input
              id="street"
              aria-invalid={Boolean(errors.street)}
              aria-describedby="street-error"
              className={`${styles.input} ${errors.street ? styles.inputError : ""}`}
              type="text"
              autoComplete="address-line1"
              placeholder="e.g. 12 El Nasr Street"
              maxLength={200}
              {...register("street", {
                required: "Please enter your street",
                validate: (value) =>
                  value.trim().length >= MIN_STREET_LENGTH ||
                  STREET_TOO_SHORT_MESSAGE,
              })}
            />
            <span id="street-error" className={styles.errorText}>
              {errors.street?.message}
            </span>
          </div>

          <div>
            <label htmlFor="apartment">Building &amp; Apartment</label>
            <input
              id="apartment"
              aria-invalid={Boolean(errors.apartment)}
              aria-describedby="apartment-error"
              className={`${styles.input} ${errors.apartment ? styles.inputError : ""}`}
              type="text"
              autoComplete="address-line2"
              placeholder="e.g. Building 4, floor 2, apt 7"
              maxLength={100}
              {...register("apartment", {
                required: "Please enter your building and apartment",
                validate: (value) =>
                  value.trim().length > 0 ||
                  "Please enter your building and apartment",
              })}
            />
            <span id="apartment-error" className={styles.errorText}>
              {errors.apartment?.message}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Payment Method</h2>

        <div
          className={styles.paymentChoices}
          role="group"
          aria-label="Payment method"
        >
          {paymentOptions.map(({ value, title, desc, Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setPaymentMethod(value)}
              aria-pressed={paymentMethod === value}
              className={`${styles.paymentChoice} ${
                paymentMethod === value ? styles.paymentChoiceActive : ""
              }`}
            >
              <span className={styles.paymentChoiceIcon}>
                <Icon aria-hidden="true" />
              </span>

              <span>
                <span className={styles.paymentChoiceTitle}>{title}</span>
                <span className={styles.paymentChoiceDesc}>{desc}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.paymentCard}>
        <div className={styles.paymentHeader}>
          <div className={styles.paymentIcon}>
            {online ? <CreditCard aria-hidden="true" /> : <Truck aria-hidden="true" />}
          </div>

          {online ? (
            <div>
              <h3 className={styles.paymentTitle}>Secure online payment</h3>
              <p className={styles.paymentBody}>
                You&apos;ll be redirected to Paymob&apos;s secure checkout to
                complete your payment.
              </p>
              <div className={styles.paymentSecurity}>
                <Lock aria-hidden="true" />
                256-bit SSL encrypted
              </div>
            </div>
          ) : (
            <div>
              <h3 className={styles.paymentTitle}>Pay on delivery</h3>
              {codTooHigh ? (
                <p className={styles.paymentWarning} role="alert">
                  Cash on delivery is available for orders up to{" "}
                  {formatCurrency(MAX_COD_AMOUNT)}. Please pay online by card
                  or mobile wallet.
                </p>
              ) : (
                <p className={styles.paymentBody}>
                  {shippingFees === null
                    ? "Pay the courier in cash when your order arrives."
                    : `Please have ${formatCurrency(total)} ready in cash for the courier.`}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {shippingFeesError && (
        <div className={styles.payError} role="alert">
          <p>{shippingFeesError}</p>
          <button
            type="button"
            className={styles.retryButton}
            onClick={retryShippingFees}
          >
            <RefreshCw aria-hidden="true" />
            Try again
          </button>
        </div>
      )}

      <button
        type="submit"
        disabled={blocked}
        className={`${styles.submitButton} ${blocked ? styles.submitButtonDisabled : ""}`}
      >
        {submitLabel}
      </button>
    </form>
  );
}

export default Form;
