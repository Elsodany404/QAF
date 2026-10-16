"use client";

import styles from "./Form.module.css";
import { CreditCard, Lock, Smartphone, Wallet } from "lucide-react";
import { formatCurrency } from "../../utils/helper";
import { useCart } from "../../context/CartContext";
import {
  DELIVERY_CITIES,
  normalizeEgyptianMobile,
} from "@/lib/bostaLocations";

import {
  FormValues,
  PaymentOptionsT,
  SecureCart,
} from "../../types/customTypes";
import { useSession } from "@/lib/auth-client";
import { useActionState, useEffect, useTransition } from "react";
import createOrder from "@/actions/createOrder";
import { useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

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
    desc: "Create the shipment now and pay on arrival.",
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
    taxOnCod,
    shippingFeesLoading,
    cartLoaded,
  } = useCart();

  useEffect(() => {
    if (!cartLoaded) {
      return;
    }
    if (cart.length === 0) {
      router.replace("/empty-cart");
    }
  }, [cart.length, router, cartLoaded]);

  // Don't render checkout while we're waiting for the redirect

  const { data: session } = useSession();
  const [orderState, formAction, isPending] = useActionState(
    createOrder,
    undefined,
  );
  const [, startTransition] = useTransition();

  const { register, control, handleSubmit, formState, getValues, setValue } =
    useForm<FormValues>({
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
  const { errors } = formState;

  // Prefill contact details from the signed-in account once it loads.
  useEffect(() => {
    if (!session?.user) return;
    if (!getValues("name")) setValue("name", session.user.name);
    if (!getValues("email")) setValue("email", session.user.email);
  }, [session?.user, getValues, setValue]);

  useEffect(() => {
    if (orderState && !orderState.success) {
      toast.error(orderState.error);
    }
  }, [orderState]);

  const selectedCity = useWatch({ control, name: "city" });
  const city = DELIVERY_CITIES.find((c) => c.cityName === selectedCity) ?? null;
  const availableDistricts = city?.districts ?? [];

  // The district select holds the district ID: some cities have two
  // districts with the same name.
  const selectedDistrictID = useWatch({ control, name: "district" });
  const district =
    availableDistricts.find((d) => d.districtId === selectedDistrictID) ??
    null;

  const secureCart: SecureCart = cart.map((item) => ({
    productID: item.product.id,
    optionsIDs: item.options.map((op) => op.optionID),
    valuesIDs: item.options.map((op) => op.id),
    quantity: item.quantity,
  }));
  function onValid(data: FormValues) {
    if (!city || !district) {
      toast.error("Please choose your city and district");
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
    formData.append("secureCart", JSON.stringify(secureCart));

    startTransition(() => {
      formAction(formData);
    });
  }
  if (cart.length === 0) {
    return null;
  }
  return (
    <form onSubmit={handleSubmit(onValid)} className={styles.formSection}>
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Contact Information</h2>

        <div className={styles.fieldGrid}>
          <div>
            <label htmlFor="name">Full Name</label>
            <span className={styles.errorText}>
              {errors.name?.message?.toString()}
            </span>

            <input
              id="name"
              className={styles.input}
              type="text"
              placeholder="John smith..."
              maxLength={100}
              {...register("name", {
                required: "this field is required",
              })}
            />
          </div>

          <div>
            <label htmlFor="email">Email Address</label>
            <span className={styles.errorText}>
              {errors.email?.message?.toString()}
            </span>

            <input
              id="email"
              className={styles.input}
              type="text"
              placeholder="johnsmith@example.com"
              maxLength={254}
              {...register("email", {
                required: "this field is required",
                pattern: {
                  value: /^\s*[^\s@]+@[^\s@]+\.[^\s@]+\s*$/,
                  message: "please insert a valid email",
                },
              })}
            />
          </div>

          <div>
            <label htmlFor="phone">Phone Number</label>
            <span className={styles.errorText}>
              {errors.phone?.message?.toString()}
            </span>

            <input
              id="phone"
              className={styles.input}
              type="tel"
              placeholder="01xxxxxx"
              {...register("phone", {
                required: "this field is required",
                validate: (value) =>
                  normalizeEgyptianMobile(value) !== null ||
                  "please insert valid phone number",
              })}
            />
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Shipping Address</h2>

        <div className={styles.fieldGrid}>
          <div className={styles.dropdown}>
            <label>City</label>

            <span className={styles.errorText}>
              {errors.city?.message?.toString()}
            </span>

            <select
              {...register("city", {
                required: "اختر المدينة",
                onChange: (e) => {
                  setCityName(e.target.value);
                  // The chosen district belonged to the previous city.
                  setValue("district", "");
                },
              })}
            >
              <option value="">اختر المدينة</option>

              {DELIVERY_CITIES.map((c) => (
                <option key={c.cityId} value={c.cityName}>
                  {c.cityOtherName}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.dropdown}>
            <label>District</label>

            <span className={styles.errorText}>
              {errors.district?.message?.toString()}
            </span>

            <select
              {...register("district", {
                required: "اختر الحي السكني",
              })}
              disabled={!city}
            >
              <option value="">أختر الحي السكني</option>
              {availableDistricts.map((d) => (
                <option key={d.districtId} value={d.districtId}>
                  {d.districtOtherName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="street">Street</label>

            <span className={styles.errorText}>
              {errors.street?.message?.toString()}
            </span>

            <input
              id="street"
              className={styles.input}
              type="text"
              placeholder="123 Main Street"
              maxLength={200}
              {...register("street", {
                required: "this field is required",
              })}
            />
          </div>

          <div>
            <label htmlFor="apartment">Apartment</label>

            <span className={styles.errorText}>
              {errors.apartment?.message?.toString()}
            </span>

            <input
              id="apartment"
              className={styles.input}
              type="text"
              placeholder="apartment label/number"
              maxLength={100}
              {...register("apartment", {
                required: "this field is required",
              })}
            />
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Payment Method</h2>

        <div className={styles.paymentChoices}>
          {paymentOptions.map(({ value, title, desc, Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setPaymentMethod(value)}
              className={`${styles.paymentChoice} ${
                paymentMethod === value ? styles.paymentChoiceActive : ""
              }`}
            >
              <span className={styles.paymentChoiceIcon}>
                <Icon />
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
            <CreditCard />
          </div>

          <div>
            <h3 className={styles.paymentTitle}>Secure Payment with us</h3>

            <p className={styles.paymentBody}>
              You will be redirected to our third party secure gateway to
              complete payment.
            </p>

            <div className={styles.paymentSecurity}>
              <Lock className="w-4 h-4" />
              256-bit SSL Encrypted
            </div>
          </div>
        </div>
      </div>

      <button
        type="submit"
        // Wait for the shipping fee so the total shown is the one charged.
        disabled={isPending || shippingFeesLoading}
        className={`${styles.submitButton} ${
          isPending || shippingFeesLoading ? styles.submitButtonDisabled : ""
        }`}
      >
        {isPending
          ? "Processing..."
          : shippingFeesLoading
            ? "loading ..."
            : `Complete Purchase — ${formatCurrency(cartPrice + cartPrice * taxOnCod + shippingFees)}`}
      </button>
    </form>
  );
}

export default Form;
