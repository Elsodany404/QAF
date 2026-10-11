import { Resend } from "resend";

/*
 * Server-only transactional email. Every send is best-effort: failures are
 * logged and reported to the caller, never thrown, so an email outage cannot
 * break checkout, payments or sign-in.
 */

let client: Resend | null = null;

function getClient() {
  if (!process.env.RESEND_API_KEY) return null;
  client ??= new Resend(process.env.RESEND_API_KEY);
  return client;
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
  const resend = getClient();
  const from = process.env.RESEND_FROM_EMAIL;

  if (!resend || !from) {
    console.error("Email not sent: RESEND_API_KEY / RESEND_FROM_EMAIL missing");
    return false;
  }

  try {
    const { error } = await resend.emails.send({ from, ...message });
    if (error) {
      console.error(`Email "${message.subject}" failed:`, error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`Email "${message.subject}" failed:`, error);
    return false;
  }
}

/** Wraps body HTML in the shared, inline-styled email layout. */
export function emailLayout(title: string, bodyHtml: string) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#fff9f0;font-family:Arial,Helvetica,sans-serif;color:#11101f;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #f1e0ca;border-radius:12px;">
      <tr>
        <td style="padding:24px 28px;border-bottom:1px solid #f8efe0;">
          <span style="font-family:Georgia,serif;font-size:22px;font-weight:bold;color:#40261f;">Qaf Coffee</span>
        </td>
      </tr>
      <tr>
        <td style="padding:28px;">
          <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:22px;color:#11101f;">${escapeHtml(title)}</h1>
          ${bodyHtml}
        </td>
      </tr>
      <tr>
        <td style="padding:16px 28px;border-top:1px solid #f8efe0;font-size:12px;color:#5b5876;">
          Questions? Reply to this email or write to sales@qafcoffee.store.
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
}: {
  to: string;
  subject: string;
  intro: string;
  url: string;
  action: string;
  outro: string;
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
    ),
  });
}
