# Codex goal — complete FixItNow frontend

Build, integrate, test, document, and deliver the complete FixItNow Next.js frontend on top of the existing Express + Prisma 7 + Prisma Postgres backend. Fix backend gaps where truly necessary, while publishing only the frontend repository to GitHub.

## The user's exact priorities

1. Emulate the read-only reference frontend's file organization, naming, syntax, component/API patterns, and straightforward readable code; generate no comments in application code.
2. Preserve the already installed shadcn preset without theme replacement; **use Zod for every frontend form, with all new form schemas centrally under the frontend `validations/` directory as specified in `FORM_VALIDATION.md`**; use Axios for the verified API patterns, avoid unnecessary dependencies, and use compact, professional UI without decorative emoji or colorful icons.
3. Provide consistent responsive role-aware layouts, reusable common controls, component-shaped skeletons, pending buttons, confirmed-action shadcn-compatible Sonner toasts, accessible error/empty states, restrained animations, and proper Next.js engineering practices.
4. Deliver complete public, customer, technician, and admin flows from `ASSIGNMENT.md`, not just static pages. Integrate the **existing backend Stripe implementation**, verify its end-to-end payment flow, and do not build a second gateway or fake payment UI.
5. Coordinate necessary Express/Prisma changes safely. Preserve role permissions, slot integrity and authoritative payment processing.
6. Maintain `PROGRESS.md` after every verified atomic task and at every milestone, with an exact checklist-based percent and a restart handoff.
7. Make at least 20 meaningful frontend commits across development and push the **frontend only** after verified segments to the configured remote/branch.

## Definition of done

- All **five agent-owned mandatory requirements** listed in `ASSIGNMENT.md` have verifiable evidence. The **sixth mandatory requirement is a video**, prepared and submitted separately by the user; record its status explicitly without treating it as coding work.
- End-to-end customer flow works: browse -> book available slot -> technician accepts -> real **Stripe** test checkout -> webhook-driven payment verified -> technician begins/completes -> customer reviews.
- Technician and admin flows work with server-enforced authorization.
- App remains faithful to the reference code style and installed shadcn preset. Every form has centralized Zod validation, accessible field-level errors, and recorded success/invalid/API-failure tests.
- No outstanding critical errors or missing loading/error states; verified responsive and accessible.
- Repo lint, types, tests and production build pass; frontend is deployed and tested against an accessible backend.
- `API_INTEGRATION.md` is complete; 20+ genuine frontend commits can be counted; frontend Git remote contains checked-in work; admin tester access is supplied securely outside the public repository.
- `PROGRESS.md` shows 100% only after evidence is captured.

## Non-goals

- Rewriting the backend wholesale; rebuilding Stripe from scratch when the existing implementation works; adding SSLCommerz; adopting a new frontend architecture or UI system; changing theme presets; copying reference code unrelated to this project; deploying backend without permission; pushing backend repository; creating mock-payment success as a substitute for Stripe confirmation.

## Manual submission item (excluded from Codex development percentage)

- [ ] User records and submits the required assignment video.

The agent must not claim the overall assignment submission is complete until the user confirms this manual item. The coding implementation can still be marked 100% when all weighted coding tasks and validation are verified.
