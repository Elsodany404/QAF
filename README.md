# Qaf Coffee

Online store for Qaf Coffee: product catalog, cart and checkout, customer
accounts, and an admin dashboard for orders. The storefront is in English and
Arabic.

- **Next.js 16** (App Router) and React 19
- **Supabase** Postgres and storage (product catalog, orders)
- **Better Auth** for accounts (email and password, email verification)
- **Paymob** for card and mobile-wallet payments
- **Bosta** for shipping rates, deliveries and pickups
- **Resend** or any **SMTP** mailbox (e.g. Gmail) for transactional email

## Local development

Requires Node.js 20.9 or later.

```bash
npm install
cp .env.example .env   # then fill in the values
npm run dev
```

Open <http://localhost:3000>.

| Script                           | What it does                                       |
| -------------------------------- | -------------------------------------------------- |
| `npm run dev`                    | Development server                                 |
| `npm run build`                  | Production build                                   |
| `npm start`                      | Serve the production build                         |
| `npm test`                       | Unit tests (Vitest)                                |
| `npm run check`                  | Type check, lint and tests                         |
| `npm run update-types`           | Regenerate `src/supabase/database.types.ts`        |
| `npm run update-bosta-locations` | Refresh the cities and districts Bosta delivers to |

## Deploying

The app runs on any Node.js host that supports Next.js (Vercel, Render,
Railway, a VPS with `npm run build && npm start`, ...).

1. **Environment variables.** Set everything listed in `.env.example` on the
   host. `NEXT_PUBLIC_*` values are compiled into the browser bundle, so they
   must be available at build time. `NEXT_PUBLIC_SITE_URL` must be the public
   production address (for example `https://qafcoffee.store`): auth emails,
   Paymob callbacks and allowed origins are all built from it.
2. **Database.** Apply the migrations in `supabase/migrations` to the
   production project with `npx supabase db push`. Link this folder to the
   project once before the first push: `npx supabase login`, then
   `npx supabase link --project-ref <ref>`, where `<ref>` is the id in
   `NEXT_PUBLIC_SUPABASE_URL` (`https://<ref>.supabase.co`). The admin "Add
   product" form needs `20261026060915_catalog_identity_ids.sql`: before it,
   products, options and option values have no automatic ids and every
   insert fails. Apply `20261027120000_arabic_catalog.sql` before deploying
   the Arabic site: the shop's search looks in its columns.
3. **Email.** Either verify the sending domain of `RESEND_FROM_EMAIL` in
   Resend, or set the `SMTP_*` variables to a mailbox (see `.env.example`).
   Without one of them, verification and order emails are not delivered and
   nobody can finish signing up. Resend's test sender (`onboarding@resend.dev`)
   only delivers to the Resend account's owner. Contact-form messages go to
   `sales@qafcoffee.store`, or to `SHOP_INBOX_EMAIL` when it is set;
   customers' replies to the shop's emails go there too.
4. **Bosta.** Every delivery the site books asks Bosta to post its status
   changes to `https://<your-domain>/api/webhooks/bosta`, signed with
   `BOSTA_SECRET_KEY`. Set the same URL and Authorization header in the Bosta
   dashboard as well, so deliveries booked from the dashboard are tracked
   too. Shipping is charged at Bosta's own quote for the address: delivery,
   the fees on cash it collects and VAT, rounded up to whole pounds. Run
   `npm run update-bosta-locations` every few weeks: Bosta switches districts
   on and off, and checkout only offers the ones it delivers to.
5. **Paymob.** Use the live keys and integration ids in production (the
   `egy_sk_test_` / `egy_pk_test_` keys only take test cards). Each payment
   tells Paymob to notify `https://<your-domain>/api/webhooks/paymob`; the
   notification is verified with `PAYMOB_HMAC_KEY`, which must match the HMAC
   secret in the Paymob dashboard.
6. **Admin account.** Sign up on the live site, verify the email, then grant
   the admin role in the Supabase SQL editor:

   ```sql
   update "user" set role = 'admin' where email = 'you@example.com';
   ```

   The dashboard is at `/admin/dashboard`.

### Returns and refunds

Returns, refunds and cancelling a paid order are handled with the customer
on WhatsApp (the number is in `src/lib/whatsapp.ts`); the site never refunds
by itself. Customers can cancel an order from their account only while no
money has been taken (cash on delivery, or an online order not paid yet) and
before the courier has it. Otherwise their order shows a WhatsApp button
with the order number already typed: "Cancel on WhatsApp", "Request a
return on WhatsApp" or "Ask about my refund".

In the dashboard, an order paid online that won't reach the customer
(cancelled, or brought back) is listed under "Needs action". Refund it in the
Paymob dashboard, or however you agreed with the customer, then set its
payment to Refunded. A return pickup you book in Bosta's dashboard doesn't
change the order: update its status by hand.

### Arabic and English

Arabic is the default: its pages have the plain addresses (`/menu`), right to
left. The English ones are under `/en` (`/en/menu`). All pages live in
`src/app/[lang]`, and `src/proxy.ts` serves the plain addresses from the
`/ar` routes without showing the prefix. The navbar switches language and
remembers the choice in the `NEXT_LOCALE` cookie, so someone who picked
English gets English when they come back. The admin dashboard is English
only and stays at `/admin`.

- The site's text is in `src/i18n/messages/en.ts` and `ar.ts`. Both must
  have the same keys and `{placeholders}`; TypeScript and the tests check.
- Product names, descriptions, options and values have optional Arabic
  versions (`nameAr`, `descriptionAr`, `labelAr`), filled in through the
  "Add product" form or the Supabase table editor. Without them the English
  text shows on the Arabic site.
- Emails go out in the language the customer used: sign-up, password reset
  and order confirmations.

### Notes

- Product images must be **public** URLs from this project's Supabase storage
  (the `images` and `icons` buckets) or `images.pexels.com`. The admin "Add
  product" form rejects other hosts, which `next/image` can't render, and
  signed links, which expire.
- When running more than one server instance, set
  `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` to the same value on every instance.
- Pickup dates are Egyptian calendar days (`Africa/Cairo`) whatever the
  server's time zone. The dashboard only offers the days Bosta can come
  (no Fridays or holidays).
