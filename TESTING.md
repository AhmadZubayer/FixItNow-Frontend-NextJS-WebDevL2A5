# Verification contract

Do not assert any check passed until you run it and record actual output summary in `PROGRESS.md`. Use the package manager and scripts present in each repository; don't assume `npm run typecheck` exists.

## Baseline commands to discover

- Frontend: inspect `package.json`, then run applicable lint, TypeScript typecheck (`tsc --noEmit` when appropriate), unit/integration tests, and production build.
- Backend: inspect Express scripts; run safe tests / types / lint; verify Prisma 7 generated client and schema compatibility without resetting a shared database.
- Browser: smoke-test all roles, at mobile and desktop sizes, against the actual API and non-production payment provider.

## Mandatory Zod validation verification for all forms

- Enumerate all actual forms and their central schema file paths under the selected frontend `validations/` directory. Update the matrix in `PROGRESS.md` whenever forms are added or changed.
- For each form test required, malformed, invalid, and boundary values, plus cross-field constraints (e.g. start before end, confirm password if applicable), and the valid path. Check rendered inline messages and accessible invalid states.
- Verify numeric/time/role inputs are normalized intentionally and agree with server constraints. Confirm backend still rejects invalid, unauthorized, or tampered payloads.
- Confirm users cannot double-submit; mutation buttons show loading until the actual API result; Axios failures map to structured feedback and do not clear values unexpectedly.
- Record the exact test or reproducible manual verification steps and result in `PROGRESS.md`. No passing claim without evidence. No form feature is done until these checks pass.

## Required flow scenarios

- Registration and login: valid, invalid, duplicate, blocked/banned, expired session, role routing, direct unauthorized URL, API access forbidden to other roles.
- Discovery: filters and search, no results, pagination if needed, unavailable API, slow network, mobile table/sidebar layout.
- Booking: live slot availability, repeated-click prevention, concurrent selection rejection, duplicate request, cancellation allowed only in eligible state, blocked times, timezone correctness.
- Technician: edit profile/availability, accept/decline/start/complete statuses, reject illegal transitions, disallow unauthorized updates.
- Stripe payment: first verify existing backend checkout/session and signed webhook handling; accepted booking only; Stripe test checkout success/cancel/failure; duplicate/out-of-order webhook delivery and idempotency; backend-verified state after return; correct signing secret for local vs deployed endpoint; failure to reach Stripe; no trust in success query string alone. Do not log secrets.
- Reviews: only authorized completed booking reviewers, no double submission where business rules prohibit it.
- Admin: dashboard, search/page/ban/unban, categories, forbidden customer/technician actions, visible error feedback.
- UI: centralized Zod validation and field errors for every form; shadcn preset visual fidelity; loading skeleton, pending buttons, error/empty boundary, responsive layouts, keyboard focus, reduced motion, accessible labels, route metadata, image performance.

## Release gate evidence

- Lint: exact command/result/date.
- Types: exact command/result/date.
- Unit/integration: exact command/result/date.
- Frontend production build: exact command/result/date.
- Backend tests affected by changes: exact command/result/date.
- Real Stripe test-mode Checkout transaction: session outcome, signed webhook receipt, and backend-verification evidence without secrets.
- Hosted frontend+backend smoke test: URL, date, roles checked, no sensitive tokens.
- 20+ meaningful frontend commits: `git log` evidence and final SHA/branch, **only frontend remote pushed**.
