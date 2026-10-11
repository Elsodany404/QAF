"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export type UpdateProfileResult =
  { success: true } | { success: false; error: string };

export async function updateProfile(
  name: string,
): Promise<UpdateProfileResult> {
  const normalizedName = name.trim();
  if (normalizedName.length < 2 || normalizedName.length > 80) {
    return {
      success: false,
      error: "Name must be between 2 and 80 characters",
    };
  }

  try {
    await auth.api.updateUser({
      body: { name: normalizedName },
      headers: await headers(),
    });
    revalidatePath("/user");
    return { success: true };
  } catch {
    return { success: false, error: "Could not update your profile" };
  }
}
