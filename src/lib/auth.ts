import "server-only";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { after } from "next/server";
import { Pool } from "pg";
import { DEFAULT_LOCALE, pathLocale, type Locale } from "@/i18n/config";
import { format } from "@/i18n/format";
import { getMessages } from "@/i18n/messages";
import { linkEmail, linkLocale, sendEmail } from "@/lib/email";
import { getSiteUrl } from "@/lib/siteUrl";

const database = new Pool({
  connectionString: process.env.SUPABASE_CONNECTION_STRING,
});

/** The language of the page an auth request came from, by its Referer. */
function refererLocale(request?: Request): Locale {
  try {
    const referer = request?.headers.get("referer");
    return referer
      ? (pathLocale(new URL(referer).pathname) ?? DEFAULT_LOCALE)
      : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export const auth = betterAuth({
  database,

  // Every auth link (email verification, password reset) is built from
  // NEXT_PUBLIC_SITE_URL, and only that origin may call /api/auth.
  baseURL: getSiteUrl(),
  // Dev also accepts 127.0.0.1 and the LAN address phones use (see
  // allowedDevOrigins in next.config.ts).
  trustedOrigins:
    process.env.NODE_ENV === "development"
      ? [getSiteUrl(), "http://127.0.0.1:3000", "http://192.168.1.11:3000"]
      : [getSiteUrl()],
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false,
        returned: true,
      },
    },
  },
  session: {
    // Maximum session lifetime: 30 days
    expiresIn: 60 * 60 * 24 * 30,

    // Refresh the session expiration when the user is active.
    // This prevents an active user from unexpectedly getting logged out.
    updateAge: 60 * 60 * 24,
  },

  plugins: [nextCookies()],

  // Auth emails run in the background so response times don't reveal
  // whether an account exists. after() keeps the work alive once the
  // response is sent; serverless hosts would otherwise freeze the function
  // and drop the email.
  advanced: {
    backgroundTasks: { handler: (task) => after(task) },
  },

  // Brute-force protection. Only applies to requests through /api/auth, so
  // the auth forms must call authClient, not auth.api from a server action.
  // Counters live in the database because in-memory counters reset on every
  // serverless instance.
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 5 },
      "/request-password-reset": { window: 600, max: 3 },
      "/reset-password": { window: 600, max: 10 },
      "/send-verification-email": { window: 600, max: 3 },
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    // Unverified users who try to sign in get a fresh link.
    sendOnSignIn: true,
    autoSignInAfterVerification: true,

    // The forms ask for links back to a page in their language
    // (src/lib/authActions.ts); the email is written in that language.
    sendVerificationEmail: async ({ user, url }) => {
      const locale = linkLocale(url);
      const text = getMessages(locale).emails.verify;
      await linkEmail({
        to: user.email,
        subject: text.subject,
        intro: format(text.intro, { name: user.name }),
        url,
        action: text.action,
        outro: text.outro,
        locale,
      });
    },
  },

  emailAndPassword: {
    enabled: true,

    // User must verify email before being considered authenticated.
    requireEmailVerification: true,

    // Don't automatically log them in immediately after password signup.
    autoSignIn: false,

    resetPasswordTokenExpiresIn: 60 * 60,
    // Signing out every device is the point of a reset if the account was
    // compromised.
    revokeSessionsOnPasswordReset: true,

    sendResetPassword: async ({ user, url }) => {
      const locale = linkLocale(url);
      const text = getMessages(locale).emails.resetPassword;
      await linkEmail({
        to: user.email,
        subject: text.subject,
        intro: format(text.intro, { name: user.name }),
        url,
        action: text.action,
        outro: text.outro,
        locale,
      });
    },

    onExistingUserSignUp: async ({ user }, request) => {
      const text = getMessages(refererLocale(request)).emails.existingAccount;
      await sendEmail({
        to: user.email,
        subject: text.subject,
        text: text.text,
      });
    },
  },
});
