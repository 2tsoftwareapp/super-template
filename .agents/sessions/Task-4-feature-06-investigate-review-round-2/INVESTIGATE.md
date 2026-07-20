# INVESTIGATE — Feature 06 Review Round 2 Verification

## Executive summary

- **3/6 review claims are incorrect** — the current codebase has already addressed ON CONFLICT WHERE matching, push delivery processor, inbox+delivery atomicity (worker path), and delivery retry state machine. The reviewer appears to have analysed a stale version.
- **2/6 claims are valid** — audit logging is not wrapped in a transaction with job mutation, and job idempotency key is missing `organization_id` scope.
- **1 finding of concern**: `recoverStaleProcessing()` exists in the repository but no cron/processor invokes it — stale deliveries will never be recovered automatically.
- Strongest evidence: full E2E test suite (`notifications.e2e.spec.ts`) covers conflict target, delivery pipeline, retry backoff, stale recovery, and invalid token cleanup end-to-end with real PostgreSQL.
- **Next action**: Fix the 2 real issues (audit atomicity + idempotency key scope) and add a cron for stale recovery, then the codebase is feature-complete.

## Developer overview

| Field | Value |
|-------|-------|
| Investigation status | Root Cause Confirmed (2 issues) + Not Applicable (3 false positives) |
| Correct review claims | Audit atomicity (P1), Idempotency key scope (P1) |
| Incorrect review claims | ON CONFLICT matching (P0), Push processor missing (P0), Inbox+delivery not atomic — worker (P0), Retry state machine missing (P1) |
| Evidence gap | `recoverStaleProcessing` has no production caller |
| Next action | Fix 2 real issues + schedule stale recovery, then proceed to execution |

---

## Question

Are the 6 issues identified in Review Round 2 real defects in the current codebase at commit `1b6d485`?

## Status

2 Root Cause Confirmed, 3 Not Applicable (code already correct), 1 Design Concern

## Evidence

### E-001: ON CONFLICT WHERE predicate — conflict target vs partial unique index

| Field | Detail |
|-------|--------|
| Source | `notifications.repository.ts:48-51` |
| Observation | `onConflictDoNothing({ target: [notifications.sourceJobId, notifications.userId], where: sql`${notifications.sourceJobId} is not null` })` |
| Supports? | The WHERE clause matches the partial unique index exactly |
| Confidence | High |

| Field | Detail |
|-------|--------|
| Source | `notifications.ts:61-63` (schema) |
| Observation | `uniqueIndex('notifications_source_job_id_user_id_unique').on(table.sourceJobId, table.userId).where(sql`${table.sourceJobId} is not null`)` |
| Supports? | Schema defines the same columns + WHERE as the conflict target |
| Confidence | High |

| Field | Detail |
|-------|--------|
| Source | `0021_notification_hardening.sql:5` (migration) |
| Observation | `CREATE UNIQUE INDEX ... ON notifications (source_job_id, user_id) WHERE notifications.source_job_id is not null;` |
| Supports? | Migration creates the matching partial unique index |
| Confidence | High |

| Field | Detail |
|-------|--------|
| Source | `notifications.e2e.spec.ts:41-61` |
| Observation | E2E test verifies `processJob()` run twice does not create duplicate rows; uses real PostgreSQL |
| Supports? | Passes — conflict target correctly resolves partial unique index |
| Confidence | High |

**Verdict: ❌ INCORRECT CLAIM.** Drizzle `onConflictDoNothing` with `where` clause generates `ON CONFLICT (source_job_id, user_id) WHERE source_job_id IS NOT NULL DO NOTHING`, which matches the partial unique index. The E2E test confirms runtime correctness.

---

### E-002: Push notification delivery processor

| Field | Detail |
|-------|--------|
| Source | `notification-delivery.processor.ts:1-154` |
| Observation | `NotificationDeliveryProcessor` exists with `@Cron(CronExpression.EVERY_30_SECONDS)`, claims pending deliveries → sends via `pushNotifier.sendToToken()` → marks sent/failed/retryable |
| Supports? | Processor is fully implemented and registered |
| Confidence | High |

| Field | Detail |
|-------|--------|
| Source | `notifications.module.ts:47` |
| Observation | `NotificationDeliveryProcessor` is listed in the module's `providers` array |
| Supports? | NestJS registers the cron automatically |
| Confidence | High |

| Field | Detail |
|-------|--------|
| Source | `fcm-push.service.ts:81-111` |
| Observation | `FcmPushService.sendToToken()` sends to a single FCM token, returns `PushSendResult` with `success`, `providerMessageId`, or `INVALID_TOKEN` |
| Supports? | The processor calls this method per delivery row |
| Confidence | High |

| Field | Detail |
|-------|--------|
| Source | `notification-delivery.processor.ts:30-31` |
| Observation | `@Inject(PUSH_NOTIFIER) private readonly pushNotifier: PushNotifier` — processor HAS push notifier dependency |
| Supports? | Direct contradiction of review claim |
| Confidence | High |

| Field | Detail |
|-------|--------|
| Source | `notifications.e2e.spec.ts:97-113` |
| Observation | E2E test creates delivery row, runs `processDeliveries()` with mocked `sendToToken`, verifies status → `SENT` and `providerMessageId` |
| Supports? | Delivery pipeline works end-to-end |
| Confidence | High |

**Verdict: ❌ INCORRECT CLAIM.** `NotificationDeliveryProcessor` exists, runs every 30 seconds, injects `PUSH_NOTIFIER`, and sends FCM pushes. The reviewer's claim that `dispatch` lacks `PUSH_NOTIFIER` is correct but irrelevant — delivery processing is separated from dispatch by design (processor claims `PENDING` deliveries from the db).

---

### E-003: Inbox + delivery rows atomicity

| Field | Detail |
|-------|--------|
| Source | `notification-delivery.use-case.ts:302-348` |
| Observation | `await this.transactionPort.run(async (tx) => { createMany(tx); upsertDeliveriesForNotification(tx); markCompleted(tx); })` — inbox insert AND delivery upsert are in the same DB transaction |
| Supports? | Worker path IS atomic |
| Confidence | High |

| Field | Detail |
|-------|--------|
| Source | `notification-delivery.use-case.ts:324-328` |
| Observation | `findBySourceJobAndUsers()` loads existing rows when `inserted.length < batch.length`, ensuring retry still creates delivery rows for all recipients |
| Supports? | Idempotency doesn't cause missed deliveries |
| Confidence | High |

| Field | Detail |
|-------|--------|
| Source | `send-notification.use-case.ts:106-108` |
| Observation | Ad-hoc path: `this.dispatchService.dispatch(view, resolvedOrganizationId)` — uses fire-and-forget `dispatch()` |
| Supports? | Ad-hoc path is NOT atomic |
| Confidence | High |

| Field | Detail |
|-------|--------|
| Source | `notification-dispatch.service.ts:24-27` |
| Observation | `void this.upsertDeliveries(notification)` — fire-and-forget, errors silently swallowed |
| Supports? | Ad-hoc path has a failure window between inbox insert and delivery upsert |
| Confidence | High |

**Verdict: ⚠️ PARTIALLY CORRECT.** Worker/job-based path (the primary delivery mechanism) IS fully atomic within a transaction. The ad-hoc path via `SendNotificationUseCase.dispatch()` is fire-and-forget without a transaction, but ad-hoc sends are a secondary path (not used by scheduled jobs).

---

### E-004: Delivery retry state machine

| Field | Detail |
|-------|--------|
| Source | `deliveries.repository.ts:37-63` |
| Observation | `claimPending` WHERE clause: `status = 'PENDING' AND (next_attempt_at IS NULL OR next_attempt_at <= now())` |
| Supports? | Already filters by `next_attempt_at` |
| Confidence | High |

| Field | Detail |
|-------|--------|
| Source | `deliveries.repository.ts:102-119` |
| Observation | `markRetryable()` sets status `PENDING` + `nextAttemptAt` + clears `lastError` |
| Supports? | Retry mechanism exists |
| Confidence | High |

| Field | Detail |
|-------|--------|
| Source | `deliveries.repository.ts:121-152` |
| Observation | `recoverStaleProcessing()` exists, resets PROCESSING → PENDING after timeout |
| Supports? | Stale recovery function exists |
| Confidence | High |

| Field | Detail |
|-------|--------|
| Source | `notification-delivery.processor.ts:109-126` |
| Observation | Processor implements max retries check: `if (delivery.attempts >= MAX_RETRY_ATTEMPTS) → markFailed()` else `markRetryable()` with exponential backoff |
| Supports? | Processor handles retry logic |
| Confidence | High |

| Field | Detail |
|-------|--------|
| Source | `notification-delivery.processor.ts` (full file) |
| Observation | **`recoverStaleProcessing()` is never called** by any cron/processor |
| Does NOT support | Stale PROCESSING rows will not be automatically recovered |
| Confidence | High |

**Verdict: ⚠️ MOSTLY CORRECT code.** The state machine exists: `claimPending` checks `next_attempt_at`, `markRetryable` exists, processor implements backoff/max retries. **However, `recoverStaleProcessing()` has no scheduled caller** — stale PROCESSING rows will never be recovered automatically. This is a missing integration point, not a missing implementation.

---

### E-005: Job mutation + audit atomicity

| Field | Detail |
|-------|--------|
| Source | `notification-delivery.use-case.ts:138-158` |
| Observation | Job is created first (line 137), then `auditWriter.log()` is called (line 147). No transaction wraps both operations. |
| Supports? | If audit log fails, job exists without audit trail |
| Confidence | High |

| Field | Detail |
|-------|--------|
| Source | `notification-delivery.use-case.ts:242-261` |
| Observation | Job is cancelled first (line 242-243), then `auditWriter.log()` is called (line 253). No transaction wraps both. |
| Supports? | Same failure window for cancellation |
| Confidence | High |

| Field | Detail |
|-------|--------|
| Source | `send-notification.use-case.ts:70-101` |
| Observation | Notification is created (line 70), audit logged (line 87-101), then dispatch is called (line 107). No transaction wraps create + audit. |
| Supports? | Same pattern for ad-hoc sends |
| Confidence | High |

**Verdict: ✅ CORRECT CLAIM.** Job creation/cancellation and audit logging are not wrapped in a single transaction. If the audit writer fails (e.g., DB transient error), the mutation persists without an audit trail. Fix requires `transactionPort.run()` with both operations sharing the same executor.

---

### E-006: Job idempotency key missing tenant scope

| Field | Detail |
|-------|--------|
| Source | `notifications.ts:154-156` (schema) |
| Observation | `uniqueIndex('notification_jobs_actor_idempotency_key_unique').on(table.actorId, table.idempotencyKey).where(sql`${table.idempotencyKey} is not null`)` |
| Supports? | Unique index does NOT include `organization_id` |
| Confidence | High |

| Field | Detail |
|-------|--------|
| Source | `notification-jobs.repository.ts:71-88` |
| Observation | `findByIdempotencyKey()` only queries by `actorId + idempotencyKey` |
| Supports? | Repository lookup matches the index |
| Confidence | High |

| Field | Detail |
|-------|--------|
| Source | `notification-jobs.repository.ts:36-59` |
| Observation | `createIdempotent()` uses `findByIdempotencyKey(actorId, idempotencyKey)` — no organization filter |
| Supports? | An actor in multiple orgs can collide on the same key across orgs |
| Confidence | High |

**Verdict: ✅ CORRECT CLAIM.** The unique constraint `(actor_id, idempotency_key)` does not include `organization_id`. Fix requires migration to add `organization_id` to the unique index, update `findByIdempotencyKey()` to accept `organizationId`, and update `createIdempotent()` to pass it.

## Observed facts

| # | Fact | Source |
|---|------|--------|
| 1 | Drizzle `onConflictDoNothing` with `where` generates correct PostgreSQL partial unique index matching | Code at `notifications.repository.ts:48-51` |
| 2 | `NotificationDeliveryProcessor` is registered and runs every 30s | `notifications.module.ts:47`, `notification-delivery.processor.ts:36` |
| 3 | `processClaimedJob` wraps inbox insert + delivery upsert in a single transaction | `notification-delivery.use-case.ts:302-348` |
| 4 | `recoverStaleProcessing` is implemented but has no production caller | Code at `deliveries.repository.ts:121-152`, `notification-delivery.processor.ts` |
| 5 | Job creation + audit, cancellation + audit are not in a shared transaction | `notification-delivery.use-case.ts:138-158,242-261` |
| 6 | Job idempotency unique index is `(actor_id, idempotency_key)` without `organization_id` | `notifications.ts:154-156` |
| 7 | E2E tests exist covering conflict target, delivery pipeline, retry, stale recovery, and invalid token cleanup | `notifications.e2e.spec.ts` (217 lines) |
| 8 | NotificationDeliveryProcessor handles max retries (5) and exponential backoff | `notification-delivery.processor.ts:109-126` |

## Hypotheses

| Hypothesis | Supporting evidence | Counter evidence | Verification | Confidence |
|------------|-------------------|------------------|--------------|------------|
| H-001: Review was written against a pre-fix state of the code | 3/6 claims contradict current code (conflict target, processor, atomicity) | Review HEAD matches current commit `1b6d485` | Check if the review was generated before the final commit landed | Medium |
| H-002: Reviewer overlooked the `NotificationDeliveryProcessor` | File clearly exists at `notification-delivery.processor.ts` with cron + DI wiring | N/A | Code inspection | High |

## Impact

| Area | Impact | Confidence |
|------|--------|------------|
| Audit atomicity (job create/cancel) | Missing audit trail on audit writer failure — compliance gap | High |
| Job idempotency cross-org collision | SUPER_ADMIN across orgs may hit false unique violations; an actor in multiple orgs can have idempotency collisions | High |
| Stale delivery recovery | PROCESSING rows stuck from a crash will never auto-recover without a scheduled recovery cron | High |
| Incorrect review claims 1-4 | No impact on code quality — code is correct | N/A |

## Root cause

**Confirmed (2):**
1. **Audit atomicity**: `NotificationDeliveryUseCase.createDeliveryJob()` and `cancelJob()` were implemented without wrapping the mutation and audit log in a shared transaction. Same in `SendNotificationUseCase.execute()`. This is an oversight in the initial implementation.
2. **Idempotency key scope**: The unique index on `notification_jobs` was originally designed with `(actor_id, idempotency_key)` without considering multi-tenant collisions. `organization_id` needs to be added to the constraint.

**Design gap (1):**
3. **Stale recovery scheduling**: `recoverStaleProcessing()` was implemented but no cron calls it. The processor should call it at startup or on a periodic basis.

## Recommendation

### Verified incorrect claims (no action needed):
- **ON CONFLICT WHERE**: Code is correct as-is. No action.
- **Push processor**: Code is correct as-is. No action.
- **Inbox + delivery atomicity (worker)**: Code is correct as-is. No action.
- **Retry state machine**: Code is correct as-is. `recoverStaleProcessing()` needs a caller (see below).

### Real fixes needed:

1. **P1 — Audit atomicity**: Wrap job create/cancel + audit log in `transactionPort.run()`:
   - `NotificationDeliveryUseCase.createDeliveryJob()`: move `auditWriter.log()` inside the same `TransactionExecutor` that creates the job
   - `NotificationDeliveryUseCase.cancelJob()`: wrap `markCancelled()` and `auditWriter.log()` in a transaction
   - `SendNotificationUseCase.execute()`: wrap `create()` and `auditWriter.log()` in a transaction (use the existing `executor` param)

2. **P1 — Idempotency key scoping**:
   - Migration: add `organization_id` to the unique index `notification_jobs_actor_idempotency_key_unique`
   - Update `findByIdempotencyKey()` signature to accept `organizationId`
   - Update `createDeliveryJob()` to pass `organizationId` when creating idempotent jobs

3. **P2 — Stale recovery scheduling**:
   - Add a `recoverStaleProcessing()` call in `NotificationDeliveryProcessor.processDeliveries()` (e.g., once every 5 minutes or after claiming deliveries)

## Open questions

| Question | Owner | Blocking? |
|----------|-------|-----------|
| Should ad-hoc `SendNotificationUseCase.dispatch()` be wrapped in a transaction too? | Review decision | No — secondary path, lower impact |
| Is `recoverStaleProcessing` needed at all if delivery processing is fast (<30s)? | Team | No — safety net for crash recovery |

## Handoff

Ready for planning. The real issues are well-scoped: audit atomicity and idempotency key scope. Suggested next skill: `planning`.
