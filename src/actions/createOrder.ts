"use server";

import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { postOrder } from "@/services/Order";
import {
  ActionState,
  Cart,
  DataItem,
  Item,
  secureCart as SecureCart,
} from "@/types/customTypes";
import { OptionValue } from "@/types/db";
import { calculateBostaFees } from "@/services/Bosta";
import { constructData, generateItemID } from "@/helper/helper";

import { createPayment } from "./createPayment";
import { createDelivery } from "./createDelivery";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
);

export default async function createOrder(
  _previousState: unknown,
  formData: FormData,
) {
  let redirectUrl: string | null = null;

  /*
   * =========================================================
   * FORM DATA
   * =========================================================
   */

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
      status: "failed",
      message: "Invalid order form data",
    };
  }

  /*
   * =========================================================
   * SECURE CART
   * =========================================================
   */

  const secureCartValue = formData.get("secureCart");

  if (typeof secureCartValue !== "string" || !secureCartValue) {
    throw new Error("Cart is missing");
  }

  let secureCart: SecureCart;

  try {
    secureCart = JSON.parse(secureCartValue);
  } catch {
    throw new Error("Invalid cart data");
  }

  if (!Array.isArray(secureCart) || secureCart.length === 0) {
    throw new Error("Cart is empty");
  }

  /*
   * =========================================================
   * VALIDATE BASIC CART STRUCTURE
   * =========================================================
   */

  for (const secureCartItem of secureCart) {
    if (
      !secureCartItem ||
      typeof secureCartItem !== "object" ||
      !Number.isInteger(secureCartItem.productID) ||
      !Array.isArray(secureCartItem.optionsIDs) ||
      !Array.isArray(secureCartItem.valuesIDs) ||
      !Number.isInteger(secureCartItem.quantity) ||
      secureCartItem.quantity <= 0
    ) {
      throw new Error("Invalid cart item");
    }

    if (
      !secureCartItem.optionsIDs.every(
        (id) => Number.isInteger(id) && id > 0,
      ) ||
      !secureCartItem.valuesIDs.every((id) => Number.isInteger(id) && id > 0)
    ) {
      throw new Error("Invalid option or value selection");
    }
  }

  /*
   * =========================================================
   * FETCH PRODUCTS
   * =========================================================
   */

  const productIDs = [...new Set(secureCart.map((item) => item.productID))];

  const { data, error } = await supabaseAdmin
    .from("Product")
    .select(
      `
        *,
        ProductOptions(
          optionID(
            *,
            OptionValues(*)
          )
        )
      `,
    )
    .in("id", productIDs);

  if (error) {
    throw new Error(`Error fetching products: ${error.message}`);
  }

  if (!data || data.length !== productIDs.length) {
    throw new Error("One or more products are no longer available");
  }

  /*
   * =========================================================
   * TRANSFORM PRODUCTS
   * =========================================================
   */

  const dataItems: DataItem[] = data.map((item: any) => {
    const { ProductOptions, ...product } = item;

    const rawData = {
      ...product,
      options: ProductOptions?.map((opt: any) => opt.optionID) ?? [],
    };

    return constructData(rawData);
  });

  /*
   * =========================================================
   * BUILD SERVER-TRUSTED CART
   * =========================================================
   */

  const cart: Cart = [];

  for (const secureCartItem of secureCart) {
    /*
     * -------------------------------------------------------
     * Find product
     * -------------------------------------------------------
     */

    const dataItem = dataItems.find(
      (item) => item.product.id === secureCartItem.productID,
    );

    if (!dataItem) {
      throw new Error(`Product ${secureCartItem.productID} not found`);
    }

    /*
     * -------------------------------------------------------
     * Validate options
     * -------------------------------------------------------
     */

    const availableOptionIDs = new Set(
      dataItem.options.map((option) => option.id),
    );

    for (const optionID of secureCartItem.optionsIDs) {
      if (!availableOptionIDs.has(optionID)) {
        throw new Error(
          `Option ${optionID} does not belong to product ${dataItem.product.id}`,
        );
      }
    }

    /*
     * -------------------------------------------------------
     * Resolve value IDs to actual OptionValue objects
     * -------------------------------------------------------
     *
     * Item.options requires:
     *
     * OptionValue[]
     *
     * NOT:
     *
     * number[]
     */

    const selectedValues: OptionValue[] = [];

    for (const valueID of secureCartItem.valuesIDs) {
      let selectedValue: OptionValue | undefined;
      let selectedOptionID: number | undefined;

      for (const option of dataItem.options) {
        const value = option.values.find(
          (optionValue) => optionValue.id === valueID,
        );

        if (value) {
          selectedValue = value;
          selectedOptionID = option.id;
          break;
        }
      }

      /*
       * Value does not belong to this product.
       */

      if (!selectedValue) {
        throw new Error(
          `Value ${valueID} does not belong to product ${dataItem.product.id}`,
        );
      }

      /*
       * Value must belong to one of the selected options.
       */

      if (
        selectedOptionID === undefined ||
        !secureCartItem.optionsIDs.includes(selectedOptionID)
      ) {
        throw new Error(
          `Value ${valueID} is not valid for the selected options`,
        );
      }

      selectedValues.push(selectedValue);
    }

    /*
     * -------------------------------------------------------
     * Prevent duplicate values
     * -------------------------------------------------------
     */

    const uniqueValueIDs = new Set(selectedValues.map((value) => value.id));

    if (uniqueValueIDs.size !== selectedValues.length) {
      throw new Error(
        `Duplicate option value selected for product ${dataItem.product.id}`,
      );
    }

    /*
     * -------------------------------------------------------
     * Every selected option must have exactly one value
     * -------------------------------------------------------
     */

    for (const optionID of secureCartItem.optionsIDs) {
      const option = dataItem.options.find((item) => item.id === optionID);

      if (!option) {
        throw new Error(`Option ${optionID} not found`);
      }

      const valuesForOption = selectedValues.filter((selectedValue) =>
        option.values.some(
          (optionValue) => optionValue.id === selectedValue.id,
        ),
      );

      if (valuesForOption.length !== 1) {
        throw new Error(`Invalid value selection for option ${optionID}`);
      }
    }

    

    const optionPrice = selectedValues.reduce((total, optionValue) => {
      const modifier = Number(optionValue.priceModifier);

      if (!Number.isFinite(modifier)) {
        throw new Error(
          `Invalid price data for option value ${optionValue.id}`,
        );
      }

      return total + modifier;
    }, 0);

    /*
     * =========================================================
     * PRODUCT PRICE
     * =========================================================
     */

    const productPrice = Number(dataItem.product.price);

    if (!Number.isFinite(productPrice)) {
      throw new Error(
        `Invalid product price for product ${dataItem.product.id}`,
      );
    }

    /*
     * Final price for ONE unit of this cart item.
     */

    const itemPrice = productPrice * (1 + optionPrice);

    /*
     * =========================================================
     * CREATE ITEM
     * =========================================================
     */

    const cartItem: Item = {
      itemID: generateItemID(dataItem.product.id, secureCartItem.valuesIDs),

      product: dataItem.product,

      options: selectedValues,

      quantity: secureCartItem.quantity,

      itemPrice,
    };

    cart.push(cartItem);
  }

  /*
   * =========================================================
   * CART TOTAL
   * =========================================================
   */

  const cartTotal = cart.reduce(
    (total, item) => total + item.itemPrice * item.quantity,
    0,
  );

  if (!Number.isFinite(cartTotal) || cartTotal < 0) {
    throw new Error("Invalid cart total");
  }

  /*
   * =========================================================
   * SHIPPING
   * =========================================================
   */

  let shippingFees: number;

  try {
    shippingFees = await calculateBostaFees(city, cartTotal);
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to calculate shipping fees",
    );
  }

  if (!Number.isFinite(shippingFees) || shippingFees < 0) {
    throw new Error("Invalid shipping fee");
  }

  /*
   * =========================================================
   * CREATE ORDER
   * =========================================================
   */

  try {
    const orderPayload = {
      customerName,
      customerEmail,
      customerPhone,

      city,
      cityID,

      district,
      districtID,

      street,
      apartment,

      paymentMethod,
      shippingFees,

      cart,
    };

    console.log("Calling postOrder now...");

    const orderID = await postOrder(orderPayload);

    console.log("Post order created successfully. Order ID:", orderID);

    if (!orderID) {
      throw new Error("Failed to create order");
    }

    /*
     * =======================================================
     * CASH ON DELIVERY
     * =======================================================
     */

    if (orderPayload.paymentMethod === "cash_on_delivery") {
      await createDelivery(orderID);

      redirectUrl = `/order-success/${orderID}`;
    } else {
      /*
       * =====================================================
       * PAYMOB
       * =====================================================
       */

      const payment = await createPayment(orderID);

      if (!payment.success) {
        throw new Error(payment.error);
      }

      const publicKey = process.env.NEXT_PUBLIC_PAYMOB_PUBLIC_KEY;

      if (!publicKey) {
        throw new Error("PAYMOB_PUBLIC_KEY is not configured");
      }

      redirectUrl =
        "https://accept.paymob.com/unifiedcheckout/" +
        `?publicKey=${encodeURIComponent(publicKey)}` +
        `&clientSecret=${encodeURIComponent(payment.data.client_secret)}`;
    }
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Unexpected error happened",
    );
  }

  /*
   * =========================================================
   * REDIRECT
   * =========================================================
   *
   * Keep redirect OUTSIDE the try/catch.
   */

  if (!redirectUrl) {
    throw new Error("No redirect URL was generated");
  }

  redirect(redirectUrl);
}
