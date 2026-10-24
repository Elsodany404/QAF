"use server";

import { redirect, RedirectType } from "next/navigation";

import { getCurrentSession } from "@/lib/adminAccess";
import { ORDERS_DISABLED_MESSAGE, TEST_BUILD } from "@/lib/testBuild";

import { createOrder, type CreateOrderFailure } from "./createOrder";
import { parseCreateOrderForm } from "./parseCreateOrderForm";

export type CreateOrderState = CreateOrderFailure | undefined;

export default async function index(
  _previousState: CreateOrderState,
  formData: FormData,
): Promise<CreateOrderState> {
  if (TEST_BUILD) {
    return { success: false, error: ORDERS_DISABLED_MESSAGE };
  }

  const session = await getCurrentSession();

  if (!session?.user) {
    return {
      success: false,
      error: "Please sign in to place your order",
    };
  }

  const inputResult = parseCreateOrderForm(formData);

  if (!inputResult.success) {
    return inputResult;
  }

  const result = await createOrder({
    customerID: session.user.id,
    input: inputResult.data,
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
