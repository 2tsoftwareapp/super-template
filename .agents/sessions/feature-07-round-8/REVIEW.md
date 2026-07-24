# Review: Feature 07 — Background Jobs (Round 8)

## Executive summary (80/20)

- **Recommendation:** `Blocked`
- **Critical blocker:** Migration `0000/0001` không tương thích migration lineage/custom migrator hiện tại. Database hiện hữu có thể skip toàn bộ DDL mới hoặc cố chạy full baseline lên schema đang tồn tại; fresh DB cũng có nguy cơ chạy lại legacy migrations sau baseline và lỗi duplicate objects.
- **High blockers:** Claim token chỉ fence DB update, không fence SMTP side effect sau lease expiry/handler timeout; BFS vẫn queue dependent sau savepoint rollback vì biến `marked` được set trước `recordEvent` và không rollback theo transaction.
- **Resolved:** `claimForProcessing()` trả null khi không claim; `updateStatus()` yêu cầu claim token + PROCESSING; reclaim dùng recipient; transition-aware BFS được cải thiện; notification replay SSE vẫn deduplicated.
- **Verification:** Static review range `fb08da0c83e08dd49ae980031d547093f6960736..449bf1bf83e6dbf75f356e469201766db44947e8`. Không có GitHub status/workflow run. Diff không thêm regression-test file.
- **Next action:** Sửa C-001, H-001, H-002; chạy migration upgrade/fresh-DB + PostgreSQL concurrency/crash-window tests; review Round 9.

## Developer overview

| Field | Value |
|---|---|
| Feature | Feature 07 — Background Jobs |
| Review round | 8 |
| Base | `fb08da0c83e08dd49ae980031d547093f6960736` |
| Head | `449bf1bf83e6dbf75f356e469201766db44947e8` |
| Recommendation | `Blocked` |
| Critical | 1 |
| High | 2 |
| Medium | 6 |
| Low | 1 |
| Info | 1 |
| Ready for done | No |

## Scope reviewed

- Commit `449bf1bf83e6dbf75f356e469201766db44947e8`.
- Custom SQL migrator and migration ordering/backfill behavior.
- New `0000_amazing_master_mold.sql` and `0001_nebulous_vance_astro.sql`.
- Mail schema, claim/reclaim, claim-token fencing and send-template orchestration.
- Dependency propagation savepoint/queue semantics.
- Previous Round 7 residual findings, test diff and CI evidence.

## Round 7 status

| Round 7 item | Round 8 status | Notes |
|---|---|---|
| Missing mail migration | Attempted but blocked | Added migration files, but numbering/baseline strategy is incompatible with the custom migrator and existing lineage. |
| Failed claim fallback | Resolved statically | `claimForProcessing()` now returns null when the UPDATE claims no row. |
| Completion fencing | Resolved for DB state only | Claim token gates `SENT/FAILED`; it cannot prevent duplicate external SMTP sends after lease loss. |
| Composite identity | Partial | `reclaimForRetry()` now uses recipient; `findBySourceJobId()` still does not. |
| BFS unsuccessful-transition queue | Partial / blocked | Null transition no longer marks true, but savepoint rollback after event failure leaves JS `marked=true`. |
| Notification SSE replay | Resolved | Unchanged and remains correct. |

## Findings

| ID | Severity | Category | Location | Evidence | Impact | Recommendation | Confidence |
|---|---|---|---|---|---|---|---|
| C-001 | Critical | Database migration / Deployment safety | `apps/api/drizzle/0000_amazing_master_mold.sql`; `0001_nebulous_vance_astro.sql`; `apps/api/src/cli/migrations.ts` | Custom migrator sorts every `.sql` filename and tracks exact filenames. It auto-backfills every numeric migration `<=16` on an initialized DB with an empty ledger. New DDL is numbered `0000/0001`: `0000` is a 599-line full current-schema baseline containing mail enum/lease columns and existing indexes; `0001` only adds `claim_token`. If ledger is empty, both are marked applied without executing. If ledger is non-empty, they are unapplied and the migrator attempts full `0000` against existing types/tables. On fresh DB, `0000` already creates objects such as `mail_deliveries_job_recipient_uniq`, then legacy migrations such as `0028` remain in the folder and can recreate them. | Production upgrade can silently omit required enum/columns/token or fail deployment on duplicate objects. Fresh database bootstrap is also not demonstrably valid. The mail code can deploy against an incompatible schema. | Do not introduce a new full-schema `0000` into an established lineage. Remove/re-baseline it deliberately outside normal upgrade flow. Add a forward-only migration with an index greater than the current highest migration, using `ALTER TYPE ... ADD VALUE`, `ALTER TABLE ... ADD COLUMN`, and no duplicate baseline DDL. Test upgrade from the exact prior schema and bootstrap from empty DB through the project migrator. | High |
| H-001 | High | Mail reliability / External side-effect fencing | `mail-deliveries.repository.ts:58-184`; `send-mail-template.use-case.ts`; jobs timeout/retry policy | Claim token correctly fences database finalization, but not SMTP. Mail lease defaults to 5 minutes; job handler timeout is 4 minutes and retry delay starts around 1 minute. Timeout uses Promise.race and does not cancel the underlying mailer. A stale send can continue after its lease expires while a retry reclaims and sends again. The old worker's DB update is rejected, but both SMTP calls may already have succeeded. | Duplicate customer email remains possible around slow provider calls, timeout, network ambiguity, or SMTP-success/DB-failure. DB row can only record one outcome and cannot prove which external sends occurred. | Use provider idempotency key where supported, or durable outbox/provider-message reconciliation. Ensure lease renewal/cancellation covers the full external operation. Treat SMTP-success/DB-failure as an explicit reconciliation state rather than normal retry. Add a test where the first mailer continues beyond timeout/lease while retry starts. | High |
| H-002 | High | Dependency propagation / Transaction-state mismatch | `propagation.service.ts:52-96` | `marked=true` is assigned inside the savepoint immediately after `markBlocked()`, before `recordEvent()`. If `recordEvent()` throws, the savepoint rolls back the database transition, but the JavaScript variable stays true. The catch swallows the error; queue guard then sees `marked=true` and traverses descendants through an unblocked node. | Grandchildren can become BLOCKED while their direct parent remains PENDING. The exact inconsistency Round 7 aimed to fix still occurs when observability fails after the state transition. | Make the savepoint callback return `blocked === true`; assign `marked` only after `withSavepoint()` resolves successfully. Alternatively move event emission out of the transition savepoint with an outbox. Test event failure after successful `markBlocked` and assert no descendant traversal after rollback. | High |
| M-001 | Medium | Mail identity consistency | `findBySourceJobId()`; send-template existing-SENT branch | Durable uniqueness is `(source_job_id, recipient)`, but the pre-reclaim lookup still filters only `sourceJobId`. | For multi-recipient jobs, a SENT row for recipient A can make recipient B return early, or inspect the wrong active state. | Replace with `findBySourceJobAndRecipient(sourceJobId, recipient)` and use the composite identity in every read/claim/reclaim path. | High |
| M-002 | Medium | Mail admin/read model | `MailDeliveriesRepository.ListDeliveriesParams` | Adapter still restricts status filter to `SENT | FAILED` although schema/port now include `PENDING | PROCESSING`; cast hides the mismatch. | Operators cannot reliably query active or stuck delivery states. | Use shared `MailDeliveryStatus` end-to-end in DTO/controller/adapter. | High |
| M-003 | Medium | Atomic observability | `process-jobs.use-case.ts` | Job claim still commits before attempt creation and claimed event. | Crash window leaves PROCESSING job without attempt/event. | Make claim + attempt + claimed event atomic or introduce transactional outbox. | High |
| M-004 | Medium | Stale recovery observability | `jobs.processor.ts`; stale recovery repository flow | Exhausted stale jobs still do not close the active attempt or record a source `stale_exhausted` terminal event. | Attempt metrics and operator timeline remain inconsistent. | Finalize attempt and source event atomically with stale failure. | Medium |
| M-005 | Medium | Verification / Regression coverage | Commit file list; GitHub status/workflow | User reports 68 files/333 tests and clean typecheck, but range adds no test file and GitHub has no status/workflow run. Migration and concurrency paths are unverified. | Existing unit suite can remain green while deployment and race defects reach production. | Add migration upgrade/bootstrap tests, PostgreSQL race/failure tests and required CI; commit exact commands/results. | High |
| M-006 | Medium | Repository governance / Reproducibility | Current repository baseline | Tracked project instructions/reference/history removed in earlier cleanup remain without a tracked bootstrap replacement. | Fresh-clone development/review workflow is not reproducible. | Restore minimal tracked project guidance or document/bootstrap `.agent-work` replacement. | Medium |
| L-001 | Low | Operability / Worker identity | Jobs process/recovery workers | Worker IDs remain independently generated random constants. | Logs and leases are harder to correlate. | Inject one stable process/pod worker identity. | High |
| I-001 | Info | Positive coverage | Mail repository/use case; propagation guard | Failed claim now returns null; claim token gates DB finalization; retry uses recipient; queue guard distinguishes terminal vs newly marked nodes. | These changes materially improve the prior implementation and should be retained. | Preserve them while correcting migration lineage, external-effect semantics and rollback-aware queue state. | High |

## Verification reviewed

| Check | Result | Notes |
|---|---|---|
| Failed mail claim | Pass statically | Returns null; another worker's PROCESSING row is not treated as owned. |
| DB completion fencing | Pass statically | Requires id + claimToken + PROCESSING. |
| Composite reclaim identity | Pass statically | Recipient is included in reclaim. |
| Composite lookup identity | Fail | Existing lookup still uses only sourceJobId. |
| Forward production migration | Fail | Added files are `0000/0001`, incompatible with baseline/backfill logic. |
| Fresh DB migration | Fail / unverified | Full baseline is followed by existing legacy migration files. |
| External SMTP exactly-once/at-most-once | Fail | Token fences DB only; slow stale sender can still send. |
| BFS null-transition guard | Pass statically | `marked` remains false when markBlocked returns null. |
| BFS rollback-aware guard | Fail | JS `marked` remains true after savepoint rollback caused by event failure. |
| Typecheck | Self-reported clean | No attached CI evidence. |
| Unit tests | Self-reported 333 pass | No test changes for the reviewed fixes. |
| GitHub CI | Missing | No status/workflow run. |

## Required regression tests

1. Upgrade using custom migrator from exact Round 7 database/ledger state.
2. Upgrade initialized DB with empty `__app_migrations` ledger.
3. Fresh empty DB applies all migrations without duplicate objects.
4. Verify enum values and mail columns after migration.
5. Two concurrent claimers: only one receives a claim token.
6. Stale token cannot update DB after reclaim.
7. Slow SMTP continues after handler timeout/lease expiry; define and verify duplicate/reconciliation policy.
8. SMTP success followed by fenced DB update failure.
9. Multi-recipient source job uses full `(sourceJobId, recipient)` identity.
10. `recordEvent()` fails after `markBlocked`; savepoint rollback must leave `marked=false` and descendants unchanged.
11. Existing BLOCKED intermediate replay still reaches descendants.

## Recommendation

**Blocked.**

Round 8 improves claim ownership and queue intent, but the migration strategy is unsafe for both upgrades and fresh bootstrap. Mail still cannot fence the external SMTP side effect, and propagation still leaks a transaction rollback through an in-memory boolean.

## Handoff

- **Next action:** Planning → execution for C-001, H-001 and H-002.
- **Ready for done:** No.
- **Blocking:** One Critical, two High.
- **Review baseline:** `fb08da0c83e08dd49ae980031d547093f6960736..449bf1bf83e6dbf75f356e469201766db44947e8`.
