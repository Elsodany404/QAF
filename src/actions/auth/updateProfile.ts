"use server";

import { getRequestMessages } from "@/i18n/request";
import { revalidateEveryLanguage } from "@/i18n/revalidate";
import { auth } from "@/lib/auth";
import { getCurrentSession } from "@/lib/adminAccess";
import { IS_TEST_BUILD, isTestAccount } from "@/lib/testBuild";
import { headers } from "next/headers";

export type UpdateProfileResult =
  { success: true } | { success: false; error: string };

export async function updateProfile(
  name: string,
): Promise<UpdateProfileResult> {
  const { m } = await getRequestMessages();
  // Server actions can be called with anything, not just what the form sends.
  const normalizedName = typeof name === "string" ? name.trim() : "";
  if (normalizedName.length < 2 || normalizedName.length > 80) {
    return {
      success: false,
      error: m.nameLength,
    };
  }

  // Everyone shares the test account, so nobody may rename it.
  if (IS_TEST_BUILD) {
    const session = await getCurrentSession();
    if (isTestAccount(session?.user.email)) {
      return { success: false, error: m.testAccountLocked };
    }
  }

  try {
    await auth.api.updateUser({
      body: { name: normalizedName },
      headers: await headers(),
    });
    revalidateEveryLanguage("/user");
    return { success: true };
  } catch {
    return { success: false, error: m.profileNotUpdated };
  }
}
