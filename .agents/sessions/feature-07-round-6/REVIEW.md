# Review: Feature 07 — Background Jobs (Round 6)

## Executive summary (80/20)

- **Recommendation:** `Blocked`
- **Resolved:** Notification `ON CONFLICT` target now matches the composite partial index; savepoint identifiers are quoted; scoped fencing remains correct; `BLOCKED` is terminal again.
- **Blocking findings:** Mail retry writes enum values and a column that do not exist in the schema, and its claim protocol can duplicate or permanently lose sends. Propagation is not idempotent after partial failure and can block descendants while the direct parent remains unblocked.
- **Verification status:** Static review of the full range `6289f180a5dc32fa295e535d6fe56eee69d92286..477b3c3536b6b0b561bb64f024552c6b7003a379`. No GitHub CI status/workflow run. The committed execution log explicitly says PostgreSQL integration tests were not run.
- **Next action:** Fix H-001 and H-002, add real PostgreSQL concurrency/crash-window tests, then review Round 7.

## Developer overview

| Field | Value |
|---|---|
| Feature | Feature 07 — Background Jobs |
| Review round | 6 |
| Base | `6289f180a5dc32fa295e535d6fe56eee69d92286` |
| Head | `477b3c3536b6b0b561bb64f024552c6b7003a379` |
| Recommendation | `Blocked` |
| Critical | 0 |
| High | 2 |
| Medium | 6 |
| Low | 1 |
| Info | 1 |
| Blocking status | H-001, H-002 |
| Ready for done | No |

## Scope reviewed

- Production fix commit `1ef63451cffcf2bdd4ca1e25beaf216cdbdcf9de`.
- Lint-only commit `1bf1e5d1ab3fa8d19a7dc9c105cb9e95e7ce9a6b`.
- Spec import fix `cbba87772fb286736c85a50ac57f540cd31618e0`.
- Cleanup/lifecycle-test commit `477b3c3536b6b0b561bb64f024552c6b7003a379`.
- Notification idempotency, savepoints, propagation BFS, mail retry state machine and `BLOCKED` lifecycle.
- Execution evidence, CI evidence, session artifacts and repository-governance changes.

## Previous findings status

| Round 5 item | Round 6 status | Notes |
|---|---|---|
| Notification conflict target | Resolved statically | Target now matches `(source_background_job_id, user_id)` partial unique index. |
| Savepoint UUID syntax | Resolved statically | Identifier is quoted and embedded quotes are escaped. |
| Per-edge propagation isolation | Partial / still open | Savepoint rollback is caught, but traversal/state semantics remain inconsistent. |
| Mail FAILED retry | Still blocked | New raw SQL does not match the actual enum/table and claim lifecycle is unsafe. |
| `BLOCKED` lifecycle | Resolved statically | `BLOCKED` restored to terminal statuses and test assertion updated. |
| Typecheck broken spec imports | Resolved statically | Two specs now use the configured `@platform` alias. |

## Findings

| ID | Severity | Category | Location | Evidence | Impact | Recommendation | Confidence |
|---|---|---|---|---|---|---|---|
| H-001 | High | Mail reliability / Schema mismatch / Concurrency | `send-mail-template.use-case.ts:62-113`; `mail-deliveries.repository.ts:52-90`; `schema/platform/enums.ts`; `schema/platform/mail.ts`; migration `0028_mail_deliveries_job_uniq.sql` | `reclaimForRetry()` writes `status='PENDING'`, permits `PROCESSING`, and sets `updated_at`, but the committed mail enum contains only `SENT/FAILED` and `mail_deliveries` has no `updated_at`. No migration adds those states/column. Separately, the first delivery is inserted as `FAILED`, so a concurrent worker can immediately reclaim it while the first worker is still sending. `PROCESSING` has no stale predicate, and reclaimed rows are set to `PENDING` but never transitioned to `PROCESSING`. | Retry path fails at runtime on real PostgreSQL. Even after adding schema values, concurrent workers can send duplicate email, an active send can be stolen, and a crash after reclaim leaves an unreclaimable `PENDING` row. H-003 is not closed. | Add an explicit migration/schema for `PENDING/PROCESSING` and lease timestamps. Insert/claim atomically as `PROCESSING`; reclaim only `FAILED` or expired `PROCESSING`; fence `SENT/FAILED` updates with a claim token/attempt. Include `(sourceJobId, recipient)` in every lookup/claim. Add PostgreSQL tests for concurrent first send, fail→retry→success, active-processing protection, and crashes before/after SMTP. | High |
| H-002 | High | Dependency propagation / Idempotent recovery / State integrity | `propagation.service.ts:39-70`; `job-lifecycle.ts:5-20`; `drizzle-transaction.service.ts:25-47` | A dependent already `BLOCKED` is terminal and is skipped without being queued, so rerunning propagation after a partial run never reaches its descendants. When one edge fails, the savepoint is rolled back but the catch writes a `dependency_failed` event and the dependent is still queued; grandchildren can be blocked although the direct parent remains `PENDING`. If the original failure is observability-related, the catch calls the same event repository outside the savepoint and can still abort the outer transaction. | Graphs can remain partially propagated forever, produce false events, or enter inconsistent states where grandchildren are `BLOCKED` but their direct dependency is not. Cancel/fail/stale flows are not safely replayable. | Separate graph traversal from transition outcome. Queue an existing `BLOCKED/FAILED/CANCELLED` node for descendant traversal; queue a newly encountered PENDING node only after `markBlocked` succeeds. On edge failure, record diagnostics outside the business transaction or via a non-failing logger/outbox, and do not traverse through an unblocked node. Add partial-run replay, diamond graph, and injected event/mark failure PostgreSQL tests. | High |
| M-001 | Medium | Notification replay / User-facing idempotency | `send-notification.use-case.ts:75-129`; `job-handlers.registry.ts` | Duplicate insert now returns the existing notification, but the outer use case still calls `emitSSE()` for that existing row. The background handler does not pass `deferDispatch`. | A retry after DB commit can emit the same real-time notification again even though the inbox row is deduplicated. Users may receive duplicate toast/live events. | Return `{ notification, created }` or an equivalent result; emit SSE and create dispatch work only when the row was newly created. Lookup by the full `(sourceBackgroundJobId, userId)` identity. | High |
| M-002 | Medium | Atomic observability | `process-jobs.use-case.ts:42-93` | `claimDueJobs()` commits before `startAttempt + claimed event` runs in a separate transaction. | Crash window leaves a `PROCESSING` job without an attempt or claimed event. | Claim job, create attempt and record claimed event atomically, or use a transactional outbox/claim token. | High |
| M-003 | Medium | Stale recovery observability | `jobs.processor.ts:75-105`; `recoverStaleProcessing()` | Stale-exhausted jobs are marked `FAILED` and propagated, but the open attempt is not finished and no source `stale_exhausted` event is recorded. | Attempts can remain `PROCESSING`; metrics and operator timelines are incomplete. | Close the open attempt and record a source terminal event in the same transaction as stale failure. | Medium |
| M-004 | Medium | Verification / PostgreSQL coverage | `.agents/sessions/feature-07-round-6/EXECUTION.md`; GitHub status | The execution log explicitly says no PostgreSQL integration test was run. GitHub exposes no status or workflow run for HEAD. Only the lifecycle assertion and unrelated import specs changed; no test covers notification conflict, savepoint rollback, BFS replay or mail reclaim. | SQL/schema and concurrency defects pass typecheck/unit mocks and reach production. | Add real PostgreSQL integration/E2E checks and require them in CI before closing the feature. | High |
| M-005 | Medium | Execution evidence accuracy | `feature-07-round-6/EXECUTION.md`; `OVERVIEW.md`; commit history | Session docs refer to fix commit `6cf3caf`, but the reviewed production commit is `1ef6345`. They state `.agents/**` deletions were left uncommitted, although those deletions are included in HEAD. The overview still declares all four issues fixed. | Handoff and audit trail do not describe the actual reviewed range; future reviewers can use stale evidence. | Update execution/overview with the real commit range, exact commands/results and current review verdict. | High |
| M-006 | Medium | Repository governance / Traceability | Commit `477b3c3`; `.gitignore` | The cleanup removes `AGENTS.md`, `.agents/settings.yaml`, project reference, coding rules, skills, wiki and prior review/session history. `.agent-work/` is ignored, but no tracked replacement/bootstrap is present in this range. Current execution docs still reference the deleted settings file. | Fresh clones lose the project-specific architecture/rule baseline and review history. Agent-assisted work becomes non-reproducible and conventions can drift. | If migrating to `.agent-work`, retain a small tracked `AGENTS.md`/bootstrap and project reference, document restoration/setup, and archive review history instead of deleting it. Otherwise restore the live configuration files. | Medium |
| L-001 | Low | Operability / Worker identity | `process-jobs.use-case.ts`; `jobs.processor.ts` | Processing and stale-recovery modules still generate separate random worker IDs. | Logs and lease incidents are harder to correlate across the same process. | Inject one stable process/pod worker identity and reuse it everywhere. | High |
| I-001 | Info | Positive coverage | Notification repository; transaction service; lifecycle; scoped repositories | The composite notification conflict target, quoted savepoint identifier, scope contract, fenced attempt ordering, test import fixes and terminal `BLOCKED` classification are all improvements worth retaining. | Reduces earlier failures and narrows remaining work to runtime state-machine and replay correctness. | Preserve these changes while fixing the blockers. | High |

## Verification reviewed

| Check | Result | Notes |
|---|---|---|
| Scoped repository contract | Pass statically | `JobScope` is present in port, adapter and call sites. |
| Worker fencing ordering | Pass statically | Attempt/event mutation follows successful fenced transition. |
| Notification conflict target | Pass statically | Composite target and predicate match the index. |
| Notification full replay idempotency | Partial | Durable row is deduplicated; SSE is re-emitted. |
| Savepoint identifier syntax | Pass statically | Quoted identifier fixes UUID hyphens. |
| Propagation replay/isolation | Fail | Existing BLOCKED nodes stop traversal; failed edges still emit/queue. |
| Mail schema compatibility | Fail | Raw SQL references absent enum states and column. |
| Mail concurrency/crash safety | Fail | Initial FAILED is reclaimable during active send; no lease/fencing. |
| `BLOCKED` lifecycle | Pass statically | Terminal classification restored and spec updated. |
| Typecheck | Plausible / not independently reproduced | Import mismatches were fixed, but no CI check is attached. |
| Unit tests | Needs more verification | No command output artifact for the claimed suite. |
| PostgreSQL integration tests | Not run | Explicitly acknowledged in `EXECUTION.md`. |
| GitHub CI | Missing | No status or workflow run for HEAD. |

## Required regression tests

1. Mail first-send race: two workers, one SMTP invocation.
2. Mail transient failure then retry success.
3. Mail crash after claim before SMTP; row becomes reclaimable only after lease expiry.
4. Mail SMTP success then DB status-update failure, with explicit reconciliation policy.
5. Notification first insert + concurrent replay on the real partial composite index.
6. Notification replay does not re-emit SSE or duplicate delivery work.
7. Propagation rerun when an intermediate node is already `BLOCKED` still reaches all descendants.
8. Propagation edge failure leaves parent/children consistent and does not rollback sibling edges.
9. Cancel/no-handler/stale failure over a diamond and multi-level graph.
10. Stale recovery closes the current attempt and records the source terminal event.

## Recommendation

**Blocked.**

Round 6 closes the notification conflict-target bug, savepoint syntax bug and lifecycle classification, but Feature 07 is not ready for `done`. The current mail retry implementation is incompatible with the committed database schema and unsafe under concurrency, while propagation remains non-idempotent after partial failures.

## Handoff

- **Next action:** Planning → execution for H-001 and H-002.
- **Ready for done/PR:** No.
- **Blocking:** Yes — two High findings.
- **Review baseline:** `6289f180a5dc32fa295e535d6fe56eee69d92286..477b3c3536b6b0b561bb64f024552c6b7003a379`.
