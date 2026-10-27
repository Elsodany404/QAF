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
import { format } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import { useSession } from "@/lib/auth-client";
import {
  DELIVERY_CITIES,
  districtsByZone,
  MAX_COD_AMOUNT,
  MIN_STREET_LENGTH,
  normalizeEgyptianMobile,
  placeName,
} from "@/lib/bostaLocations";
import { isFullName } from "@/lib/fullName";
import { isOnlinePayment } from "@/lib/orderStatus";
import type { FormValues, PaymentOptionsT } from "@/types/customTypes";
import { toSecureCart } from "@/utils/cart";
import { formatCurrency } from "@/utils/helper";
import styles from "./Form.module.css";

// Their titles and descriptions are in the dictionary, by value.
const paymentOptions: PaymentOptionsT = [
  { value: "paymob_card", Icon: CreditCard },
  { value: "mobile_wallet", Icon: Smartphone },
  { value: "cash_on_delivery", Icon: Wallet },
];

function Form() {
  const router = useRouter();
  const { locale, t, href } = useI18n();
  const text = t.checkout;
  const fullNameMessage = t.validation.fullName;
  const streetTooShortMessage = format(t.validation.streetTooShort, {
    min: MIN_STREET_LENGTH,
  });
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
      router.replace(href("/empty-cart"));
    }
  }, [cart.length, router, cartLoaded, href]);

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
  const zones = city ? districtsByZone(city, locale) : [];

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
      toast.error(text.chooseCityAndDistrict);
      return;
    }
    if (shippingFees === null) {
      toast.error(text.shippingPending);
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
    ? text.placing
    : shippingFeesLoading
      ? text.calculatingShipping
      : shippingFees === null
        ? text.completePurchase
        : format(text.submitWithTotal, {
            action: online ? text.continueToPayment : text.placeOrder,
            total: formatCurrency(total, locale),
          });

  return (
    <form onSubmit={handleSubmit(onValid)} className={styles.formSection}>
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>{text.contactTitle}</h2>

        <div className={styles.fieldGrid}>
          <div>
            <label htmlFor="name">{text.fullName}</label>
            <input
              id="name"
              aria-invalid={Boolean(errors.name)}
              aria-describedby="name-error"
              className={`${styles.input} ${errors.name ? styles.inputError : ""}`}
              type="text"
              autoComplete="name"
              placeholder={text.fullNamePlaceholder}
              maxLength={100}
              {...register("name", {
                required: fullNameMessage,
                // Checked here so a one-word name never reaches the server.
                validate: (value) => isFullName(value) || fullNameMessage,
              })}
            />
            <span id="name-error" className={styles.errorText}>
              {errors.name?.message}
            </span>
          </div>

          <div>
            <label htmlFor="email">{text.email}</label>
            <input
              id="email"
              dir="ltr"
              aria-invalid={Boolean(errors.email)}
              aria-describedby="email-error"
              className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              maxLength={254}
              {...register("email", {
                required: text.emailRequired,
                pattern: {
                  value: /^\s*[^\s@]+@[^\s@]+\.[^\s@]+\s*$/,
                  message: text.emailInvalid,
                },
              })}
            />
            <span id="email-error" className={styles.errorText}>
              {errors.email?.message}
            </span>
          </div>

          <div>
            <label htmlFor="phone">{text.mobile}</label>
            <input
              id="phone"
              dir="ltr"
              aria-invalid={Boolean(errors.phone)}
              aria-describedby="phone-error"
              className={`${styles.input} ${errors.phone ? styles.inputError : ""}`}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="01xxxxxxxxx"
              {...register("phone", {
                required: text.mobileRequired,
                validate: (value) =>
                  normalizeEgyptianMobile(value) !== null || text.mobileInvalid,
              })}
            />
            <span id="phone-error" className={styles.errorText}>
              {errors.phone?.message}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>{text.addressTitle}</h2>

        <div className={styles.fieldGrid}>
          <div className={styles.dropdown}>
            <label htmlFor="city">{text.city}</label>
            <select
              id="city"
              aria-invalid={Boolean(errors.city)}
              aria-describedby="city-error"
              className={errors.city ? styles.inputError : undefined}
              {...register("city", {
                required: text.cityRequired,
                onChange: (event) => {
                  setCityName(event.target.value || null);
                  // The chosen district belonged to the previous city.
                  setValue("district", "");
                },
              })}
            >
              <option value="">{text.selectCity}</option>
              {DELIVERY_CITIES.map((c) => (
                <option key={c.cityId} value={c.cityName}>
                  {placeName(c.cityName, c.cityOtherName, locale)}
                </option>
              ))}
            </select>
            <span id="city-error" className={styles.errorText}>
              {errors.city?.message}
            </span>
          </div>

          <div className={styles.dropdown}>
            <label htmlFor="district">{text.district}</label>
            <select
              id="district"
              aria-invalid={Boolean(errors.district)}
              aria-describedby="district-error"
              className={errors.district ? styles.inputError : undefined}
              {...register("district", {
                required: text.districtRequired,
              })}
              disabled={!city}
            >
              <option value="">
                {city ? text.selectDistrict : text.chooseCityFirst}
              </option>
              {zones.map((zone) => (
                <optgroup key={zone.zoneId} label={zone.label}>
                  {zone.districts.map((d) => (
                    <option key={d.districtId} value={d.districtId}>
                      {placeName(d.districtName, d.districtOtherName, locale)}
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
            <label htmlFor="street">{text.street}</label>
            <input
              id="street"
              aria-invalid={Boolean(errors.street)}
              aria-describedby="street-error"
              className={`${styles.input} ${errors.street ? styles.inputError : ""}`}
              type="text"
              autoComplete="address-line1"
              placeholder={text.streetPlaceholder}
              maxLength={200}
              {...register("street", {
                required: text.streetRequired,
                validate: (value) =>
                  value.trim().length >= MIN_STREET_LENGTH ||
                  streetTooShortMessage,
              })}
            />
            <span id="street-error" className={styles.errorText}>
              {errors.street?.message}
            </span>
          </div>

          <div>
            <label htmlFor="apartment">{text.apartment}</label>
            <input
              id="apartment"
              aria-invalid={Boolean(errors.apartment)}
              aria-describedby="apartment-error"
              className={`${styles.input} ${errors.apartment ? styles.inputError : ""}`}
              type="text"
              autoComplete="address-line2"
              placeholder={text.apartmentPlaceholder}
              maxLength={100}
              {...register("apartment", {
                required: text.apartmentRequired,
                validate: (value) =>
                  value.trim().length > 0 || text.apartmentRequired,
              })}
            />
            <span id="apartment-error" className={styles.errorText}>
              {errors.apartment?.message}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>{text.paymentTitle}</h2>

        <div
          className={styles.paymentChoices}
          role="group"
          aria-label={text.paymentGroup}
        >
          {paymentOptions.map(({ value, Icon }) => (
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
                <span className={styles.paymentChoiceTitle}>
                  {text.paymentMethods[value].title}
                </span>
                <span className={styles.paymentChoiceDesc}>
                  {text.paymentMethods[value].description}
                </span>
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
              <h3 className={styles.paymentTitle}>{text.onlineTitle}</h3>
              <p className={styles.paymentBody}>{text.onlineText}</p>
              <div className={styles.paymentSecurity}>
                <Lock aria-hidden="true" />
                {text.encrypted}
              </div>
            </div>
          ) : (
            <div>
              <h3 className={styles.paymentTitle}>{text.codTitle}</h3>
              {codTooHigh ? (
                <p className={styles.paymentWarning} role="alert">
                  {format(text.codTooHigh, {
                    max: formatCurrency(MAX_COD_AMOUNT, locale),
                  })}
                </p>
              ) : (
                <p className={styles.paymentBody}>
                  {shippingFees === null
                    ? text.codText
                    : format(text.codReady, {
                        total: formatCurrency(total, locale),
                      })}
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
            {text.tryAgain}
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
