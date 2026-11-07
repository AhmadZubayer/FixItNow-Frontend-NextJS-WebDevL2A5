# FixItNow implementation plan

The weights below total 100 points and align with `PROGRESS.md`. A milestone's acceptance evidence must be recorded before it is considered complete. Work dependencies may change after the initial repository audit; update plan and progress together if scope changes, keeping total points 100.

| Milestone | Weight | Gate |
|---|---:|---|
| M0. Repository discovery and baseline | 8 | Reference style evidenced; backend API inventory; existing setup verified |
| M1. Design foundation and reusable UI | 10 | shadcn fidelity, shared layouts, skeletons, toasts, empty/error UI |
| M2. Authentication and role access | 12 | register/login, session lifecycle, route guards, server RBAC |
| M3. Public discovery | 12 | responsive home, search/filter, detail, real API data |
| M4. Customer booking | 16 | availability and collision-safe booking, history, cancellation |
| M5. Payment and reviews | 14 | reuse existing Stripe backend integration; verify webhook and backend reconciliation |
| M6. Technician workspace | 12 | profiles, schedule, job actions, earned metrics |
| M7. Admin workspace | 9 | overview, user management, categories, role-guarded mutations |
| M8. Final release quality | 7 | real E2E checks, docs, deployed frontend, admin test access, >=20 commits |

## Sequence and acceptance criteria

### M0: Audit before implementation

Read actual frontend version/scripts/preset and reference code, including current form schema patterns and whether the frontend uses a `src/` directory. Inspect Express routes, auth, Prisma schema, **existing Stripe integration/webhook**, payment state and intended deployment. Update `PROJECT_CONTEXT.md`, `REFERENCE_STYLE.md`, `ARCHITECTURE.md`, and `API_INTEGRATION.md`. Identify blockers without inventing endpoints. Audit the actual current Git state and remote.

### M1: UI foundation

Preserve current installed shadcn preset. Implement only truly reusable controls consistent with the reference: responsive app shells/navigation, breadcrumbs, search, pending buttons, skeleton and error/empty patterns, and Sonner. Ensure compact spacing, keyboard accessibility and motion preferences. Demonstrate components in real pages rather than a detached gallery.

### M2: Authentication and roles

Implement registration with role selection and login; **centralized Zod validation per `FORM_VALIDATION.md`**; secure session handling; customer/technician/admin navigation; access checks/redirects appropriate to installed Next.js version; backend role/ownership enforcement. Verify invalid auth and role boundary cases.

### M3: Public pages

Implement home, `/services` searchable/filterable responsive grid with Zod-validated filters/query input, `/technicians/[id]` profile, rating/review display, and available time-slot presentation driven by real backend data. Avoid fake featured services or hardcoded reviews in accepted tasks.

### M4: Booking flow

Implement Zod-validated service + technician + slot selection and request creation, booking/status listing, eligible cancellation, server validation of slot clashes/status transitions, and consistent loading/feedback. Exercise the customer and technician sides together.

### M5: Payment and reviews

Stripe is already implemented in the backend according to the user. **Audit and reuse** its existing Checkout/session and webhook implementation first, and change only gaps revealed by integration or tests. Implement frontend checkout redirection, success/cancel routes that retrieve backend-confirmed state, payment history, and review eligibility. Use Stripe **test mode** for real end-to-end verification. During final setup verify the signing secret for the **actual** local/deployed webhook endpoint; regenerate/retrieve it only if needed and configure it in the backend environment, never in the frontend. Follow `STRIPE_INTEGRATION.md`. No fake payment acknowledgment.

### M6: Technician

Implement Zod-validated profile/services/pricing edit, availability with blocked times and slot integrity, bookings with accept/decline/start/complete, and real aggregate dashboard data. Test transitions and authorization.

### M7: Admin

Implement role-protected overview stats, user list with validated search/page/ban/unban input where forms exist, and Zod-validated categories CRUD supported by backend. Verify unauthorized requests rejected server-side.

### M8: Release

Run configured lint/typecheck/unit/integration/build checks; perform role-based browser/manual E2E and responsive checks, fix critical issues, complete API map, deployment and config docs, securely provision test admin access, verify minimum 20 meaningful frontend commits, and push final verified frontend. Close out `PROGRESS.md` only if gates are met.

## Commit cadence

Make coherent verified commits for features and fixes throughout M1–M8. Target 20 or more **meaningful frontend commits**, never padding history with no-op commits. At each completed milestone, push only if the frontend remote, branch, clean diff, and credentials are confirmed and authorized. Record commit SHA/push evidence in `PROGRESS.md`.

## Submission separation

The user clarified that the assignment's sixth mandatory requirement is a video they will handle personally. **The 100-point milestone plan measures Codex development work only.** Record the video in `PROGRESS.md` as a separate manual submission gate. Do not generate a fake video or claim the video has been completed.

## Mandatory per-form acceptance gate (all milestones)

No form-related weighted task in `PROGRESS.md` may be checked until the relevant entry in `PROGRESS.md`'s Form verification matrix is marked verified. At minimum this requires a central Zod schema, form integration, accessible inline errors, working pending/confirm/error feedback, and tested valid/invalid/boundary/API-failure cases. Use the inventory and directory rule in `FORM_VALIDATION.md`. This gate applies to new forms added after the initial assignment audit; keep the inventory current.
