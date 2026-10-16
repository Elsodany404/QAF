import type { Cart, DataItem, Item, SecureCart } from "@/types/customTypes";
import type { OptionValue } from "@/types/db";

import supabaseAdmin from "@/supabase/admin";

import {
  PRODUCT_WITH_OPTIONS,
  toDataItem,
  type ProductRow,
} from "@/utils/constructAPI";
import { MAX_CART_LINES, MAX_QUANTITY_PER_ITEM } from "@/utils/cartLimits";
import { calcPrice, generateItemID } from "@/utils/helper";

type BuildServerCartResult =
  | {
      success: true;
      cart: Cart;
    }
  | {
      success: false;
      error: string;
    };

export async function buildServerCart(
  secureCart: SecureCart,
): Promise<BuildServerCartResult> {
  /*
   * =========================================================
   * VALIDATE BASIC CART STRUCTURE
   * =========================================================
   */

  if (secureCart.length > MAX_CART_LINES) {
    return { success: false, error: "Too many items in the cart" };
  }

  for (const secureCartItem of secureCart) {
    if (
      !secureCartItem ||
      typeof secureCartItem !== "object" ||
      !Number.isInteger(secureCartItem.productID) ||
      !Array.isArray(secureCartItem.optionsIDs) ||
      !Array.isArray(secureCartItem.valuesIDs) ||
      !Number.isInteger(secureCartItem.quantity) ||
      secureCartItem.quantity <= 0 ||
      secureCartItem.quantity > MAX_QUANTITY_PER_ITEM
    ) {
      console.error("failed creating order: invalid cart item");

      return {
        success: false,
        error: "Invalid cart item",
      };
    }

    if (
      !secureCartItem.optionsIDs.every(
        (id) => Number.isInteger(id) && id > 0,
      ) ||
      !secureCartItem.valuesIDs.every((id) => Number.isInteger(id) && id > 0)
    ) {
      console.error("failed creating order: invalid option or value selection");

      return {
        success: false,
        error: "Invalid option or value selection",
      };
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
    .select(PRODUCT_WITH_OPTIONS)
    .in("id", productIDs);

  if (error) {
    console.error("failed creating order: error fetching products", error);

    return {
      success: false,
      error: "We couldn't load your cart's products. Please try again.",
    };
  }

  if (!data || data.length !== productIDs.length) {
    console.error(
      "failed creating order: one or more products are no longer available",
    );

    return {
      success: false,
      error: "One or more products are no longer available",
    };
  }

  /*
   * =========================================================
   * TRANSFORM PRODUCTS
   * =========================================================
   */

  const dataItems: DataItem[] = (data as ProductRow[]).map(toDataItem);

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

    const dataItem = dataItems.filter(
      (item) => item.product.id === secureCartItem.productID,
    )[0];

    if (!dataItem) {
      console.error(
        `failed creating order: Product ${secureCartItem.productID} not found`,
      );

      return {
        success: false,
        error: `Product ${secureCartItem.productID} not found`,
      };
    }

    if (!dataItem.product.inStock) {
      return {
        success: false,
        error: `Product ${dataItem.product.name} is out of stock`,
      };
    }

    /*
     * -------------------------------------------------------
     * Validate options
     * -------------------------------------------------------
     */

    const availableOptionIDs = new Set(
      dataItem.options.map((option) => option.id),
    );

    if (
      new Set(secureCartItem.optionsIDs).size !==
        secureCartItem.optionsIDs.length ||
      secureCartItem.optionsIDs.length !== availableOptionIDs.size ||
      [...availableOptionIDs].some(
        (optionID) => !secureCartItem.optionsIDs.includes(optionID),
      )
    ) {
      return {
        success: false,
        error: `Invalid option selection for product ${dataItem.product.id}`,
      };
    }

    for (const optionID of secureCartItem.optionsIDs) {
      if (!availableOptionIDs.has(optionID)) {
        console.error(
          `failed creating order: Option ${optionID} does not belong to product ${dataItem.product.id}`,
        );

        return {
          success: false,
          error: `Option ${optionID} does not belong to product ${dataItem.product.id}`,
        };
      }
    }

    /*
     * -------------------------------------------------------
     * Validate selected values
     * -------------------------------------------------------
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
        console.error(
          `failed creating order: Value ${valueID} does not belong to product ${dataItem.product.id}`,
        );

        return {
          success: false,
          error: `Value ${valueID} does not belong to product ${dataItem.product.id}`,
        };
      }

      if (!selectedValue.inStock) {
        return {
          success: false,
          error: `Selected option value ${valueID} is out of stock`,
        };
      }

      /*
       * Value must belong to one of the selected options.
       */

      if (
        selectedOptionID === undefined ||
        !secureCartItem.optionsIDs.includes(selectedOptionID)
      ) {
        console.error(
          `failed creating order: Value ${valueID} is not valid for the selected options`,
        );

        return {
          success: false,
          error: `Value ${valueID} is not valid for the selected options`,
        };
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
      console.error(
        `failed creating order: Duplicate option value selected for product ${dataItem.product.id}`,
      );

      return {
        success: false,
        error: `Duplicate option value selected for product ${dataItem.product.id}`,
      };
    }

    /*
     * -------------------------------------------------------
     * Every selected option must have exactly one value
     * -------------------------------------------------------
     */

    for (const optionID of secureCartItem.optionsIDs) {
      const option = dataItem.options.find((item) => item.id === optionID);

      if (!option) {
        console.error(`failed creating order: Option ${optionID} not found`);

        return {
          success: false,
          error: `Option ${optionID} not found`,
        };
      }

      const valuesForOption = selectedValues.filter((selectedValue) =>
        option.values.some(
          (optionValue) => optionValue.id === selectedValue.id,
        ),
      );

      if (valuesForOption.length !== 1) {
        console.error(
          `failed creating order: Invalid value selection for option ${optionID}`,
        );

        return {
          success: false,
          error: `Invalid value selection for option ${optionID}`,
        };
      }
    }

    /*
     * Final price for ONE unit of this cart item. Uses the same formula as
     * the storefront so the customer is charged exactly what they saw.
     */

    const itemPrice = calcPrice(dataItem.product, selectedValues);

    if (!Number.isFinite(itemPrice) || itemPrice <= 0) {
      return {
        success: false,
        error: `Invalid price for product ${dataItem.product.id}`,
      };
    }

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

  return {
    success: true,
    cart,
  };
}
