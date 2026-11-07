# Stripe integration — audit the existing backend, do not rebuild

**Source audit 2026-11-07:** Stripe is implemented in the Express/Prisma 7 backend. The frontend must use Stripe only. The actual environment and a live transaction have not been verified. No secret value was read or recorded.

## M0 backend Stripe audit

- [x] Locate actual Stripe library/version and environment variable **names** (never values).
- [x] Locate actual Checkout Session/payment initiation endpoint, request/response shapes, role authorization and backend-controlled pricing.
- [x] Locate actual webhook route/path, HTTP method, middleware order, body parsing, signature verification and handled event types.
- [x] Inspect idempotent webhook logic and Prisma payment/booking status updates; live behavior remains unverified.
- [x] Locate payment-status/booking read endpoint for return pages; note if one is missing.
- [x] Document source-confirmed endpoints and relevant frontend use in `API_INTEGRATION.md`.
- [x] Determine source-level changes needed for frontend returns; runtime verification is still required.

The backend depends on `stripe` 23.0.0 (`package.json`). `src/config/index.ts` reads `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRODUCT_PRICE_ID`, `SERVER_URL`, `APP_URL`, and `PORT`. `src/lib/stripe.ts` creates the Stripe client. No default port is declared in `src/server.ts`; the actual local port must be read from the running environment, without recording secret values.

`POST /api/payments/create` is customer-only (`src/modules/payment/payment.route.ts`). It accepts a booking UUID and optional provider, defaults to Stripe, checks customer ownership and `ACCEPTED` status, and uses the persisted booking price (`payment.service.ts`). It returns `paymentId` and `checkoutUrl`. Stripe Checkout is created by `src/modules/payment/providers/stripe/stripe.provider.ts` in BDT, with booking/payment metadata and backend return URLs.

`POST /api/payments/webhook` is mounted in `src/app.ts` **before** `express.json()`. The route applies `express.raw({ type: "application/json" })`, then `stripe.controller.ts` requires a `stripe-signature` header and Buffer body. `stripe.webhook.ts` verifies through `stripe.webhooks.constructEvent` using `STRIPE_WEBHOOK_SECRET`. It handles `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `refund.updated`, and `refund.failed`. `payment.service.ts` checks matching booking/payment/session/amount/currency, conditionally moves pending payment and accepted booking to completed/paid in one transaction, and returns the existing result on a matching duplicate completed event. Closed sessions conditionally update only pending records. Refund handling has explicit status guards and a provider idempotency key. These are code observations; duplicate delivery and signature verification still need runtime tests.

`GET /api/payments/:id` and `GET /api/bookings/:id` are customer-owned reads for reconciliation. A local, unpushed backend edit now points Checkout success/cancel URLs to frontend `/payment/success` and `/payment/cancel`, carrying non-secret payment/booking IDs (`stripe.provider.ts`). Frontend return pages read the payment through authenticated backend reads; they do not set paid status. The edit typechecks but no Checkout was created after it, so runtime behavior is unverified. The existing plain-text `/api/payments/return/*` routes remain mounted but are no longer used by newly created sessions.

The local backend `.env` has `PORT=8001` and nonempty `DATABASE_URL`, `STRIPE_SECRET_KEY`, and admin seed variable values. `APP_URL` and `STRIPE_WEBHOOK_SECRET` are empty; no value was read or recorded. The frontend local URL can be supplied as a process-only `APP_URL` override during tests. A real local webhook listener secret must be obtained before signed event delivery; the Stripe CLI was not found on the command path. The user authorized the backend's configured Prisma Postgres and Stripe account for integration testing, requested admin test credentials in backend `.env` only, and plans Vercel deployment after local completion.

## Frontend integration

1. Only after technician acceptance (when backend business rules permit), initiate payment using the **existing** verified Express route.
2. Follow the Checkout URL/session mechanism returned by the backend. Do not create Stripe Sessions or calculate trusted prices in the browser.
3. Render `/payment/success` and `/payment/cancel`. Do **not** mark a booking paid solely from a query string or redirect URL; fetch real payment status from the Express backend. Show pending reconciliation where appropriate.
4. Provide clear pending action, structured failure feedback, and Stripe test-mode verification. Keep server API keys and signing secrets completely out of frontend JS and `NEXT_PUBLIC_` variables.

## Local webhook signing secret

First determine the actual backend port and Stripe webhook path from source. For example, after logging into Stripe CLI, in a separate terminal run:

```bash
stripe login
stripe listen --forward-to http://localhost:<BACKEND_PORT>/<VERIFIED_WEBHOOK_PATH>
```

Replace both placeholders using **verified** Express configuration; the above is not a discovered route. Stripe CLI prints a **listener-specific** `whsec_...` secret. Place it only into the backend's local ignored environment configuration under the **actual variable name expected by the server**. It can change when the listener/session/configuration changes; do not assume the previous value still applies.

## Hosted backend webhook signing secret

If the backend is deployed, register/verify the **real public HTTPS webhook URL** under the correct Stripe test-mode account or sandbox using Stripe Dashboard/Workbench. Obtain the signing secret for **that specific endpoint**, then set it in the backend hosting provider's secret/environment settings. The Dashboard endpoint's signing secret is not interchangeable with a Stripe CLI listener secret. Rotate only when needed; handle any old/new secret overlap according to the provider's rotation process. Never publish the value.

## Validation and end-to-end acceptance

- [ ] Valid test Checkout Session created for a server-authorized accepted booking.
- [ ] Stripe test payment completes via real Checkout, not a mock success page.
- [ ] Express webhook validates the signature and writes a durable status transition to Prisma.
- [ ] Duplicate/retried events cannot double-charge or double-apply side effects.
- [ ] The frontend success page reads confirmed state; cancel/failure paths do not set paid state.
- [ ] Booking and payment history display real persisted records.
- [ ] No secrets occur in frontend code, Git, documentation or logs.
- [ ] Final Stripe configuration and test results are logged in `PROGRESS.md` **without secret values**.

**Do not** reimplement the checkout/webhook if the backend code already passes these tests. If test-mode environment or webhook configuration is absent, mark the gate blocked and document exactly what is needed from the user; do not fabricate a passing transaction.

Official references: https://docs.stripe.com/webhooks and https://docs.stripe.com/cli/listen
