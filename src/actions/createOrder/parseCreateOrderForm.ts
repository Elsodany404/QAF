import {
  findDeliveryAddress,
  normalizeEgyptianMobile,
} from "@/lib/bostaLocations";
import { FULL_NAME_MESSAGE, isFullName } from "@/lib/fullName";
import type {
  orderPayloadT,
  PaymentMethod,
  SecureCart,
} from "@/types/customTypes";

export type CreateOrderInput = Omit<
  orderPayloadT,
  "cart" | "customerID" | "shippingFees" | "paymentMethod"
> & {
  paymentMethod: PaymentMethod;
  secureCart: SecureCart;
  /** The total (items + shipping) the customer was shown, if sent. */
  expectedTotal?: number;
};

type ParseCreateOrderFormResult =
  { success: true; data: CreateOrderInput } | { success: false; error: string };

export function parseCreateOrderForm(
  formData: FormData,
): ParseCreateOrderFormResult {
  const paymentMethod = formData.get("paymentMethod");
  const customerName = formData.get("name");
  const customerEmail = formData.get("email");
  const customerPhone = formData.get("phone");
  const city = formData.get("city");
  const cityID = formData.get("cityID");
  const district = formData.get("district");
  const districtID = formData.get("districtID");
  const street = formData.get("street");
  const apartment = formData.get("apartment");

  if (
    typeof paymentMethod !== "string" ||
    typeof customerName !== "string" ||
    typeof customerEmail !== "string" ||
    typeof customerPhone !== "string" ||
    typeof city !== "string" ||
    typeof cityID !== "string" ||
    typeof district !== "string" ||
    typeof districtID !== "string" ||
    typeof street !== "string" ||
    typeof apartment !== "string"
  ) {
    return {
      success: false,
      error: "Invalid order form data",
    };
  }

  if (
    !["paymob_card", "mobile_wallet", "cash_on_delivery"].includes(
      paymentMethod,
    ) ||
    !customerName.trim() ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim()) ||
    !customerPhone.trim() ||
    !city.trim() ||
    !cityID.trim() ||
    !district.trim() ||
    !districtID.trim() ||
    !street.trim() ||
    !apartment.trim() ||
    customerName.length > 100 ||
    customerEmail.length > 254 ||
    street.length > 200 ||
    apartment.length > 100
  ) {
    return { success: false, error: "Invalid order form data" };
  }

  // The checkout form checks this too; the server never trusts it.
  if (!isFullName(customerName)) {
    return { success: false, error: FULL_NAME_MESSAGE };
  }

  const phone = normalizeEgyptianMobile(customerPhone);
  if (!phone) {
    return {
      success: false,
      error: "Please enter a valid Egyptian mobile number",
    };
  }

  // Shipping is priced by city name but booked by ID, so the names are taken
  // from the IDs rather than trusted from the client.
  const address = findDeliveryAddress(cityID.trim(), districtID.trim());
  if (!address) {
    return {
      success: false,
      error: "We don't deliver to the selected area. Please choose another.",
    };
  }

  const secureCartValue = formData.get("secureCart");

  if (typeof secureCartValue !== "string" || !secureCartValue) {
    return {
      success: false,
      error: "Cart is missing",
    };
  }

  let secureCart: SecureCart;

  try {
    secureCart = JSON.parse(secureCartValue);
  } catch {
    return {
      success: false,
      error: "Invalid cart data",
    };
  }

  if (
    !secureCart ||
    typeof secureCart !== "object" ||
    !Array.isArray(secureCart) ||
    secureCart.length === 0
  ) {
    return {
      success: false,
      error: "Invalid cart structure",
    };
  }

  // Optional: older checkout pages didn't send it.
  const expectedTotalValue = formData.get("expectedTotal");
  let expectedTotal: number | undefined;
  if (expectedTotalValue !== null) {
    expectedTotal =
      typeof expectedTotalValue === "string" && expectedTotalValue.trim()
        ? Number(expectedTotalValue)
        : NaN;
    if (!Number.isFinite(expectedTotal) || expectedTotal < 0) {
      return { success: false, error: "Invalid order form data" };
    }
  }

  return {
    success: true,
    data: {
      paymentMethod: paymentMethod as PaymentMethod,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: phone,
      city: address.city.cityName,
      cityID: address.city.cityId,
      district: address.district.districtName,
      districtID: address.district.districtId,
      street: street.trim(),
      apartment: apartment.trim(),
      secureCart,
      expectedTotal,
    },
  };
}
