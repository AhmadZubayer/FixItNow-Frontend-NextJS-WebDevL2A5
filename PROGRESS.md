Completion Progress: [0]%

# FixItNow — Implementation Progress & Resume Log

This file is the persistent handoff record for Codex sessions. Keep it up to date after every task and before any session stops. The source of truth for task completion is the checkbox state in the frontend `TASKS.md`.

## Progress summary

| Field | Current value |
| --- | --- |
| Completed tasks | 0 / 85 |
| Remaining tasks | 85 |
| Overall state | Not started |
| Current task | None — begin with the first unchecked item in `TASKS.md` |
| Last completed task | None |
| Next task | Section 1, checkbox 1 — read `REQUIREMENTS.md` and understand customer, technician, and admin journeys |
| Last successful GitHub push | None recorded |
| Last updated | Not yet started |

**Progress formula:** `round(100 × checked TASKS.md boxes / all TASKS.md boxes)`; initially `0 / 85 = 0%`. Recount if `TASKS.md` changes. Replace the value in the first line with the new integer after every completed task; for example `Completion Progress: [24]%`.

## Repository locations

**Frontend:** `D:\AhmadZubayer\Dev\level-2\Assignments\Assignment-5-NextJS\fixitnow-frontend`

**Backend:** `D:\AhmadZubayer\Dev\level-2\Assignments\Assignment-5-NextJS\FixItNow-backend-server`

**Functional requirements:** `D:\AhmadZubayer\Dev\level-2\Assignments\Assignment-5-NextJS\fixitnow-frontend\REQUIREMENTS.md`

**Task list:** frontend `TASKS.md`. **Agent instructions:** frontend `AGENTS.md`.

## Current task and resume checkpoint

| Field | Details |
| --- | --- |
| Task ID | Not started (use section + sequential checkbox number, e.g. `S01-T01`) |
| Task description | — |
| State | Not started / In progress / Blocked / Awaiting push / Complete |
| Repositories affected | — |
| Branches and remotes | Inspect at session startup |
| Files changed | — |
| Work already implemented | — |
| Work still to do | Read requirements; inspect both projects and configured Git state; begin first unchecked task |
| Tests / commands run | — |
| Results / errors | — |
| Changes only on local machine | — |
| Commits awaiting push | — |
| **Exact next action** | Read `AGENTS.md`, `REQUIREMENTS.md`, and `TASKS.md`; inspect both Git repositories and resume the first task |

## Verified task completion history

Add **one row per verified task** after implementation and validation; include any subsequent push failures in the notes. Use the IDs derived from section and checklist position (the tasks do not need to be renamed in `TASKS.md`).

| Task ID | Completed task | Validation evidence | Frontend commit / branch | Backend commit / branch | GitHub push | Date (local) |
| --- | --- | --- | --- | --- | --- | --- |
| — | No completed tasks yet | — | — | — | — | — |

## Blockers, decisions, and risks

None recorded. For any blocker, record the task ID, exact failing command or error, what was tried, its impact, and the simplest safe next step. Record Prisma migration commands and data-safety concerns here when applicable.

## Session handoff log

Append a short entry whenever a session ends or a usage limit approaches:

### Session 0 — initial checkpoint

- Status: Not started; checklist contains **85** unchecked tasks.
- Verified completed: **0**.
- Pushes: No agent-generated GitHub pushes recorded.
- Resume instruction: Confirm workspace access to both repositories, read all requirements, inspect the existing Git state, and begin the first unchecked item. Never assume previous changes exist without inspecting them.

## Rules for the next Codex session

1. Read `AGENTS.md`, `REQUIREMENTS.md`, `TASKS.md`, and this file.
2. Inspect `git status`, current branch, remotes/upstream, and recent commits in **both** repositories; resolve any pending push before changing code.
3. Continue the **current in-progress** task if one exists; otherwise select the first unchecked task.
4. Validate each task, update its checkbox and the percentage, commit scoped changes, and push to the already configured GitHub repositories **after every task**.
5. Before the next usage limit, leave an exact checkpoint here. A new Codex session must be started by the user; the agent cannot automatically resume itself after a usage cap.
