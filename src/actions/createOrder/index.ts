"use server";

import { redirect } from "next/navigation";

import { getCurrentSession } from "@/lib/adminAccess";

import { createOrder } from "./createOrder";
import { parseCreateOrderForm } from "./parseCreateOrderForm";

export type CreateOrderState = { success: false; error: string } | undefined;

export default async function index(
  _previousState: CreateOrderState,
  formData: FormData,
): Promise<CreateOrderState> {
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
  redirect(result.redirectUrl);
}
