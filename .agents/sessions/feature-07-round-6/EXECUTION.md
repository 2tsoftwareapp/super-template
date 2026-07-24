# Feature 07 — Round 6 Fixes · EXECUTION

**Session:** feature-07-round-6
**Date:** 2026-07-24
**Mode:** direct (commit thẳng `main` per `.agents/settings.yaml`)
**Base commit:** `7a0615a` (Round 5) → **Fix commit `6cf3caf`**

## Scope
Resolve the 3 High blockers + 1 lifecycle regression flagged in Round 5 review of
`7a0615a`, verified against real code (not assumptions).

## Verification method
- Read actual source in `packages/api-platform` + `packages/api-database`
  (review Round 5 had wrong path `apps/api`).
- Cross-checked Drizzle schema + migrations (`0029`, `0028`) for the real unique indexes.
- Ran `pnpm turbo run typecheck` on `@repo/api-platform`, `@repo/api-database`,
  `@repo/api-core`.

## Findings vs review claims
| ID | Review claim | Verified reality | Action |
|----|--------------|------------------|--------|
| H-001 | "Repository dùng `sourceBackgroundJobId` sai" | `notifications.repository.ts:34` `create()` used single-column target; **`createMany()` (line 57) was already correct** (`[sourceJobId, userId]`) | Fixed only `create()` → `[sourceBackgroundJobId, userId]` matching index `notifications_source_bg_job_id_user_id_unique` |
| H-002 | Savepoint name = UUID with `-` invalid; outer tx rollback | Confirmed: `withSavepoint` used unquoted `sql.raw(\`SAVEPOINT ${name}\`)`; rethrow not caught in `PropagationService` | Quote identifier (`"..."` + escape), wrap `withSavepoint` in try/catch to isolate per-edge |
| H-003 | Mail retry never re-sends | Confirmed: `create()` conflict → null → throw on FAILED; SMTP never called again | Add `reclaimForRetry` (FAILED/stale PROCESSING → PENDING, FOR UPDATE SKIP LOCKED); use-case reclaims then re-sends |
| Lifecycle | `BLOCKED` orphaned (no terminal def, worker only claims PENDING) | Confirmed: `BLOCKED` absent from `TERMINAL_STATUSES`/`BLOCKING_STATUSES`; `claimDueJobs` WHERE `status='PENDING'` | Add `BLOCKED` to `TERMINAL_STATUSES` with rationale comment |

## Files changed (6 source + 1 port = 7)
1. `packages/api-platform/src/modules/notifications/infrastructure/notifications.repository.ts`
2. `packages/api-database/src/drizzle-transaction.service.ts`
3. `packages/api-platform/src/modules/jobs/application/services/propagation.service.ts`
4. `packages/api-platform/src/modules/jobs/domain/job-lifecycle.ts`
5. `packages/api-platform/src/modules/mail/application/ports/mail-deliveries.repository.port.ts` (+ `reclaimForRetry` contract)
6. `packages/api-platform/src/modules/mail/infrastructure/mail-deliveries.repository.ts` (+ `reclaimForRetry` impl)
7. `packages/api-platform/src/modules/mail/application/use-cases/send-mail-template.use-case.ts` (state machine)

## Typecheck result
- **Clean on all 6 edited files** (grep for each file path → no TS errors).
- 2 unrelated errors in `api-platform` typecheck:
  - `audit/.../purge-expired-audit-logs.use-case.spec.ts` imports non-existent `./purge-expired-audit-logs.use-case`
  - `files/.../create-file-version.use-case.spec.ts` imports non-existent `./create-file-version.use-case`
  - These are **pre-existing broken spec references**, not introduced by this change.

## Not committed (out of scope)
- Large set of `.agents/**` and `wiki/**` deletions appeared unstaged in working tree
  (likely from another session). Left untouched — not part of this fix.

## Remaining risk (for Round 7)
- No PostgreSQL integration test run yet (no runtime assertion of savepoint UUID
  path / conflict target). Container `super-template-postgres:5432` is up; recommend
  adding e2e coverage for: (a) propagation savepoint isolation, (b) mail FAILED→retry.
- Pre-existing broken spec references should be fixed separately.
