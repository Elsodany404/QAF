import { SubmitHandler, useForm } from "react-hook-form";
import styles from "./Form.module.css";
import FormField from "../FormField/FormField";
import { CreditCard, MapIcon, Lock, Smartphone, Wallet } from "lucide-react";
import { useState } from "react";
import { formatCurrency } from "../../helper/helper";
import { useCart } from "../../context/CartContext";
import { useLocationHandler } from "../../hooks/useLocation";
import { FormValues, PaymentOptionsT } from "../../types/customTypes";
import { getAllGovernorates, getCitiesByGovernorateId } from "egylist";

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

function Form({ onSubmit }: { onSubmit: SubmitHandler<FormValues> }) {
  const { setPaymentMethod, paymentMethod } = useCart();
  const [payError, setPayError] = useState("");
  const { cartPrice } = useCart();
  const { handleSubmit, register, watch, setValue, getValues, formState } =
    useForm<FormValues>();
  const { errors, isSubmitting } = formState;

  // 1. Fetch governorates safely
  const governorate = getAllGovernorates() || [];
  const selectedGovernorateId = watch("governorate");

  // 2. Fetch cities safely based on selected ID (convert to Number since egylist uses numeric IDs)
  const cities = selectedGovernorateId
    ? getCitiesByGovernorateId(Number(selectedGovernorateId))
    : [];

  // Returns: [{ id: 1, name_en: "Cairo", name_ar: "القاهرة" }, ...]
  const { handleGetAddress, isLoading } = useLocationHandler(setValue);

  return (
    <form className={styles.formSection} onSubmit={handleSubmit(onSubmit)}>
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Contact Information</h2>
        <div className={styles.fieldGrid}>
          <FormField
            id="name"
            label="Full Name"
            error={errors.name?.message?.toString()}
          >
            <input
              className={styles.input}
              type="text"
              placeholder="John smith..."
              {...register("name", {
                required: "this field is required",
              })}
            />
          </FormField>
          <FormField
            id="email"
            label="Email Address"
            error={errors.email?.message?.toString()}
          >
            <input
              className={styles.input}
              type="text"
              placeholder="johnsmith@example.com"
              {...register("email", {
                required: "this field is required",
              })}
            />
          </FormField>
          <FormField
            id="phone"
            label="Phone Number"
            error={errors.phone?.message?.toString()}
          >
            <input
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
          </FormField>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Shipping Address</h2>
        <div className={styles.fieldGrid}>
          <div className={styles.dropdown}>
            <label>Governorate</label>
            <span className={styles.errorText}>
              {errors.governorate?.message?.toString()}
            </span>
            <select {...register("governorate", { required: "اختر المحافظة" })}>
              <option value=""></option>
              {governorate.map((gov) => (
                <option key={gov.id} value={gov.id}>
                  {gov.name_ar}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.dropdown}>
            <label>City</label>
            <span className={styles.errorText}>
              {errors.city?.message?.toString()}
            </span>
            <select
              {...register("city", { required: "اختر المدينة" })}
              disabled={!selectedGovernorateId}
            >
              {cities.map((city) => (
                <option key={city.id} value={city.name_ar}>
                  {city.name_ar}
                </option>
              ))}
            </select>
          </div>

          <FormField
            id="streetAddress"
            label="Street Address"
            error={errors.streetAddress?.message?.toString()}
          >
            <input
              className={styles.input}
              type="text"
              placeholder="123 Main Street"
              {...register("streetAddress", {
                required: "this field is required",
              })}
            />
          </FormField>
          <FormField
            id="apartment"
            label="Apartment"
            error={errors.apartment?.message?.toString()}
          >
            <input
              className={styles.input}
              type="text"
              placeholder="apartment label/number"
              {...register("apartment", {
                required: "this field is required",
              })}
            />
          </FormField>
          <FormField
            id="details"
            label="Detailed Address"
            error={errors.details?.message?.toString()}
          >
            <input
              className={styles.input}
              type="text"
              placeholder="State/road/....."
              {...register("details", {
                required: "this field is required",
              })}
            />
          </FormField>
          <button
            type="button"
            className={styles.ButtonGetAddress}
            disabled={isLoading}
            onClick={handleGetAddress}
          >
            Use Your Location
            <MapIcon />
          </button>
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

      {payError && <div className={styles.payError}>{payError}</div>}

      <button
        type="submit"
        disabled={isSubmitting}
        className={`${styles.submitButton} ${isSubmitting ? styles.submitButtonDisabled : ""}`}
      >
        {isSubmitting
          ? "Processing..."
          : `Complete Purchase — ${formatCurrency(cartPrice)}`}
      </button>
    </form>
  );
}

export default Form;
