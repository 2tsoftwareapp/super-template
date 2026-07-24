# Review: Feature 07 — Background Jobs (Round 9)

## Executive summary (80/20)

- **Recommendation:** `Blocked`
- **Resolved:** Unsafe `0000/0001` migrations were removed and replaced with forward-only `0030`; failed mail claims return null; claim-token DB fencing remains intact; composite recipient lookup and active delivery status filters are fixed; BFS now assigns `marked=true` only after the savepoint completes successfully.
- **Blocking findings:** A successful SMTP send followed by a non-stale DB update failure is still marked/retried as a failure and can send duplicate email. Propagation diagnostics still execute directly in the outer PostgreSQL transaction; swallowing a SQL error in JavaScript does not clear PostgreSQL's aborted-transaction state.
- **Verification:** Static review of `328888bc15e310315811c9e05cd3cdf1fb348818..186a6a331a62a97234949884050155d1d9bce13d`. The range changes migration and production files but no regression-test file. No GitHub status or workflow run is attached.
- **Next action:** Fix H-001/H-002, add real PostgreSQL migration/failure/concurrency tests, then perform Round 10.

## Developer overview

| Field | Value |
|---|---|
| Feature | Feature 07 — Background Jobs |
| Review round | 9 |
| Base | `328888bc15e310315811c9e05cd3cdf1fb348818` |
| Head | `186a6a331a62a97234949884050155d1d9bce13d` |
| Recommendation | `Blocked` |
| Critical | 0 |
| High | 2 |
| Medium | 5 |
| Low | 2 |
| Info | 1 |
| Ready for done | No |

## Scope reviewed

- Commit `186a6a331a62a97234949884050155d1d9bce13d`.
- Forward migration `0030_mail_delivery_processing_fencing.sql` and custom migration ordering/backfill behavior.
- Mail create/lookup/claim/reclaim/send/finalization flow.
- Claim-token ownership fencing and external SMTP side-effect behavior.
- Dependency propagation savepoint return value and diagnostic error isolation.
- Existing unresolved job observability/lifecycle findings, test diff and CI evidence.

## Round 8 status

| Round 8 item | Round 9 status | Notes |
|---|---|---|
| C-001 migration lineage | Resolved statically | Generated full baseline files removed; forward-only `0030` is above the backfill baseline and uses idempotent ALTER statements. |
| H-001 external SMTP side effect | Partial / blocked | Stale DB fence after send is swallowed, but every non-stale DB failure after SMTP success still triggers FAILED/retry behavior. |
| H-002 rollback-aware BFS | Partial / blocked | Savepoint return value fixes the in-memory `marked` leak; fallback diagnostic SQL can still abort the outer PostgreSQL transaction. |
| M-001 composite mail identity | Resolved for current use case | Existing lookup now receives recipient. Port still permits omission. |
| M-002 active status filtering | Resolved statically | Adapter includes PENDING/PROCESSING. |
| Notification SSE replay | Resolved | Existing replay remains deduplicated. |

## Findings

| ID | Severity | Category | Location | Evidence | Impact | Recommendation | Confidence |
|---|---|---|---|---|---|---|---|
| H-001 | High | Mail reliability / Post-SMTP ambiguity / Duplicate delivery | `send-mail-template.use-case.ts:99-148`; `mail-deliveries.repository.ts:150-190` | After `mailer.send()` succeeds, `updateStatus(SENT)` can throw a non-stale DB error. The inner catch rethrows it; the outer catch then attempts `updateStatus(FAILED)` and finally throws. If FAILED is persisted, the retry reclaims and sends again. If FAILED cannot be persisted, the row remains PROCESSING and is later reclaimed after lease expiry, also sending again. Swallowing only errors whose message contains `Stale worker` does not solve the SMTP-success/DB-failure window. | A customer can receive duplicate email even though SMTP succeeded once. The delivery row may incorrectly record FAILED for an already-sent message. DB claim tokens fence state updates but cannot undo external mail delivery. | Track whether SMTP completed. Once it completed, never execute the normal FAILED/retry branch. Persist an explicit `SENT_UNCONFIRMED`/reconciliation record or provider message ID, use a provider idempotency key where available, and complete reconciliation without re-sending. Replace string matching with a typed stale-claim error. Add SMTP-success + DB-failure and lease-expiry race tests. | High |
| H-002 | High | PostgreSQL transaction isolation / Dependency propagation | `propagation.service.ts:73-85`; transaction service savepoint behavior | The primary transition/event callback is correctly protected by a savepoint. On failure, however, the catch calls `recordEvent()` again directly with the outer transaction executor. If that SQL statement fails, PostgreSQL marks the outer transaction aborted. Catching and swallowing the JavaScript error does not restore transaction usability; subsequent commands or COMMIT fail and roll back cancel/fail/stale-recovery work. | A diagnostic event failure can still roll back the business transaction the code claims to protect. This is especially likely when the first event failed for a repeatable constraint/schema reason and the same repository is called again. | Do not write fallback diagnostics directly in the business transaction. Use the application logger, an independent post-commit transaction/outbox, or wrap the fallback diagnostic in its own savepoint and roll back to it on error. Add a real PostgreSQL test where fallback `recordEvent` fails and assert the outer status transition commits. | High |
| M-001 | Medium | Migration verification | `0030_mail_delivery_processing_fencing.sql`; custom migrator | `0030` is structurally correct and above the baseline index, but the reviewed range contains no test proving upgrade from Round 8/Round 7 schema, initialized schema with empty ledger, or fresh bootstrap. | A syntax/version/lineage mismatch can still surface only during deployment despite static correctness. | Add migration integration tests using the project migrator for prior-schema upgrade and empty-database bootstrap; assert enum values and all three columns. | High |
| M-002 | Medium | Atomic observability | `process-jobs.use-case.ts` | Job claiming still commits separately from attempt creation and the `claimed` event. | A crash can leave a PROCESSING job without its attempt or claimed timeline event. | Make claim + attempt + claimed event atomic or use a transactional outbox/claim record. | High |
| M-003 | Medium | Stale recovery observability | `jobs.processor.ts`; stale-recovery flow | Exhausted stale jobs still do not close the active attempt or record a source `stale_exhausted` terminal event. | Attempt metrics and operator timelines remain incomplete/inconsistent. | Finalize the active attempt and source terminal event atomically with stale failure. | Medium |
| M-004 | Medium | Error contracts | Mail repository/use case | Stale ownership is identified by matching the text `Stale worker` in a generic Error message. | Refactors/localization/message changes can silently break the no-retry branch; unrelated errors could be misclassified. | Introduce a typed `StaleMailDeliveryClaimError` or stable error code and branch on type/code. | High |
| M-005 | Medium | Verification / CI | Commit file list; GitHub status/workflow | No test file changed for migration, post-SMTP failure, lease races or fallback transaction failure. GitHub exposes no status/workflow run for HEAD. | Existing unit tests and typecheck can stay green while runtime SQL and external-side-effect defects remain. | Add PostgreSQL integration/race tests and require check/typecheck/tests/migration tests in CI. Store exact command output in an execution artifact. | High |
| L-001 | Low | Code quality / Lint | `mail-deliveries.repository.ts` imports | `lt` remains imported but unused. | May fail strict lint and adds noise. | Remove the unused import and run the full lint/check command. | High |
| L-002 | Low | Operability / Worker identity | Jobs process and recovery workers | Worker identities remain separate random module constants. | Logs and lease incidents are harder to correlate within one process/pod. | Inject and reuse one stable process/pod worker identity. | High |
| I-001 | Info | Positive coverage | Migration, mail repository and propagation service | The forward-only migration, null-on-failed-claim behavior, composite recipient lookup, claim-token DB fencing, active-state filtering and savepoint-return BFS guard are meaningful improvements. | They close the previous migration critical and several deterministic race/state bugs. | Retain these changes while fixing post-SMTP reconciliation and true diagnostic isolation. | High |

## Verification reviewed

| Check | Result | Notes |
|---|---|---|
| Migration numbering/lineage | Pass statically | `0030` is above baseline index 16; bad generated baseline files removed. |
| Migration content | Pass statically | Adds enum states and lease/update/token columns with IF NOT EXISTS. |
| Failed mail claim | Pass statically | Returns null; another worker is not treated as owner. |
| DB completion fencing | Pass statically | Requires id + claimToken + PROCESSING. |
| Composite mail lookup/reclaim | Pass for current path | Recipient passed by send use case. |
| Post-SMTP DB failure | Fail | Non-stale DB error reaches FAILED/retry flow after email was sent. |
| External SMTP duplicate prevention | Fail | No provider idempotency/reconciliation state. |
| BFS savepoint result | Pass statically | `marked` is assigned only after callback success. |
| BFS fallback diagnostic isolation | Fail | Direct SQL in outer transaction can abort it despite catch. |
| Unit tests/typecheck | Self-reported | No attached status/output artifact. |
| GitHub CI | Missing | No statuses or workflow runs. |

## Required regression tests

1. Upgrade exact prior schema through custom migrator and assert `0030` is applied once.
2. Fresh database applies all migrations successfully.
3. SMTP succeeds, `updateStatus(SENT)` has a transient DB error: no second SMTP send.
4. SMTP succeeds, claim is stale-fenced: reconciliation is durable and no re-send occurs.
5. SMTP fails before external acceptance: FAILED/retry sends exactly once on the successful attempt.
6. Two claimers receive one claim token; stale token cannot finalize.
7. `recordEvent()` fails inside the transition savepoint: parent remains unchanged and descendants are not traversed.
8. Fallback diagnostic SQL fails: outer cancel/fail transition still commits.
9. Existing BLOCKED intermediate replay reaches descendants.
10. Multi-recipient source job always uses `(sourceJobId, recipient)`.

## Recommendation

**Blocked.**

Round 9 resolves the migration critical and the in-memory BFS rollback leak, but Feature 07 is not ready for done. A successful SMTP side effect can still be converted into FAILED/retry behavior, and a fallback diagnostic SQL failure can still poison and roll back the outer PostgreSQL transaction.

## Handoff

- **Next action:** Planning → execution for H-001 and H-002.
- **Ready for done:** No.
- **Blocking:** Two High findings.
- **Review baseline:** `328888bc15e310315811c9e05cd3cdf1fb348818..186a6a331a62a97234949884050155d1d9bce13d`.
