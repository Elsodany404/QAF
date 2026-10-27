"use server";

import { getRequestMessages } from "@/i18n/request";
import { errorMessage, isValidOrderID } from "@/lib/actionHelpers";
import { getCurrentSession } from "@/lib/adminAccess";
import { canPayOrder } from "@/lib/orderStatus";
import { getOrderWithItems } from "@/services/Order";
import { createPaymobCheckout } from "@/services/Paymob";
import type { ActionReturnType } from "@/types/customTypes";

/**
 * Starts (or retries) online payment for an unpaid order owned by the
 * current user. Returns the Paymob checkout URL in `data`.
 */
export async function payOrder(orderID: number): Promise<ActionReturnType> {
  const { locale, m } = await getRequestMessages();
  try {
    const session = await getCurrentSession();
    if (!session?.user) {
      return { success: false, error: m.signInToPay };
    }
    if (!isValidOrderID(orderID)) {
      return { success: false, error: m.invalidOrder };
    }

    const order = await getOrderWithItems(orderID);
    if (!order || order.customer_ID !== session.user.id) {
      return { success: false, error: m.orderNotFound };
    }
    if (!canPayOrder(order)) {
      return { success: false, error: m.cannotPayOnline };
    }

    // Paymob sends the customer back to the order page in this language.
    return { success: true, data: await createPaymobCheckout(order, locale) };
  } catch (err) {
    // The underlying errors are in English.
    return {
      success: false,
      error: locale === "en" ? errorMessage(err) : m.unexpected,
    };
  }
}
