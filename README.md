# Printables Store

A storefront for selling 3D printable STL and 3MF files. Buyers browse models, preview them in 3D, pay once through Stripe, and download instantly from a lifetime library. One admin lists products and manages orders.

Built with Next.js, Prisma + Postgres, Stripe Checkout + Stripe Tax, Cloudflare R2 and Resend.

## Run locally

```bash
cp .env.example .env        # fill in the values
npm install
npx prisma migrate dev      # creates the database tables
npm run seed                # optional: two sample products
npm run dev
```

Then:

1. Open http://localhost:3000/login and sign in with the `ADMIN_EMAIL` address. Without `RESEND_API_KEY` the magic link is printed in the terminal.
2. Go to `/admin/products`, open a product, and upload STL/3MF files, photos, and an optional `.glb` preview mesh.
3. Test checkout with Stripe test cards. Forward webhooks with `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.

## How it fits together

- `src/app` — storefront pages (`/`, `/models`, `/models/[slug]`, `/cart`, `/library`), checkout, admin, and API routes.
- `src/lib` — Prisma client, Stripe, R2 signed URLs, magic-link auth, cart cookie, order granting.
- `prisma/schema.prisma` — products, versions, files, customers, orders, entitlements, downloads.

Model files live in a private R2 bucket under `models/`. A download request checks the buyer's entitlement, logs it, and redirects to a 10‑minute signed URL. Photos and preview meshes live under `public/`.

Stripe's `checkout.session.completed` webhook records the order and grants entitlements; the success page does the same from the verified session in case the webhook is late. Both are idempotent. `charge.refunded` revokes access.

## Deploy

Vercel for the app, Neon for Postgres, R2 for files. Set every variable from `.env.example` in the Vercel project, run `npx prisma migrate deploy` against the production database, and point a Stripe webhook at `/api/webhooks/stripe` for `checkout.session.completed` and `charge.refunded`.

## Not yet built

Per the spec these come in later phases: bundles, filters, reviews, membership (Stripe Billing), automatic preview-mesh generation on upload (for now upload a `.glb` you decimate yourself), download stamping with the order id, and TOTP for the admin account.
