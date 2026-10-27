"use server";

import { getRequestMessages } from "@/i18n/request";
import { sendEmail, shopInbox } from "@/lib/email";
import { HONEYPOT_FIELD } from "@/lib/honeypot";
import { allowRequest } from "@/lib/rateLimit";
import type { ActionState } from "@/types/customTypes";

// Enough for anyone writing to the shop; not enough to flood its inbox.
const MESSAGE_LIMIT = { max: 5, windowMs: 10 * 60 * 1000 };

export default async function sendContactMessage(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { m } = await getRequestMessages();
  const name = formData.get("name");
  const email = formData.get("email");
  const subject = formData.get("subject");
  const message = formData.get("message");

  // Pretend it worked so bots don't learn to skip the field.
  if (formData.get(HONEYPOT_FIELD)) {
    return { status: "success", message: m.messageSent };
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
    return { status: "failed", message: m.completeAllFields };
  }

  if (
    name.length > 100 ||
    email.length > 254 ||
    subject.length > 200 ||
    message.length > 5000
  ) {
    return { status: "failed", message: m.messageTooLong };
  }

  if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
    return { status: "failed", message: m.invalidEmail };
  }

  if (!(await allowRequest("contact", MESSAGE_LIMIT))) {
    return {
      status: "failed",
      message: m.tooManyMessages,
    };
  }

  const sent = await sendEmail({
    to: shopInbox(),
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
    ? { status: "success", message: m.messageSent }
    : { status: "failed", message: m.messageNotSent };
}
