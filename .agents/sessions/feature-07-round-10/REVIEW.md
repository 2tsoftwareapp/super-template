# Review: Feature 07 — Background Jobs (Round 10)

## Executive summary (80/20)

- **Recommendation:** `Blocked`
- **Resolved:** Propagation fallback diagnostics now use the application logger instead of executing SQL in the outer PostgreSQL transaction. Post-SMTP database errors no longer immediately enter the FAILED branch inside the mail use case.
- **Blocking finding:** SMTP success is still not durably recorded when `updateStatus(SENT)` fails. Returning from the use case only suppresses the immediate throw; the delivery remains `PROCESSING`, its lease expires, and a job crash/completion failure/replay can reclaim and send the same email again.
- **Verification:** Static review of `29713b9c6b73f85d7ae7ed2a524e63d14f66dd7e..91c769d834b5a371eb46676eaeae482d2686a62d`. The range modifies two production files and adds no regression tests. GitHub has no attached status or workflow run.
- **Next action:** Implement durable provider idempotency/reconciliation for the post-SMTP/pre-DB-finalization window, add PostgreSQL + worker crash-window tests, then perform Round 11.

## Developer overview

| Field | Value |
|---|---|
| Feature | Feature 07 — Background Jobs |
| Review round | 10 |
| Base | `29713b9c6b73f85d7ae7ed2a524e63d14f66dd7e` |
| Head | `91c769d834b5a371eb46676eaeae482d2686a62d` |
| Recommendation | `Blocked` |
| Critical | 0 |
| High | 1 |
| Medium | 5 |
| Low | 2 |
| Info | 1 |
| Ready for done | No |

## Scope reviewed

- Commit `91c769d834b5a371eb46676eaeae482d2686a62d`.
- Mail behavior after SMTP acceptance and database finalization failure.
- Interaction with job handler timeout, `markCompleted`, retry and stale delivery reclaim.
- Propagation savepoint catch and PostgreSQL transaction-abort semantics.
- Previous Round 9 residual findings, regression-test diff and CI evidence.

## Round 9 status

| Round 9 item | Round 10 status | Notes |
|---|---|---|
| H-001 Post-SMTP database failure | Partial / blocked | Immediate throw is suppressed, but no durable sent/reconciliation state prevents later reclaim and resend. |
| H-002 Propagation diagnostic aborts outer transaction | Resolved statically | Catch now logs through Nest Logger and does not execute SQL on the outer transaction. |
| Forward migration `0030` | Retained | No migration changes in this range. |
| Composite mail identity | Retained | No regression observed. |
| Active delivery filters | Retained | No regression observed. |

## Findings

| ID | Severity | Category | Location | Evidence | Impact | Recommendation | Confidence |
|---|---|---|---|---|---|---|---|
| H-001 | High | Mail reliability / External side-effect reconciliation | `send-mail-template.use-case.ts:101-145`; `mail-deliveries.repository.ts:102-148`; `process-jobs.use-case.ts:124-186` | After `mailer.send()` resolves, every `updateStatus(SENT)` error is logged and the use case returns. If the update did not commit, the durable row remains `PROCESSING` with an expiring lease. The parent worker still has a separate `markCompleted()` transaction after the handler returns. A crash or failure there causes the job to remain/re-enter retry processing. Once the mail lease expires, `reclaimForRetry()` moves the same row back to `PENDING` and the next attempt sends again. Swallowing the DB error therefore suppresses only the immediate exception; it does not establish at-most-once delivery. | Duplicate customer email remains possible in the exact SMTP-success / DB-failure / worker-crash window. Conversely, if the job completes, the row may remain indefinitely `PROCESSING`, making the operational read model incorrect. | Use a provider idempotency key tied to `(sourceJobId, recipient)` where available. Otherwise implement a durable outbox/provider-message reconciliation model with an explicit `SENT_UNCONFIRMED`/provider-accepted state and a reconciler that never blindly resends. Persist provider message ID/acceptance metadata. Test SMTP success followed by DB failure plus process crash before `markCompleted`. | High |
| M-001 | Medium | Mail retry progression | `send-mail-template.use-case.ts:82-98`; `reclaimForRetry()` lease check | When SMTP fails and the FAILED status update also fails, the job retries before the 5-minute delivery lease commonly expires. Existing `PROCESSING` cannot be reclaimed, so attempts can fail with “already attempted but not confirmed sent” and consume job retries before the delivery becomes reclaimable. | Legitimate transient SMTP/DB failures can exhaust attempts without another send attempt. | Align job retry scheduling with the delivery lease, release/shorten the lease after confirmed SMTP rejection through a reliable path, or have the mail subsystem own retries independently. | Medium |
| M-002 | Medium | Atomic job observability | `process-jobs.use-case.ts:42-93` | Job claim still commits separately from attempt creation and the claimed event. | Crash window leaves a PROCESSING job without an attempt/event. | Make claim + attempt + claimed event atomic or use a transactional outbox. | High |
| M-003 | Medium | Stale recovery observability | Jobs stale recovery flow | Exhausted stale jobs still do not consistently close the active attempt and record a source terminal stale event. | Metrics and operator timelines can diverge from job state. | Finalize attempt and source event atomically with stale failure. | Medium |
| M-004 | Medium | Verification / Regression coverage | Commit file list; GitHub status/workflow | The range changes only two production files and contains no test file. GitHub reports no status or workflow run. The remaining defect requires a multi-step crash-window test, not typecheck/unit-only confidence. | Runtime duplicate-send behavior can remain green in the existing suite. | Add real PostgreSQL and worker orchestration tests for SMTP accepted → SENT update fails → worker completion fails/crashes → lease expires → replay. Require CI evidence. | High |
| M-005 | Medium | Repository governance / Reproducibility | Current repository baseline | Tracked project workflow/reference files removed in earlier cleanup remain without a clear tracked bootstrap replacement. | Fresh-clone review and execution behavior remain difficult to reproduce. | Restore minimal tracked project guidance or document/bootstrap the replacement work layer. | Medium |
| L-001 | Low | Operability / Reconciliation visibility | Post-SMTP catch logger | The warning contains no delivery id, source job id, recipient-safe correlation id, claim token hash or structured metadata. | Operators cannot reliably locate and reconcile the ambiguous delivery row. | Log structured non-sensitive identifiers such as delivery id, source job id and claim generation/attempt. | High |
| L-002 | Low | Operability / Worker identity | Job processor/use case worker identifiers | Worker identity remains independently generated and not shared consistently across processing/recovery components. | Lease and failure logs are harder to correlate. | Inject one stable process/pod worker identity. | High |
| I-001 | Info | Positive coverage | Propagation catch; mail catch structure | Replacing transactional diagnostic SQL with application logging correctly prevents PostgreSQL aborted-transaction leakage. The inner post-SMTP catch now avoids incorrectly marking the delivery FAILED immediately. | These are meaningful improvements and should be retained. | Preserve them while adding a durable external-side-effect reconciliation strategy. | High |

## Verification reviewed

| Check | Result | Notes |
|---|---|---|
| Propagation catch transaction safety | Pass statically | No SQL is executed from the failure diagnostic catch. |
| Immediate post-SMTP FAILED transition | Pass statically | DB finalization error returns instead of entering FAILED branch. |
| Durable SMTP acceptance record | Fail | A failed SENT update leaves no durable proof of acceptance. |
| Replay after handler completion failure | Fail | Stale PROCESSING delivery can later be reclaimed and sent again. |
| SMTP rejected + FAILED update failure | Partial | Job retries, but active lease can block useful retry attempts. |
| Typecheck/tests | Not evidenced in commit | No regression-test diff or execution artifact in range. |
| GitHub CI | Missing | No statuses or workflow runs. |

## Required regression tests

1. SMTP accepts, `updateStatus(SENT)` fails before commit, and the worker crashes before `markCompleted`; replay must not issue a second provider send.
2. SMTP accepts, database response is ambiguous (commit may or may not have happened); reconciliation resolves without resend.
3. SMTP accepts, stale token is rejected after another claim; only one external send is possible through provider idempotency.
4. SMTP rejects and FAILED update fails; retries do not exhaust attempts while the delivery lease is still active.
5. Propagation `recordEvent` fails inside savepoint; outer transaction commits source transition and siblings while descendants of the rolled-back edge remain unchanged.
6. Application logger path contains sufficient structured correlation data without sensitive recipient exposure.

## Recommendation

**Blocked.**

Round 10 closes the propagation transaction-abort defect and prevents an immediate post-SMTP DB error from being treated as an SMTP failure. It does not close the fundamental external-side-effect window: returning without a durable sent/reconciliation record allows stale reclaim and duplicate send after worker completion failure or replay.

## Handoff

- **Next action:** Planning → execution for H-001 plus runtime regression tests.
- **Ready for done:** No.
- **Blocking:** One High finding.
- **Review baseline:** `29713b9c6b73f85d7ae7ed2a524e63d14f66dd7e..91c769d834b5a371eb46676eaeae482d2686a62d`.
