import "server-only";
import nodemailer from "nodemailer";
import { Resend } from "resend";

import {
  DEFAULT_LOCALE,
  localeDirection,
  pathLocale,
  type Locale,
} from "@/i18n/config";
import { format } from "@/i18n/format";
import { getMessages } from "@/i18n/messages";

/*
 * Server-only transactional email. Every send is best-effort: failures are
 * logged and reported to the caller, never thrown, so an email outage cannot
 * break checkout, payments or sign-in.
 *
 * Two senders, picked by which variables are set:
 *   - SMTP (SMTP_HOST, SMTP_USER, SMTP_PASS; optional SMTP_PORT, SMTP_FROM):
 *     any mailbox with SMTP access, e.g. a Gmail account with an app
 *     password. It delivers to any address without verifying a domain, so
 *     it's what test builds use. It wins when configured.
 *   - Resend (RESEND_API_KEY, RESEND_FROM_EMAIL): only emails other people
 *     once the sending domain is verified in Resend.
 */

/** The shop's public address, shown in emails and on the site. */
export const SHOP_EMAIL = "sales@qafcoffee.store";

/**
 * Where contact-form messages are delivered, and where
 * customers' replies to our emails go: SHOP_INBOX_EMAIL when set (e.g. a
 * Gmail inbox while the shop's own mailbox is unavailable), the shop's
 * public address otherwise.
 */
export function shopInbox(): string {
  return process.env.SHOP_INBOX_EMAIL?.trim() || SHOP_EMAIL;
}

/** Sends one message; throws if the provider refuses it. */
type Sender = (message: EmailMessage) => Promise<void>;

function smtpSender(): Sender | null {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  const port = Number(process.env.SMTP_PORT) || 465;
  // Gmail and most providers only send as the signed-in mailbox.
  const from = process.env.SMTP_FROM?.trim() || user;
  const transporter = nodemailer.createTransport({
    host,
    port,
    // 465 speaks TLS from the start; 587 upgrades with STARTTLS.
    secure: port === 465,
    auth: { user, pass },
    // A slow mail server must not hold up checkout or a webhook for minutes.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });

  return async (message) => {
    await transporter.sendMail({ from, ...message });
  };
}

let resendClient: Resend | null = null;

function resendSender(): Sender | null {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return null;

  const resend = (resendClient ??= new Resend(apiKey));
  return async (message) => {
    const { error } = await resend.emails.send({ from, ...message });
    if (error) throw new Error(error.message);
  };
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

export async function sendEmail(message: EmailMessage): Promise<boolean> {
  const send = smtpSender() ?? resendSender();

  if (!send) {
    console.error(
      "Email not sent: set SMTP_HOST / SMTP_USER / SMTP_PASS, or RESEND_API_KEY / RESEND_FROM_EMAIL",
    );
    return false;
  }

  // Replies to an email sent to a customer reach the shop, not a no-reply
  // sender.
  const inbox = shopInbox();
  const replyTo = message.replyTo ?? (message.to === inbox ? undefined : inbox);

  try {
    await send({ ...message, ...(replyTo && { replyTo }) });
    return true;
  } catch (error) {
    console.error(
      `Email "${message.subject}" failed:`,
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

/**
 * The language of an auth email, from the page its link returns to:
 * "…/verify-email?token=…&callbackURL=%2Far%2Fverify-email" is Arabic.
 */
export function linkLocale(url: string): Locale {
  try {
    const callbackURL = new URL(url).searchParams.get("callbackURL") ?? "";
    return pathLocale(callbackURL) ?? DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

/**
 * Wraps body HTML in the shared, inline-styled email layout, laid out right
 * to left for Arabic.
 */
export function emailLayout(
  title: string,
  bodyHtml: string,
  locale: Locale = DEFAULT_LOCALE,
) {
  const t = getMessages(locale);
  const dir = localeDirection(locale);
  const align = dir === "rtl" ? "right" : "left";
  // Georgia has no Arabic letters; the client's own Arabic font looks better
  // than a fallback picked by chance.
  const displayFont =
    locale === "ar" ? "Tahoma,Arial,sans-serif" : "Georgia,serif";

  return `<!doctype html>
<html lang="${locale}" dir="${dir}">
  <body dir="${dir}" style="margin:0;padding:24px;background:#fff9f0;font-family:Arial,Helvetica,sans-serif;color:#11101f;text-align:${align};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="${dir}" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #f1e0ca;border-radius:12px;">
      <tr>
        <td style="padding:24px 28px;border-bottom:1px solid #f8efe0;text-align:${align};">
          <span style="font-family:${displayFont};font-size:22px;font-weight:bold;color:#40261f;">${escapeHtml(t.common.brand)}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:28px;text-align:${align};">
          <h1 style="margin:0 0 16px;font-family:${displayFont};font-size:22px;color:#11101f;">${escapeHtml(title)}</h1>
          ${bodyHtml}
        </td>
      </tr>
      <tr>
        <td style="padding:16px 28px;border-top:1px solid #f8efe0;font-size:12px;color:#5b5876;text-align:${align};">
          ${escapeHtml(format(t.emails.footer, { email: SHOP_EMAIL }))}
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function emailButton(href: string, label: string) {
  return `<p style="margin:24px 0;"><a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 20px;border-radius:8px;background:#eab22d;color:#0c0b16;font-weight:bold;text-decoration:none;">${escapeHtml(label)}</a></p>`;
}

export function linkEmail({
  to,
  subject,
  intro,
  url,
  action,
  outro,
  locale = DEFAULT_LOCALE,
}: {
  to: string;
  subject: string;
  intro: string;
  url: string;
  action: string;
  outro: string;
  locale?: Locale;
}) {
  return sendEmail({
    to,
    subject,
    text: `${intro}\n\n${url}\n\n${outro}`,
    html: emailLayout(
      subject,
      `<p style="margin:0;line-height:1.6;">${escapeHtml(intro)}</p>
       ${emailButton(url, action)}
       <p style="margin:0;font-size:13px;line-height:1.6;color:#5b5876;">${escapeHtml(outro)}</p>`,
      locale,
    ),
  });
}
