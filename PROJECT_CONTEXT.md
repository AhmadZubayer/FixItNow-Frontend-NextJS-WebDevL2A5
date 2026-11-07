# Project context — provided paths; verify on Codex machine before implementation

> Never record secrets, passwords, private keys, token values, or database URLs containing credentials.

| Field | Value |
|---|---|
| Frontend repository absolute path | `D:\AhmadZubayer\Dev\level-2\Assignments\Assignment-5-NextJS\fixitnow-frontend` |
| Express / Prisma 7 backend absolute path | `D:\AhmadZubayer\Dev\level-2\Assignments\Assignment-5-NextJS\FixItNow-backend-server` |
| Read-only reference frontend path | `D:\AhmadZubayer\Dev\level-2\Assignments\Assignment-5-NextJS\reference-project` |
| Frontend Git remote | `origin`: `https://github.com/AhmadZubayer/FixItNow-Frontend-NextJS-WebDevL2A5.git`; `main` pushed after verified local closeout on 2026-11-08; exact SHA is tracked in `PROGRESS.md` |
| Permitted frontend branch | `main` tracks `origin/main`; no other branch authorization inferred |
| Frontend package manager | npm (`package-lock.json`) |
| Installed Next.js version | `16.4.5` |
| Installed shadcn preset | `base-mira`, `mist` base color, CSS variables in `app/globals.css` |
| Payment gateway | **Stripe only**; user reports backend Stripe integration already configured. Verify without reimplementing. |
| Frontend deploy target | Vercel via the frontend GitHub repository; user explicitly deferred all deployment work on 2026-11-08 until a later phase |
| Backend API base URL(s) | Deployed `https://ph-l2-a4-fix-it-now-banckend-server-tau.vercel.app` returns 200 for `/api/categories`; local `SERVER_URL` is localhost and `PORT` is 8001. The deployed backend is behind the local source: owner technician profile route returned 404 on 2026-11-08. |
| Auth/session transport | Express accepts `accessToken` cookie or Bearer token; login returns access and refresh JWTs in JSON |
| Preview/test account provisioning | User requested admin test credentials remain only in the backend `.env` for now; never commit or print values |
| Video submission (sixth assignment requirement) | **User will record and submit manually; outside Codex scope** |

## Operating mode

- Frontend repository is the only repo permitted for **GitHub pushes** under this goal. Use frontend commits for the assignment’s 20 meaningful-commit criterion. Local backend commits, if appropriate and safe, may preserve necessary backend changes but must never be pushed under this goal.
- Backend is an editable integration dependency; inspect its own instructions first. Do not alter Prisma schema or run migrations against shared/production databases without an explicit safe migration plan and permission.
- Reference project is **read-only**. Never add, modify, reformat, or commit reference-project files.
- Missing paths are real blockers to code implementation that depends on them; document precisely in `PROGRESS.md`.
- Never copy proprietary code from a reference you do not have rights to use; emulate conventions and local coding patterns where permitted.

## Local access is required

These are **user-provided Windows paths**, not repositories inspected by this chat. Codex must resolve and check all three paths before auditing or editing. If Codex runs in WSL, the drives may instead be mounted as `/mnt/d/AhmadZubayer/Dev/level-2/Assignments/Assignment-5-NextJS/...`; verify rather than assume this mapping. A cloud-hosted Codex task cannot automatically read `D:\...` from the user's machine. For cloud tasks, supply the repositories through an accessible workspace or other supported mechanism, and update the paths accordingly.

Use the frontend project as the working directory. Grant read/write access to the backend only if backend changes are necessary. Treat the reference project as read-only. Confirm all Git repository roots and remotes independently before committing or pushing. If any path cannot be accessed, report that specific blocker instead of fabricating an audit.

## Existing Stripe implementation

The user confirms Stripe is already configured on the Express server; **do not scaffold a replacement or add SSLCommerz**. Audit checkout route, webhook handler, Stripe API configuration, and backend environment variable **names only**. The local Stripe CLI listener signing secret and any registered deployment endpoint secret must match their respective receivers. During final integration, rotate/retrieve a secret only if a change in listener or endpoint requires it; never copy secret values into Markdown or frontend files. Follow `STRIPE_INTEGRATION.md`.
