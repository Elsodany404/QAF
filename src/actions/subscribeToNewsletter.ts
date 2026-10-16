"use server";

import { sendEmail, SHOP_EMAIL } from "@/lib/email";
import { HONEYPOT_FIELD } from "@/lib/honeypot";
import type { ActionState } from "@/types/customTypes";

/** Footer sign-up: forwards the address to the shop inbox. */
export default async function subscribeToNewsletter(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const joined: ActionState = {
    status: "success",
    message: "Thanks for joining! We'll be in touch.",
  };

  // Pretend it worked so bots don't learn to skip the field.
  if (formData.get(HONEYPOT_FIELD)) return joined;

  const email = formData.get("email");
  if (
    typeof email !== "string" ||
    email.length > 254 ||
    !/^\S+@\S+\.\S+$/.test(email.trim())
  ) {
    return { status: "failed", message: "Please enter a valid email address." };
  }

  const sent = await sendEmail({
    to: SHOP_EMAIL,
    replyTo: email.trim(),
    subject: "[Website] Newsletter sign-up",
    text: `${email.trim()} asked to join the Qaf Coffee newsletter.`,
  });

  return sent
    ? joined
    : { status: "failed", message: "Something went wrong. Please try again." };
}
