"use server";

import { auth } from "@/lib/auth";
import { ActionState } from "@/types/customTypes";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export default async function signIn(
  previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string") {
    return { status: "failed", message: "Form payload error" };
  }

  try {
    await auth.api.signInEmail({
      body: { email, password },
      headers: await headers(),
    });
    return { status: "success", message: "Signed in successfully" };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.status === 403) {
      return { status: "failed", message: "Please verify your email address" };
    }
    return {
      status: "failed",
      message: error.message || "Invalid email or password",
    };
  }
}
