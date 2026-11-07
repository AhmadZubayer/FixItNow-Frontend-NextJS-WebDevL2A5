# Mandatory Zod form-validation contract

Status: **policy defined; actual Next.js and reference repositories not yet inspected**.

This document applies to **every FixItNow frontend form** implemented for the assignment, not only authentication. It is a development completion gate alongside `TESTING.md` and `PROGRESS.md`. Do not mark a form feature complete without a corresponding schema and successful invalid/valid form testing.

## Directory and file placement

Create exactly one central validation directory **inside the existing frontend application**:

- If the real project uses `src/`, create `src/validations/`.
- Otherwise create `validations/` at the frontend repository root.
- Do not create both. Inspect the actual project and reference project first, then use the existing repository's filename/casing conventions where compatible with the required centralized directory.
- Place all new frontend form Zod schemas and shared validation helpers inside this directory. Do not scatter new form schemas across page files, components, `lib/`, or API modules.
- Group by domain instead of one large schema file per application. Example candidates (not an instruction to create unused files): `auth.schema.ts`, `booking.schema.ts`, `technician.schema.ts`, `availability.schema.ts`, `review.schema.ts`, `category.schema.ts`, `search.schema.ts`.
- If the reference uses `*.validation.ts`, prefer that basename convention while keeping schemas centralized in `validations/`.
- Keep helper files in the same folder only when they are specifically needed by schemas; do not add a generic validation framework, multiple re-export layers, or unused placeholders.

## Mandatory rules for every form

1. Define a Zod object schema for **each form variant** (create/edit forms may share or derive a schema when equivalent). Include required fields, constraints, useful error messages and cross-field checks where genuinely necessary.
2. Infer the form's TypeScript values from its schema using the installed Zod version; avoid a second, manually duplicated form-data interface unless dictated by an external API contract.
3. Integrate schema validation with the actual form approach observed in the reference project. If React Hook Form and its Zod resolver are already installed, use them consistently; add them only if genuinely needed and compatible with the existing setup. Otherwise use Zod's `safeParse` with straightforward form state. Do not add a form abstraction framework just to satisfy this rule.
4. Validate before any Axios write request. Normalize values deliberately (e.g., trim text, parse prices/numbers, dates and IDs) so the submission shape agrees with the verified backend contract. Do not silently coerce invalid values into valid ones.
5. Show specific **inline accessible field errors** using installed shadcn primitives and appropriate invalid/description attributes. Preserve typed values when validation or API calls fail. Use Sonner for action-level API results, not as a replacement for inline errors.
6. Keep submit controls disabled/pending while the request is active; prevent duplicate submissions. Success toasts and redirects only happen after a confirmed backend result.
7. Validate API boundary and role/ownership rules **again on the Express backend**. Frontend Zod is UX, not a security boundary. Preserve existing backend validation conventions where applicable, or make safe necessary changes; never trust client-supplied price, status, payment success, or ownership.
8. Test a valid submission, all important invalid inputs, boundary cases, server-side failures, and pending/double-click behavior for each form. Record schema path and actual test evidence in `PROGRESS.md` and update `API_INTEGRATION.md` where there is a relevant endpoint.
9. For date/time forms validate scheduling windows and timezone representation against backend rules. For uploads validate permissible file types/sizes at the client where suitable and again on the backend. Treat gateway-hosted card forms as gateway-owned; never store or validate raw payment card data yourself.
10. If a field or form does not exist in the finished feature, do not create speculative schemas for it. If new forms are introduced, add them to the inventory below **before** marking the milestone complete.

## Expected form/schema inventory (audit and adjust to actual routes)

| Form / input surface | Candidate schema | Milestone | Must verify |
|---|---|---|---|
| Registration with customer/technician role selection | auth | M2 | Valid role, email, password, backend rejection |
| Login | auth | M2 | Email/password, invalid auth, pending state |
| Service/technician search and filter inputs | search | M3 | Search text, filter values, numeric price/rating ranges, safe URL query parsing |
| Booking request with service, technician and time slot | booking | M4 | Required selection, valid date/time, blocked/expired slot, server confirmation |
| Technician profile and service/pricing create/edit | technician | M6 | Required fields, numeric prices, skills, optional upload handling |
| Availability/working-hours/blocked-slot editor | availability | M6 | Start/end order, overlaps, valid weekdays, timezone and server slot integrity |
| Customer review after completed job | review | M5 | Rating bounds, text constraints, eligibility and server rejection |
| Admin category create/edit | category | M7 | Required name and uniqueness error from API |
| Any added user/settings/management input forms | by domain | relevant | Audit every newly introduced form, including edit dialogs and inline table editors |

### Form completion gate

For every implemented form, require all four pieces of evidence:

- [ ] Central Zod schema exists and matches verified backend constraints.
- [ ] UI consumes the schema and shows accessible inline field errors.
- [ ] Successful and rejected submissions are handled with pending controls and correct feedback.
- [ ] Valid/invalid/boundary/error tests were run or manually verified and recorded with exact outcomes.

**Do not check this generic list globally.** In `PROGRESS.md`, use the per-form table and its file/test evidence; a form is complete only when its own four conditions pass. The original assignment does not prescribe schema filenames; filenames above are illustrative until the reference style audit determines naming.

## Existing dependencies are intentional

The user confirms Zod and Axios are already installed in the frontend; inspect actual versions before installing anything. **Stripe-hosted Checkout is not a frontend card-entry form**: do not collect or Zod-validate payment card number, expiry or CVC. Validate the local booking/payment initiation inputs and backend response contracts as appropriate, while Stripe handles card collection and the Express server verifies payment state.
