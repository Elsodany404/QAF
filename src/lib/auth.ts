import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { after } from "next/server";
import { Pool } from "pg";
import { linkEmail, sendEmail } from "@/lib/email";
import { getSiteUrl } from "@/lib/siteUrl";

const database = new Pool({
  connectionString: process.env.SUPABASE_CONNECTION_STRING,
});

export const auth = betterAuth({
  database,

  // Every auth link (email verification, password reset) is built from
  // NEXT_PUBLIC_SITE_URL, and only that origin may call /api/auth.
  baseURL: getSiteUrl(),
  trustedOrigins: [getSiteUrl()],
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

    sendVerificationEmail: async ({ user, url }) => {
      await linkEmail({
        to: user.email,
        subject: "Verify your email address",
        intro: `Hi ${user.name}, welcome to Qaf Coffee! Confirm your email address to activate your account.`,
        url,
        action: "Verify email",
        outro: "If you didn't create an account, you can ignore this email.",
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
      await linkEmail({
        to: user.email,
        subject: "Reset your password",
        intro: `Hi ${user.name}, we received a request to reset your Qaf Coffee password. This link is valid for 1 hour.`,
        url,
        action: "Choose a new password",
        outro:
          "If you didn't ask to reset your password, you can ignore this email — your password won't change.",
      });
    },

    onExistingUserSignUp: async ({ user }) => {
      await sendEmail({
        to: user.email,
        subject: "Sign-up attempt with your email",
        text: "Someone tried to create an account using your email address. If this was you, try signing in instead — or use “Forgot password” if you can't remember it. If not, you can safely ignore this email.",
      });
    },
  },
});
