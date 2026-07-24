# Review: Feature 07 — Background Jobs (Round 7)

## Executive summary (80/20)

- **Recommendation:** `Blocked`
- **Resolved:** Notification idempotent replay no longer re-emits SSE; schema source now declares mail `PENDING/PROCESSING`, lease fields and `BLOCKED` propagation traversal is improved for already-terminal intermediates.
- **Blocking findings:** No database migration accompanies the new mail enum/columns; the mail lease is not an ownership fence and can still permit duplicate/stale updates. BFS still traverses through a dependent when `markBlocked` returned null or the savepoint failed, so descendants can be blocked while their direct parent remains active/unblocked.
- **Verification:** Static review of `c3f243e39bb17fdc840cfe5ca6bf19cd1bb212dd..03f08e40035e349b05aedf5083217123182f2872`. GitHub has no attached status/workflow run. The diff changes seven production/schema files and no migration or regression-test file.
- **Next action:** Fix H-001/H-002, add the migration and real PostgreSQL concurrency/crash-window tests, then perform Round 8.

## Developer overview

| Field | Value |
|---|---|
| Feature | Feature 07 — Background Jobs |
| Review round | 7 |
| Base | `c3f243e39bb17fdc840cfe5ca6bf19cd1bb212dd` |
| Head | `03f08e40035e349b05aedf5083217123182f2872` |
| Recommendation | `Blocked` |
| Critical | 0 |
| High | 2 |
| Medium | 6 |
| Low | 1 |
| Info | 1 |
| Ready for done | No |

## Scope reviewed

- Commit `03f08e40035e349b05aedf5083217123182f2872`.
- Mail schema, repository port/adapter, send-template state machine and lease handling.
- Propagation BFS replay/error semantics.
- Notification SSE replay behavior.
- Database migration coverage, test diff, typecheck/CI claims and previous Round 6 residual findings.

## Round 6 status

| Round 6 item | Round 7 status | Notes |
|---|---|---|
| H-001 Mail schema/state machine | Partial / blocked | Schema source changed, but no migration; claim ownership and completion fencing remain unsafe. |
| H-002 Propagation replay | Partial / blocked | Existing terminal intermediates are traversed, but failed/null transitions are also traversed. |
| M-001 Notification duplicate SSE | Resolved statically | `isExisting` prevents `emitSSE()` on replay. |
| M-002 Claim + attempt atomicity | Open | Not modified. |
| M-003 Stale recovery attempt/event | Open | Not modified. |
| M-004 PostgreSQL/CI verification | Open | No CI and no new integration tests. |

## Findings

| ID | Severity | Category | Location | Evidence | Impact | Recommendation | Confidence |
|---|---|---|---|---|---|---|---|
| H-001 | High | Mail reliability / Migration / Lease fencing | `schema/platform/enums.ts`; `schema/platform/mail.ts`; `mail-deliveries.repository.ts:58-162`; `send-mail-template.use-case.ts:62-122`; reviewed file list | The TypeScript schema adds `PENDING`, `PROCESSING`, `lease_expires_at`, and `updated_at`, but the commit contains no Drizzle migration. `claimForProcessing()` returns the current row when its UPDATE claims nothing; a current `PROCESSING` row is therefore indistinguishable from a row claimed by this caller, and the use case proceeds whenever returned status is `PROCESSING`. There is no claim token/worker id; `updateStatus()` updates by delivery id only. The handler timeout does not cancel the underlying SMTP promise, so after lease expiry another attempt can reclaim/send while the stale sender can still send and overwrite status. | Existing deployed databases reject the new states/columns. After migration, duplicate email and stale-worker status mutation remain possible around lock loss, timeout, SMTP success followed by DB failure, or lease expiry. The claimed “worker fencing” is not an actual ownership fence. | Add an explicit forward migration for enum values and columns. Return `null` on failed claim rather than the existing row. Add `claim_token`/attempt or `worker_id`, require it in `SENT/FAILED` updates, and reclaim only expired leases. Align lease with handler timeout/renewal and define provider-idempotency or reconciliation for SMTP-success/DB-failure. Use `(sourceJobId, recipient)` for all lookup/claim operations. | High |
| H-002 | High | Dependency graph / State integrity / Error isolation | `propagation.service.ts:39-80`; `jobs.repository.markBlocked` contract | The service now correctly traverses already `BLOCKED/FAILED/CANCELLED` nodes, but for a `PENDING/PROCESSING` dependent it does not expose whether `markBlocked()` succeeded. `markBlocked` only transitions `PENDING`; a `PROCESSING` node returns null. Regardless of null return or savepoint exception, line 80 always queues the dependent. The catch also records through the same observability repository outside the savepoint and can still fail the outer transaction. | Grandchildren can become `BLOCKED` while their direct parent remains `PROCESSING/PENDING`; a failed edge can create false diagnostics and inconsistent graph state. Partial-run replay is improved only for existing terminal nodes, not for transition failures. | Have the savepoint callback return an explicit transition outcome. Queue a node only when it was already blocking/terminal or when `markBlocked` succeeded. Do not queue after null/rollback. Define behavior for a dependent already `PROCESSING` (fenced cancel/block-pending or defer propagation). Send isolation diagnostics through a non-transactional logger/outbox. Add PostgreSQL tests with null transition, event failure and processing-node races. | High |
| M-001 | Medium | Mail identity consistency | `findBySourceJobId`; `reclaimForRetry`; unique index `(source_job_id, recipient)` | Repository lookup/reclaim use only `sourceJobId`, while the durable unique identity includes recipient. | If one source job ever emits to multiple recipients, a retry can inspect/reclaim the wrong delivery. | Accept recipient in lookup/reclaim and filter using the complete unique identity. | Medium |
| M-002 | Medium | Mail admin/read model | `MailDeliveriesRepository` local `ListDeliveriesParams` | Adapter still narrows list status to `SENT | FAILED` while the port/schema now include `PENDING | PROCESSING`. | Operations cannot reliably filter active/stuck deliveries; local type casts hide the mismatch. | Use shared `MailDeliveryStatus` throughout DTO/query/adapter and expose active-state filters. | High |
| M-003 | Medium | Atomic observability | `process-jobs.use-case.ts` | Job claim commits before attempt creation and `claimed` event. | Crash window leaves `PROCESSING` without attempt/event. | Make claim + attempt + claimed event atomic or use a transactional outbox. | High |
| M-004 | Medium | Stale recovery observability | `jobs.processor.ts`; `recoverStaleProcessing()` | Exhausted stale jobs still do not close the active attempt or record a source `stale_exhausted` terminal event. | Attempt metrics/timeline remain inconsistent. | Finish the open attempt and record the source event atomically with stale failure. | Medium |
| M-005 | Medium | Verification / Regression coverage | Commit file list; GitHub status/workflow | User reports 68 test files / 333 tests and clean typecheck, but the reviewed commit changes no test or migration file and has no GitHub status/workflow. The new defects are PostgreSQL/concurrency-specific and are not demonstrated by existing unit success. | Deployment/runtime regressions can pass typecheck and the existing suite. | Commit exact command output in an execution artifact, add migration integration, PostgreSQL race tests and required CI checks. | High |
| M-006 | Medium | Repository governance / Reproducibility | Prior cleanup retained at HEAD | Project rule/reference files and most review history remain removed with no tracked bootstrap replacement in this range. | Fresh-clone agent/developer workflows remain non-reproducible. | Restore a minimal tracked `AGENTS.md`/project reference or document/bootstrap the replacement work layer. | Medium |
| L-001 | Low | Operability / Worker identity | jobs processor and process use case | Worker IDs remain independently generated random constants. | Lease/log correlation is harder. | Inject and reuse one stable process/pod worker identity. | High |
| I-001 | Info | Positive coverage | Notification use case; schema; propagation traversal | `isExisting` correctly suppresses replay SSE; schema source now models active mail states; propagation now resumes through existing terminal intermediates. | These are useful improvements and should be retained. | Preserve them while completing migration/fencing and transition-aware BFS. | High |

## Verification reviewed

| Check | Result | Notes |
|---|---|---|
| Notification SSE replay | Pass statically | Existing notification does not emit SSE. |
| Mail TypeScript schema | Pass statically | States and columns are declared. |
| Mail database migration | Fail / missing | No migration in reviewed range. |
| Mail exclusive claim | Fail | Failed claim can return another worker's `PROCESSING` row. |
| Mail completion fencing | Fail | Status update has no ownership token. |
| Mail timeout/crash safety | Fail | Expired lease can be reclaimed while old SMTP operation continues. |
| BFS replay through existing BLOCKED | Pass statically | Terminal nodes are queued. |
| BFS transition-aware traversal | Fail | Null/failed block still queues descendants. |
| Typecheck | Self-reported / plausible | No attached CI evidence. |
| Unit tests | Self-reported 333 pass | No test diff covers new runtime paths. |
| GitHub CI | Missing | No statuses or workflow runs. |

## Required regression tests

1. Apply migrations from a clean database and from the prior production schema.
2. Two concurrent first-send workers produce one SMTP call.
3. A failed `claimForProcessing` caller never sends.
4. Old claim cannot mark `SENT/FAILED` after lease expiry and re-claim.
5. SMTP operation continues beyond handler timeout while a retry starts.
6. SMTP success followed by DB update failure follows an explicit reconciliation policy.
7. FAILED delivery retry succeeds once and uses `(sourceJobId, recipient)` identity.
8. Propagation through an existing BLOCKED intermediate reaches descendants.
9. `markBlocked` returns null for PROCESSING; descendants remain unchanged.
10. Savepoint/event failure does not queue the failed edge or rollback sibling transitions.
11. Notification replay does not emit SSE.

## Recommendation

**Blocked.**

Round 7 resolves notification replay SSE and improves schema intent/BFS replay, but it does not close the two High findings. The mail change is not deployable without a migration and does not provide ownership fencing; propagation still traverses through unsuccessful transitions.

## Handoff

- **Next action:** Planning → execution for H-001 and H-002.
- **Ready for done:** No.
- **Blocking:** Yes — two High findings.
- **Review baseline:** `c3f243e39bb17fdc840cfe5ca6bf19cd1bb212dd..03f08e40035e349b05aedf5083217123182f2872`.
