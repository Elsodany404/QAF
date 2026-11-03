"use server";

import { redirect, RedirectType } from "next/navigation";

import { getRequestMessages } from "@/i18n/request";
import { getCurrentSession } from "@/lib/adminAccess";
import { IS_TEST_BUILD } from "@/lib/testBuild";

import { createOrder, type CreateOrderFailure } from "./createOrder";
import { parseCreateOrderForm } from "./parseCreateOrderForm";

export type CreateOrderState = CreateOrderFailure | undefined;

export default async function index(
  _previousState: CreateOrderState,
  formData: FormData,
): Promise<CreateOrderState> {
  const [session, { locale, m }] = await Promise.all([
    getCurrentSession(),
    getRequestMessages(),
  ]);

  if (!session?.user) {
    return {
      success: false,
      error: m.signInToOrder,
    };
  }

  // The test build lets anyone reach the checkout, never place an order.
  if (IS_TEST_BUILD) {
    return { success: false, error: m.ordersDisabled };
  }

  const inputResult = parseCreateOrderForm(formData, locale);

  if (!inputResult.success) {
    return inputResult;
  }

  const result = await createOrder({
    customerID: session.user.id,
    input: inputResult.data,
    locale,
  });

  if (!result.success) {
    console.error("failed creating order:", result.error);
    return result;
  }

  // IMPORTANT:
  // redirect() stays outside try/catch.
  // Replace the checkout in the history: Back from the confirmation (or from
  // Paymob) must not return to a checkout whose order is already placed.
  redirect(result.redirectUrl, RedirectType.replace);
}
