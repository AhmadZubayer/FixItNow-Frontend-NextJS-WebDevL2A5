# Architecture and delivery decision log

Decisions should be brief, dated, and grounded in inspected source code or user direction.

## Pending choices (do not infer without evidence)

| Decision | Available choices | Current state |
|---|---|---|
| Payment gateway | **Stripe only**, existing Express backend integration | User-confirmed; implementation not audited |
| Authentication transport | Existing backend's scheme | Not inspected |
| State/data-fetch pattern | Reference project's approach, adjusted only for correctness | Not inspected |
| Next.js routing guard convention | `middleware.ts` in older Next.js; `proxy.ts` in Next.js 16+ | Installed version not inspected |
| Deployment | Hosting provider and backend URL | Not specified |

## Recorded decisions

- Scaffold created: Keep Codex instructions concise in `AGENTS.md`, with source requirements, style audit, weighted progress and milestone plan in separate docs. Reason: persistent session recovery without bloating all prompts.
- Publication boundary: only frontend repo is permitted to be pushed under this project goal. Backend may require local changes but needs separate push approval.
- Payment integrity: frontend success URL alone is not proof of payment; Stripe-signed webhooks and backend-confirmed state required. Existing backend Stripe integration should be reused and verified before edits.

- Form validation (user instruction): Every frontend form must use a Zod schema, centralized under `src/validations/` if the actual project uses `src/`, otherwise frontend-root `validations/`. Preserve reference form style where compatible, and validate again on the backend for trust-boundary enforcement. See `FORM_VALIDATION.md`.

- Payment scope (user clarification): SSLCommerz is out of scope. The backend already has Stripe configured; local or deployed webhook signing secret might need to be retrieved or replaced during final verification. This is a configuration task, not a request to rebuild the payment integration.
- Submission scope (user clarification): sixth mandatory requirement is a video to be completed by the user; five written mandatory criteria remain developer-owned.

- 2026-11-07 reference audit: the accessible nested reference project has no forms, Axios, Zod, tables, or shadcn components. Follow its direct App Router functions and component boundaries, while the explicit FixItNow form and visual requirements govern those absent areas. See `REFERENCE_STYLE.md`.
- 2026-11-07 version: installed Next.js is 16.4.5, so any route redirect check uses `proxy.ts` rather than assignment-suggested middleware. Express still enforces role and ownership.
- 2026-11-07 Stripe: backend Checkout currently returns to plain-text backend pages. A later minimal redirect change is needed for frontend success/cancel screens; the webhook remains the payment authority.
- 2026-11-07 session transport: same-origin Next route handlers receive login/register calls and store backend JWTs in HTTP-only, SameSite cookies. Browser code does not receive refresh tokens. `proxy.ts` checks session-cookie presence for dashboard routes; Express remains the role and ownership authority. Valid role flows still require testing.
- 2026-11-07 lint gate: installed `components/ui/carousel.tsx` and `hooks/use-mobile.ts` had synchronous state updates inside effects rejected by the current ESLint rules. Applied logic-only hook fixes without changing the `base-mira` preset tokens or styling; full lint now passes.
