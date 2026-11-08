# FixItNow — Codex Agent Instructions

## Mission
Implement every applicable unchecked item in the frontend `TASKS.md`, one task at a time, until the list is complete. Fix existing behavior and make the requested UI changes without changing the customer, technician, and admin journeys defined by `REQUIREMENTS.md`.

**Do not stop after writing a plan.** Inspect the actual code, implement the tasks, validate the changes, and keep working through the list. `progress.md` is the durable handoff record for future Codex sessions.

## Project locations (Windows)

- **Frontend repository:** `D:\AhmadZubayer\Dev\level-2\Assignments\Assignment-5-NextJS\fixitnow-frontend`
- **Backend repository:** `D:\AhmadZubayer\Dev\level-2\Assignments\Assignment-5-NextJS\FixItNow-backend-server`
- **Authoritative functional requirements:** `D:\AhmadZubayer\Dev\level-2\Assignments\Assignment-5-NextJS\fixitnow-frontend\REQUIREMENTS.md`
- **Work checklist:** `D:\AhmadZubayer\Dev\level-2\Assignments\Assignment-5-NextJS\fixitnow-frontend\TASKS.md`
- **Persistent work log:** `D:\AhmadZubayer\Dev\level-2\Assignments\Assignment-5-NextJS\fixitnow-frontend\progress.md`

Keep `AGENTS.md`, `TASKS.md`, and `progress.md` in the **frontend repository root**. Use the backend repository when a task requires backend endpoints, business logic, authentication, Prisma, database migrations, or API changes. Do not assume the two repositories share a Git history or remote. If Codex is restricted to the frontend directory, request/add access to the backend workspace before attempting backend work.

## Source-of-truth priority

1. `REQUIREMENTS.md` — business flows, roles, permissions, and expected user journeys.
2. `TASKS.md` — requested fixes, UI behavior, styling, and completion checks.
3. Reference screenshots/assets specified in `TASKS.md` — visual design.
4. Existing application conventions — implementation details that do not conflict with the above.

If instructions conflict, protect the required business journey first, document the conflict in `progress.md`, and apply the closest compliant implementation. Inspect real files rather than guessing route names, APIs, schema fields, or scripts.

## Mandatory startup procedure — every new session

1. Open both project directories and inspect their current `git status`, active branches, and configured remotes. Never switch branches or change remotes silently.
2. Read this `AGENTS.md`, all of `REQUIREMENTS.md`, `TASKS.md`, and `progress.md`; check any additional repository-specific instructions that apply.
3. If `progress.md` says a commit or push is pending, reconcile that first (compare working tree, log, and remote) before choosing a new task. Never create duplicate commits blindly.
4. Find the **first unfinished task** in `TASKS.md`, unless `progress.md` identifies a partially implemented task that must be resumed first.
5. Read the relevant code and UI references. Determine whether frontend, backend, or both need changing.
6. Confirm the instructions and tests available from the actual `package.json` files; do not assume a command exists.
7. Update the "Current task" and "Resume checkpoint" fields in `progress.md` before starting changes.

## Implementation rules

- Work **one unchecked checkbox task at a time**, or a minimal tightly coupled group where separating changes would break the app; still account for each checklist item independently.
- Preserve authentication, authorization, role-specific dashboards, service/technician search and booking journeys specified in `REQUIREMENTS.md`.
- Use **arrow functions** for newly written or modified function definitions; favor clear, simple TypeScript/JavaScript over unnecessary abstractions.
- Use **shadcn/ui** components for available interactive controls, and preserve semantic HTML and accessibility.
- Honor all task-specific design and UI requirements, including `#EFEFEF` cards/footer, `#9AE600` back-button text and active dashboard tab, breadcrumbs, navbar, screenshot references, responsive design, skeletons, and pagination.
- Prefer focused edits and reusable shared components. Do not rewrite unrelated features.
- Make backend/API/Prisma changes only when needed; inspect current schema and migration history before changing them. Never reset or delete production data, run destructive migrations, or overwrite secrets.
- Keep environment values and secrets out of commits, logs, and README examples. Do not modify `.env` files or credentials unless the user specifically authorizes it.
- For complex changes, put a short implementation plan in `PLAN.md` or a linked section of `progress.md`; planning is not task completion.

## Definition of done — for EACH checkbox

A task is complete only when:

1. The implementation meets the relevant acceptance criteria from `TASKS.md` and `REQUIREMENTS.md`.
2. Relevant automated checks pass (for example lint, typecheck, tests, build); where a check cannot run, the exact reason and manual checks are recorded in `progress.md`.
3. The user-visible behavior or UI is checked when practical; do not claim screenshot fidelity, API behavior, or end-to-end validation without actually verifying it.
4. Only then change the associated checkbox in `TASKS.md` from `[ ]` to `[x]`.
5. Update `progress.md`, recalculate its top-line completion percentage, and record the work and validation evidence.
6. Commit the task's changes and **push to the already configured GitHub upstream** in every affected repository. Push the backend commit first if backend changes are required; push the frontend commit (including `TASKS.md` and `progress.md`) last.
7. Record the branch, commit hash(es), and push status. Do **not** begin the next task until the push has succeeded or a genuine blocker has been documented and addressed.

Do not mark a task complete just because code was written. If testing fails, repair the issue or leave the task unfinished and describe the blocker.

## Git and GitHub rules — mandatory after every completed task

- **Never create a new Git remote, rewrite history, force-push, or change the current branch** unless expressly authorized. Use the configured remote and upstream of each repository.
- Before editing, note pre-existing uncommitted or untracked changes. Never discard or commit someone else's unrelated work.
- Stage **only files related to the current task**, plus the frontend `TASKS.md`/`progress.md` tracking updates. Avoid indiscriminate `git add .` or `git add -A`.
- Make a clear, scoped commit per completed task in each changed repository (for example `fix(services): apply server-side sorting`). When a checklist item is review/documentation only, commit the checklist/progress update in the frontend repository.
- Push using the existing branch's configured upstream (normally `git push`); verify success. Do not assume pushing the frontend also pushes the backend.
- For cross-repository work, record both hashes in `progress.md`. Because pushes across separate repositories are not atomic, clearly record any partial push success and finish the pending push before proceeding.
- If a push fails due to auth, network, permissions, rejected history, or missing upstream: **stop advancing tasks**; record the exact blocker and state in `progress.md`, keep work safe, and resume the push when possible. Do not claim the task has been fully delivered to GitHub.
- Never expose tokens, SSH keys, `.env` contents, or credentials in commits or output.

## `progress.md` rules — session continuity

- The **first line** must be `Completion Progress: [N]%`, where `N` is the current whole-number percentage, starting at `0`.
- Calculate `N = round(100 × checked tasks ÷ total checkbox tasks)` using only `TASKS.md` checklist items; **initial total: 85**. If the user changes `TASKS.md`, recount and update the denominator. Never count headings, ordinary bullets, or fields in `progress.md` as tasks.
- Keep `Completed tasks: X / Y` consistent with checked boxes; do not inflate progress based on partial implementation.
- Before beginning a task, log its section/checklist position, task description, affected repo(s), and immediate next step.
- After each meaningful change, update the checkpoint with files touched, decisions, validation, blockers, and pending work so another Codex session can continue with minimal re-discovery.
- After every completed/pushed task, append a concise completion history entry with test result(s), commit hash(es), branches, and push status. Update the last completed/next task pointers.
- Document schema/migration steps, environment assumptions, and unresolved issues explicitly.
- Never delete historical completed-task entries simply to shorten the file; condense older entries without losing recovery facts.

## Handoff when approaching a session or usage limit

Before the session ends whenever possible:

1. Save the current work in the working tree and update `progress.md` with an exact **resume checkpoint**: current task, implemented vs unfinished steps, changed files, commands run/results, open errors, and the next command/action.
2. Update `TASKS.md` **only for genuinely verified tasks**, not partially completed ones. Recalculate the progress percentage.
3. Ensure each completed task has been committed and pushed in the appropriate repo(s). If safe on a dedicated work branch, a clearly labelled **WIP checkpoint commit** may be pushed for unfinished work, but **never** mark it complete or call it validated. Do not push unverified WIP changes onto a shared/protected branch.
4. Save and, when safe, commit/push the `progress.md` checkpoint itself. Record any work still local-only.
5. On the next Codex session, **read `progress.md` first**, inspect both Git working trees, finish the current task, then continue with the next unchecked item. Do not redo verified work or skip failures.

A usage limit does **not** cause Codex to restart itself automatically. The user must begin a new Codex session; these files provide the handoff.

## Completion report

At the end of each session, briefly report the last completed task, number completed out of the total, current percentage, Git pushes and branches, validation results, any blockers, and the exact next step. If all tasks are completed, perform the final integration checks and confirm both repositories are in the expected pushed state.
