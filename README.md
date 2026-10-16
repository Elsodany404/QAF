# Qaf Coffee

Online store for Qaf Coffee: product catalog, cart and checkout, customer
accounts, and an admin dashboard for orders.

- **Next.js 16** (App Router) and React 19
- **Supabase** Postgres and storage (product catalog, orders)
- **Better Auth** for accounts (email and password, email verification)
- **Paymob** for card and mobile-wallet payments
- **Bosta** for shipping rates, deliveries and pickups
- **Resend** for transactional email

## Local development

Requires Node.js 20.9 or later.

```bash
npm install
cp .env.example .env   # then fill in the values
npm run dev
```

Open <http://localhost:3000>.

| Script                 | What it does                                  |
| ---------------------- | --------------------------------------------- |
| `npm run dev`          | Development server                            |
| `npm run build`        | Production build                              |
| `npm start`            | Serve the production build                    |
| `npm test`             | Unit tests (Vitest)                           |
| `npm run check`        | Type check, lint and tests                    |
| `npm run update-types` | Regenerate `src/supabase/database.types.ts`   |

## Deploying

The app runs on any Node.js host that supports Next.js (Vercel, Render,
Railway, a VPS with `npm run build && npm start`, ...).

1. **Environment variables.** Set everything listed in `.env.example` on the
   host. `NEXT_PUBLIC_*` values are compiled into the browser bundle, so they
   must be available at build time. `NEXT_PUBLIC_SITE_URL` must be the public
   production address (for example `https://qafcoffee.store`): auth emails,
   Paymob callbacks and allowed origins are all built from it.
2. **Database.** Apply the migrations in `supabase/migrations` to the
   production project (`npx supabase db push`).
3. **Email.** Verify the sending domain of `RESEND_FROM_EMAIL` in Resend, or
   verification and order emails will not be delivered.
4. **Bosta webhook.** In the Bosta dashboard, point the delivery webhook to
   `https://<your-domain>/api/webhooks/bosta` and set its Authorization header
   to the value of `BOSTA_SECRET_KEY`.
5. **Paymob.** Each payment tells Paymob to notify
   `https://<your-domain>/api/webhooks/paymob`; the notification is verified
   with `PAYMOB_HMAC_KEY`, which must match the HMAC secret in the Paymob
   dashboard.
6. **Admin account.** Sign up on the live site, verify the email, then grant
   the admin role in the Supabase SQL editor:

   ```sql
   update "user" set role = 'admin' where email = 'you@example.com';
   ```

   The dashboard is at `/admin/dashboard`.

### Notes

- Product images must be **public** URLs from this project's Supabase storage
  (the `images` and `icons` buckets) or `images.pexels.com`. The admin "Add
  product" form rejects other hosts, which `next/image` can't render, and
  signed links, which expire.
- When running more than one server instance, set
  `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` to the same value on every instance.
- Pickup dates use the server's clock; setting `TZ=Africa/Cairo` on the host
  keeps "today" aligned with Egyptian time.
