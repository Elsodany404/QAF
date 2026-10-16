"use server";

import { sendEmail, SHOP_EMAIL } from "@/lib/email";
import { HONEYPOT_FIELD } from "@/lib/honeypot";
import type { ActionState } from "@/types/customTypes";

export default async function sendContactMessage(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = formData.get("name");
  const email = formData.get("email");
  const subject = formData.get("subject");
  const message = formData.get("message");

  // Pretend it worked so bots don't learn to skip the field.
  if (formData.get(HONEYPOT_FIELD)) {
    return { status: "success", message: "Thanks. Your message has been sent." };
  }

  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof subject !== "string" ||
    typeof message !== "string" ||
    !name.trim() ||
    !email.trim() ||
    !subject.trim() ||
    !message.trim()
  ) {
    return { status: "failed", message: "Please complete all fields." };
  }

  if (
    name.length > 100 ||
    email.length > 254 ||
    subject.length > 200 ||
    message.length > 5000
  ) {
    return { status: "failed", message: "Your message is too long." };
  }

  if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
    return { status: "failed", message: "Please enter a valid email address." };
  }

  const sent = await sendEmail({
    to: SHOP_EMAIL,
    replyTo: email.trim(),
    // Keep the subject on one line.
    subject: `[Website contact] ${subject.replace(/\s+/g, " ").trim()}`,
    text: [
      `Name: ${name.trim()}`,
      `Email: ${email.trim()}`,
      `Subject: ${subject.trim()}`,
      "",
      message.trim(),
    ].join("\n"),
  });

  return sent
    ? { status: "success", message: "Thanks. Your message has been sent." }
    : { status: "failed", message: "Unable to send your message." };
}
