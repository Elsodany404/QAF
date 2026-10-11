import type {
  orderPayloadT,
  PaymentMethod,
  SecureCart,
} from "@/types/customTypes";

type ParseCreateOrderFormResult =
  | {
      success: true;
      data: Omit<
        orderPayloadT,
        "cart" | "customerID" | "shippingFees" | "paymentMethod"
      > & { paymentMethod: PaymentMethod; secureCart: SecureCart };
    }
  | { success: false; error: string };

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
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail) ||
    !customerPhone.trim() ||
    !city.trim() ||
    !cityID.trim() ||
    !district.trim() ||
    !districtID.trim() ||
    !street.trim() ||
    !apartment.trim()
  ) {
    return { success: false, error: "Invalid order form data" };
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

  return {
    success: true,
    data: {
      paymentMethod: paymentMethod as PaymentMethod,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim(),
      city: city.trim(),
      cityID: cityID.trim(),
      district: district.trim(),
      districtID: districtID.trim(),
      street: street.trim(),
      apartment: apartment.trim(),
      secureCart,
    },
  };
}
