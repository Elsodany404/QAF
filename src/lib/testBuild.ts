/*
 * Test build: a public demo of the store. Turn it on with
 * NEXT_PUBLIC_TEST_BUILD=true. Visitors see a banner on the account pages
 * and the checkout, can sign in with the shared test account below, and can
 * browse all the way to the checkout, but no order can be placed or paid.
 *
 * The account is created by `npm run create-test-user`.
 */
export const IS_TEST_BUILD = process.env.NEXT_PUBLIC_TEST_BUILD === "true";

export const TEST_ACCOUNT = {
  name: "Qaf Tester",
  email: "tester@qafcoffee.test",
  password: "QafTest2026",
} as const;

export function isTestAccount(email: string | null | undefined): boolean {
  return email?.trim().toLowerCase() === TEST_ACCOUNT.email;
}
