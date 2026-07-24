# Feature 07 — Round 6 · OVERVIEW

## Executive summary (80/20)
- Round 5 review (`7a0615a`) flagged 3 High + 1 lifecycle blocker in Feature 07
  (background jobs + notifications). This round **verified each against real code**
  and fixed all four.
- **H-001 was over-claimed** by the review: only `notifications.create()` was wrong;
  `createMany()` was already correct. Fix scope narrowed accordingly.
- All 6 edited files pass `tsc --noEmit`. Two unrelated typecheck errors are
  pre-existing broken spec imports (audit/files), untouched.
- Committed directly to `main` as `6cf3caf` (project rule: `branch.mode: direct`).

## What changed
| Area | Before | After |
|------|--------|-------|
| Inbox idempotency | `create()` conflict target = single column | `create()` matches `(sourceBackgroundJobId, userId)` unique index |
| Savepoint safety | unquoted UUID name → PG syntax error; per-edge error rolled back whole BFS | quoted identifier + per-edge try/catch isolation |
| Mail retry | FAILED row → permanent throw, no re-send | FAILED/stale PROCESSING → reclaim → re-send (state machine) |
| BLOCKED status | not terminal, orphaned | terminal; worker claims only PENDING, BFS independent |

## Recommendation
**Resolved for Round 6** — but recommend Round 7 add PostgreSQL integration tests
for the two runtime-only paths (savepoint UUID, mail retry) before declaring done.
