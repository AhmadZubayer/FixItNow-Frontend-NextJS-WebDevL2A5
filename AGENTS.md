# Codex instructions — FixItNow

## Mission and source of truth

Complete the agent-owned requirements in `GOAL.md` and `ASSIGNMENT.md`. The user confirms that the sixth mandatory requirement is a submission video they will handle personally; keep it as an explicitly unverified manual deliverable outside the coding-progress percentage. Follow `PLAN.md`, enforce `FORM_VALIDATION.md` for **every form**, and keep `PROGRESS.md` authoritative. First load `PROJECT_CONTEXT.md`, inspect the actual repositories, and complete `REFERENCE_STYLE.md`. Read the applicable existing instructions in each repository before editing.

Priority on conflict: security and correctness > mandatory assignment requirements > this project's explicit requirements > verified reference-project coding conventions > agent preferences. Log material conflicts in `DECISIONS.md`; escalate when a choice has real consequences.

## Reference fidelity (mandatory)

- Treat the supplied reference project as the primary *coding-style* template. Before feature implementation, inspect several representative routes, forms, API calls, reusable components, layouts, state patterns, and filenames. Write exact reference file paths and findings in `REFERENCE_STYLE.md`.
- Match its project layout, naming, imports, component style, data fetching patterns, form organization, error patterns, code brevity, and coding idioms, subject to Next.js correctness and security.
- Prefer clear, simple, readable functions and small components to frameworks, abstraction layers, custom hooks, or generic architectures that the reference does not use.
- **No comments in newly written application code** (including JSX/TS/TSX), unless a comment is legally or technically required. Project Markdown documentation may explain decisions.
- Do not modify the reference project. Do not pretend it was audited if inaccessible.

## UI and UX contract

- Preserve the installed shadcn preset exactly: inspect `components.json`, existing CSS/theme, and components; do not replace or redesign tokens or bring in a second UI library. Use its existing primitives/variants consistently.
- Professional, compact, visually consistent responsive layouts; avoid excessive gaps, oversized cards, gratuitous borders, decorative gradients, colored icons, and emojis in UI.
- The assignment requests semantic status badges; implement clear legible status distinctions within the installed design system, without colorful decorative iconography. Preserve accessible text labels.
- Build actual reused components for repeated needs (search, breadcrumbs, action/pending button, skeleton patterns, empty/error states, form fields, pagination) but do not create pointless one-off wrappers.
- For data loading use appropriately shaped skeletons/route `loading.tsx`; for mutations, disable duplicate triggers and show local button pending state until success/failure is confirmed. Show shadcn-compatible Sonner toasts on confirmed success/failure, inline Zod field errors, and route-level error boundaries where appropriate.
- Use subtle, purposeful animation with reduced-motion support. Avoid extra animation dependencies unless a demonstrated need arises.
- Match the reference project's client/server conventions while honoring the installed Next.js App Router guidance; use client components only where interactive behavior requires them.

## Form validation contract — non-negotiable

- **Every form must use Zod**. Read `FORM_VALIDATION.md` before implementing any form, including search/filter, booking, profile, availability, reviews, categories, and any edit dialog.
- Store all new frontend form schemas and schema-specific helpers in one `validations/` directory: `src/validations/` if the frontend has `src/`, otherwise `<frontend-root>/validations/`. Do not put schemas inline in pages/components or introduce duplicate validation directories. Match reference naming style within that folder.
- Prefer straightforward typed form code and the reference project's existing form patterns; only use React Hook Form / Zod resolver if installed or warranted. Show accessible field-level errors and cover numeric, date/time, role, and cross-field constraints as applicable.
- Do not mark any form's feature complete or check its `PROGRESS.md` task until the schema, UI integration, verified backend rules, and valid/invalid/failure testing are recorded in the per-form verification table. Server-side checks remain mandatory for security.

## Backend coordination and integrity

- The frontend is the primary deliverable. Use the exact paths in `PROJECT_CONTEXT.md` after verifying they are available. Inspect Express routes, validators, auth, Prisma 7 schema/migrations, status transitions, and payment integration before inventing endpoints.
- API paths in `ASSIGNMENT.md` are suggestions, **not verified working endpoints**. Update `API_INTEGRATION.md` based on code and tested requests; record proposed changes separately from confirmed changes.
- Implement the minimum necessary backend changes for required frontend behavior, with tests/verification. Do not weaken server-side role/ownership authorization, payment/webhook verification, validation, or booking concurrency checks.
- **Stripe only.** The user reports Stripe is already configured in the backend. First inspect and reuse existing backend checkout, event handling and configuration; do not install another payment provider or redesign Stripe unnecessarily. Follow `STRIPE_INTEGRATION.md`. Never assume a success URL means payment succeeded; verify state using signed Stripe webhooks and the backend-authoritative payment record.
- Do not reset databases, delete data, run production migrations, hardcode credentials, or expose secrets. Document any necessary backend commits/changes in progress handoff. Do not push backend to GitHub under this authorization.

## Milestone execution and checkpointing

- Work milestone by milestone from `PLAN.md`, in the order determined by actual dependencies; no placeholder data presented as finished integration.
- At the **start** of every session read `PROGRESS.md`, check repository status/log and tests, reconcile claimed completed tasks with real code, then continue the next actionable item.
- At the **end of each small verified task**, immediately update `PROGRESS.md`: check boxes, calculated percentage, files, tests/results, decisions, blockers, and next concrete action. Do this BEFORE starting another large item.
- Before a session ends, a usage limit is hit, or the user says 'checkpoint', stop starting work and write a complete handoff to `PROGRESS.md`. You cannot assume visibility into the user's exact ChatGPT/Codex remaining usage; do not promise automatic stopping at 95% or automatic resumption after a quota reset.
- A checkmark means implementation **and verification** are complete. Never fabricate test results or mark partial tasks done. Recompute percentage only from the explicit point values in `PROGRESS.md`.
- If interrupted unexpectedly, next session must verify Git status and the last recorded task before continuing; don't blindly trust stale percentage.

## Git protocol

- Meaningful frontend commits are required (assignment minimum: 20). Make small logical verified frontend commits with accurate messages; never split commits artificially just to hit a count. Track actual count with Git and report it in progress.
- On each completed and verified milestone, push **only** the frontend repository to the configured allowed frontend remote/branch, after checking current branch, remote, staged changes, clean diff, no secrets, and successful validations. If authorization/remote/credentials are missing, record a blocker; never invent success.
- Never run `git push --force`, destructive reset, or rewrite user history. Never stage backend files into frontend Git. **Never push backend changes** under this goal. If the backend is a Git repository and changes need durable checkpoints, local backend commits may be used only after inspecting the tree and preserving unrelated user work; record local SHAs in `PROGRESS.md`. The assignment’s required 20 meaningful commits must be in the frontend repository.

## Quality gates and final completion

- Follow `TESTING.md` using real repo commands; cover success, failure, unauthorized, empty, loading, and repeated-action cases for each feature. Run lint, typecheck, relevant tests and a production build at milestone gates where available.
- Keep `API_INTEGRATION.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `FORM_VALIDATION.md` and `PROGRESS.md` accurate when affected, including the per-form validation evidence.
- Follow the installed Next.js version. For Next.js 16+, use `proxy.ts` for routing/redirect checks instead of deprecated middleware, and enforce authorization again in the Express API.
- Do not mark **development** 100% until verified existing-backend Stripe integration, working hosted frontend, secure provision of test-admin credentials through the authorized submission route, >=20 meaningful frontend commits, required API documentation, all role flows, and final verification are satisfied. Track the separate user-owned submission video, but do not include it in the 100-point development percentage or claim the complete submission was handed in.

## Stripe configuration and release gate

- At payment-audit time, discover the **real** webhook handler path, backend port, event types and environment variable names from code; never assume a route or environment variable. Record names and file paths, **not secret values**, in `STRIPE_INTEGRATION.md`.
- The signing secret output by a local `stripe listen` session is for that listener; the deployed endpoint uses the Stripe Dashboard/Workbench endpoint's signing secret. If an endpoint is newly registered or rotated, configure its corresponding secret in the backend environment. Never put a `whsec_` secret, `sk_` key, or other server secret into the frontend, a `NEXT_PUBLIC_` variable, documentation, logs, commits or screenshots.
- Before a payment milestone is verified, demonstrate actual Stripe test checkout, valid signature verification in Express (raw request body where required), correct backend status updates, and retry/duplicate-event safety; do not call webhook verification successful without evidence.
