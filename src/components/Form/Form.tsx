"use client";

import styles from "./Form.module.css";
import { CreditCard, Lock, Smartphone, Wallet } from "lucide-react";
import { formatCurrency } from "../../helper/helper";
import { useCart } from "../../context/CartContext";
import bostaAddresses from "@/assets/data/bostaDistricts.json";

import {
  FormValues,
  PaymentOptionsT,
  secureCart,
} from "../../types/customTypes";
import { useSession } from "@/lib/auth-client";
import { useActionState, useEffect, useTransition } from "react";
import createOrder from "@/actions/createOrder";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { isRouteMethod } from "better-auth/client";

const paymentOptions: PaymentOptionsT = [
  {
    value: "paymob_card",
    title: "Online card",
    desc: "Pay securely through Paymob.",
    Icon: CreditCard,
  },
  {
    value: "vodafone_cash",
    title: "Vodafone Cash",
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
  const [, formAction, isPending] = useActionState(createOrder, undefined);

  const { register, watch, handleSubmit, formState } = useForm<FormValues>({
    defaultValues: {
      name: "Mohamed Elsodany",
      email: "mouhmdsodany@gmail.com",
      phone: "01067609291",
      city: "",
      district: "",
      street: "123 Test Street",
      apartment: "Apartment 5",
    },
  });
  const { errors } = formState;

  const availableCities = bostaAddresses.data.filter(
    (c) => c.dropOffAvailability,
  );
  const selectedCity = watch("city");

  const city = availableCities.find((c) => c.cityName === selectedCity) || null;

  const availableDistricts =
    city?.districts.filter((d) => d.dropOffAvailability) ?? [];

  const selectedDistrict = watch("district");

  const district =
    availableDistricts.find((d) => d.districtName === selectedDistrict) || null;

  const secureCart: secureCart = cart.map((item) => ({
    productID: item.product.id,
    optionsIDs: item.options.map((op) => op.optionID),
    valuesIDs: item.options.map((op) => op.id),
    quantity: item.quantity,
  }));
  function onValid(data: FormValues) {
    if (!city?.cityId || !district?.districtId) return;
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("email", data.email);
    formData.append("phone", data.phone);
    formData.append("street", data.street);
    formData.append("apartment", data.apartment);
    formData.append("city", data.city);
    formData.append("district", data.district);

    formData.append("cityID", city.cityId);
    formData.append("districtID", district.districtId);

    formData.append("paymentMethod", paymentMethod);
    formData.append("secureCart", JSON.stringify(secureCart));

    formAction(formData);
  }
  if (cart.length === 0) {
    return null;
  }
  return (
    <form
      onSubmit={handleSubmit(onValid, (errors) =>
        console.log("VALIDATION ERRORS:", errors),
      )}
      className={styles.formSection}
    >
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
              defaultValue={session?.user.name || ""}
              className={styles.input}
              type="text"
              placeholder="John smith..."
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
              defaultValue={session?.user.email || ""}
              className={styles.input}
              type="text"
              placeholder="johnsmith@example.com"
              {...register("email", {
                required: "this field is required",
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
                validate: (value) => {
                  const cleanPhone = value.replace(/[\s-]/g, "");
                  const regex = /^01[0125]\d{8}$/;

                  return (
                    regex.test(cleanPhone) || "please insert valid phone number"
                  );
                },
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
                onChange: (e) => setCityName(e.target.value),
              })}
            >
              <option value="">اختر المدينة</option>

              {availableCities.map((c) => (
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
              {availableDistricts &&
                city &&
                availableDistricts.map((d) => (
                  <option key={d.districtId} value={d.districtName}>
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
        disabled={isPending}
        className={`${styles.submitButton} ${
          isPending ? styles.submitButtonDisabled : ""
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
