/*
 * Test build switch. While it's on, people can sign up, verify their email,
 * browse and go through checkout, but no order is ever created: no payment,
 * no courier, nothing in the dashboard. All the order code stays in place
 * and is refused on the server (checkout, admin manual orders and the order
 * insert itself). The checkout and sign-up pages tell visitors.
 *
 * Set to false for the production build.
 */
export const TEST_BUILD = true;

export const ORDERS_DISABLED_MESSAGE =
  "This is a test build, so orders are turned off. Nothing was ordered and you haven't been charged.";
