# FixItNow Frontend — Task List

## Objective
Fix and improve the existing FixItNow project while preserving the complete workflow and user journey defined in `/REQUIREMENTS.md`. Update the UI and functionality listed below. The existing frontend, backend, database schema, and Prisma models may be changed as needed to support those requirements.

## Source of truth and references
- **Functional workflow:** `/REQUIREMENTS.md`. Read it before making changes; preserve its business rules and journeys for customers, technicians, and admins.
- **Services page UI reference:** `D:\AhmadZubayer\Dev\level-2\Assignments\Assignment-5-NextJS\fixitnow-frontend\ui_references\services-ui-ref.png`
- **Technician profile UI reference:** `D:\AhmadZubayer\Dev\level-2\Assignments\Assignment-5-NextJS\fixitnow-frontend\ui_references\technician-profile-page-ui-ref.jpg`
- **Authentication background image:** `D:\AhmadZubayer\Dev\level-2\Assignments\Assignment-5-NextJS\fixitnow-frontend\public\register-bg.png`
- **README writing reference:** `D:\AhmadZubayer\Dev\level-2\Assignments\Assignment-5-NextJS\FixItNow-backend-server\README.md`

> Treat `/REQUIREMENTS.md` as authoritative for functionality. Use the reference images for visual layout, while applying the explicitly stated global styles. If a reference and a written requirement conflict, preserve the workflow and follow the written UI requirement. Verify the actual routes and project structure before editing.

## 1. Project review and workflow protection
- [x] Read `/REQUIREMENTS.md` and understand the current customer, technician, and admin journeys.
- [x] Review the frontend routes, components, authentication, API calls, backend endpoints, Prisma schema, and existing tests.
- [x] Inspect the supplied UI reference images and the existing backend README.
- [x] Identify differences between the current implementation and the required journeys and UI.
- [x] Fix required frontend/backend/API/Prisma issues without changing the intended workflow.
- [x] Preserve role permissions, data relationships, and existing working features throughout the updates.

## 2. Coding standards
- [x] Use **arrow functions only** for new or modified function definitions throughout the project; refactor existing functions where necessary for consistency.
- [x] Keep implementations simple, readable, and easy to maintain; avoid unnecessarily complex code and abstractions.
- [x] Follow existing TypeScript/Next.js conventions and reuse shared components wherever practical.
- [x] Use **shadcn/ui components** in place of plain native controls wherever shadcn equivalents exist (especially dropdowns, inputs, selects, buttons, cards, tabs, and pagination). Keep underlying semantic HTML where required for accessibility and component structure.
- [x] Ensure responsive layouts, efficient data fetching, and fast interactions on desktop and mobile.
- [x] Add sensible loading states, skeletons, and error/empty states; avoid distracting or unnecessary spinners.

## 3. Global UI and layout
- [x] Set the fill/background of **every card** across the project to `#EFEFEF`, including dashboard cards and nested cards, while maintaining readable contrast.
- [x] Add a simple shared **footer** with background `#EFEFEF` and display it on **every page**.
- [x] Display **breadcrumbs on every page**, including the services listing, individual technician profiles, individual service pages, auth pages, and all dashboard views. Make ancestor links functional.
- [x] Make **all back buttons** use text/icon color `#9AE600` with **no fill/background color**. Ensure back navigation behaves correctly.
- [x] Keep page backgrounds visually distinct from `#EFEFEF` cards, especially on `/services`.
- [x] Apply consistent responsive spacing, typography, hover/focus states, and accessible interaction patterns.
- [x] Use shared layout and styling solutions rather than repeating page-by-page implementations.

## 4. Navigation bar
- [x] Make the global navbar **sticky**.
- [x] Give the navbar a translucent **acrylic/glass** appearance (subtle blur and transparency) without compromising readability.
- [x] Keep the existing logo unchanged on the **left**.
- [x] In the **center**, show `Services & Technicians` linking to `/services`.
- [x] In the **center**, show `Dashboard` **only when authenticated**; link it to the correct role-based route:
  - Customer → `/dashboard/customer`
  - Technician → `/dashboard/technician`
  - Admin → `/dashboard/admin`
- [x] On the **right**, show the authenticated user's **full name**. Clicking it opens a shadcn dropdown containing a **Log out** action.
- [x] When signed out, keep the existing **Sign in** button and behavior.
- [x] Ensure auth state, role routing, mobile navigation, and log-out behavior update correctly without stale UI.

## 5. Login and sign-up pages
- [x] Wrap the authentication forms in the default **shadcn Card** instead of displaying them directly on a plain white background.
- [x] Use `public/register-bg.png` as a **full-screen background** on **both login and sign-up pages** (use the existing public asset rather than a machine-specific path in runtime code).
- [x] Add an **eye icon** toggle to each password input to show/hide the password while preserving accessibility and form behavior.
- [x] Keep existing authentication, form validation, error messaging, and redirects working.
- [x] Ensure both pages are responsive and the form remains readable against the background image.
- [x] Include breadcrumbs on these pages as required globally.

## 6. Services listing — `/services`
### Layout and visual fidelity
- [x] Recreate the layout and styling shown in `ui_references/services-ui-ref.png` while applying the global UI requirements.
- [x] Add the standard back button (text/icon `#9AE600`, no fill) and functioning breadcrumbs.
- [x] Clearly distinguish the white page background from `#EFEFEF` service/technician cards.
- [x] Add a **black border effect on hover** for both service cards and technician cards.
- [x] Make the page responsive and visually consistent with the reference.

### Search, filters, sorting, and data
- [x] Connect the search field to the backend: when the user types a query and presses **Enter**, send it as an API query and refresh the results.
- [x] When any sort option is selected, send the relevant query parameters to the backend and update the results automatically; no extra submit button should be required.
- [x] When a service card is selected, filter the displayed technicians to that service automatically.
- [x] Ensure every filter/sort control updates the displayed results as soon as its selection changes.
- [x] Keep search, selected service, sorting, and pagination consistent when combined; reset to page 1 when a filter/search changes.
- [x] Add appropriate skeletons/loading states, no-results messaging, and error handling; prevent outdated responses from replacing newer search results.
- [x] Update backend endpoints/query handling if needed to make searching, filtering, and sorting actually work.

### Pagination
- [x] Use the default **shadcn Pagination** components.
- [x] Display **no more than 9 technician cards per page**.
- [x] Implement functional page navigation backed by the correct paginated data and total-page information.
- [x] Place pagination **under the technician cards**, with the shared footer appearing below the page content.

## 7. Technician profile — `/technicians/[id]`
- [x] Verify the actual technician detail route, and use `/technicians/[id]` as the intended page.
- [x] Show functional breadcrumbs above the profile content.
- [x] Match the layout and presentation in `ui_references/technician-profile-page-ui-ref.jpg` **beneath the breadcrumbs**.
- [x] Implement the interactions and information shown in the reference, using actual technician data and respecting the `/REQUIREMENTS.md` workflow.
- [x] Preserve required customer-to-technician actions and permissions from `/REQUIREMENTS.md` (do not invent new business flows).
- [x] Handle loading, missing/invalid technician IDs, and API errors gracefully.
- [x] Apply global card styling, back-button styling, responsiveness, and footer.

## 8. Dashboards — customer, technician, and admin
- [x] Update `/dashboard/customer`, `/dashboard/technician`, and `/dashboard/admin` with a consistent page structure.
- [x] Directly under the shared navbar, render **shadcn Tabs** for dashboard navigation.
- [x] Show only the tab labels/options appropriate to the authenticated user's role; build the tabs dynamically from the role.
- [x] Style the **selected tab** with `#9AE600` while preserving readable contrast and obvious active state.
- [x] Place breadcrumbs **between the tab bar and the main content card**.
- [x] Render the selected tab's content inside a **main shadcn Card** below the breadcrumbs.
- [x] Keep all tables, child cards, and related content **inside that main card**.
- [x] Ensure each tab renders its correct data and functions; changing tabs updates the content.
- [x] Enforce role-based page access and preserve dashboard workflows described in `/REQUIREMENTS.md`.
- [ ] Apply global `#EFEFEF` card styling, skeletons/loading states, responsive layouts, and shared footer.

## 9. Backend, database, and integration changes (as needed)
- [ ] Adjust backend routes/controllers/services to meet the documented journeys and UI data requirements.
- [ ] Update Prisma models/schema and migrations **only when needed**, preserving data integrity and existing relationships.
- [ ] Update API request/response contracts, validation, filtering, sorting, pagination, and role checks where required.
- [ ] Keep frontend and backend behavior synchronized; verify authentication/session handling and role-based routing end to end.
- [ ] Avoid unrelated refactoring or breaking changes.

## 10. Frontend `README.md`
- [ ] Create or update a **simple, professional, formal** `README.md` for this frontend project.
- [ ] Use clear, natural, non-complex language and a similar level of detail/tone to `FixItNow-backend-server/README.md`; do not copy backend-specific instructions that do not apply.
- [ ] Explain the project purpose, key features, prerequisites, setup, environment configuration (variable names only; no secrets), development commands, and relevant frontend routes.
- [ ] Include the technician profile page (`/technicians/[id]`) in the route/feature overview.
- [ ] Ensure all documentation matches the actual implementation and package scripts.

## 11. Validation and completion
- [ ] Check that customer, technician, and admin journeys still match `/REQUIREMENTS.md`.
- [ ] Verify navbar behavior for both signed-in and signed-out users and for all three roles.
- [ ] Verify login/sign-up layout, password visibility toggle, and auth redirects.
- [ ] Verify `/services` search on Enter, sort-change fetching, service filtering, combined filters, hover states, and **9-per-page** pagination.
- [ ] Verify technician profile layout and functions against the screenshot and requirements.
- [ ] Verify all dashboard tabs, role restrictions, breadcrumbs, cards, and data display.
- [ ] Verify breadcrumbs, back-button colors, footer, card backgrounds, and responsive layout across **every route**.
- [ ] Run available lint, type checks, builds, and relevant tests; address regressions introduced by the work.
- [ ] Mark each finished task `[x]` only after validating it. Report any blocked items, assumptions, migrations, or remaining issues.

## Execution notes for Codex
1. Read `/REQUIREMENTS.md` and inspect the reference files **first**.
2. Work in dependency order: shared foundations → auth/navbar → services → technician profile → dashboards → backend/data fixes as needed → README → final verification. Backend fixes can be done alongside the related UI tasks.
3. Make focused changes and verify each section before marking its tasks complete.
4. If a change requires a substantial migration or architectural redesign, document a short implementation plan before applying it.
5. Do not consider a visual task complete unless its function also works and the original required journey is preserved.
