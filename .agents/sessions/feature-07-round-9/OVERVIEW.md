# Feature 07 — Round 9 Review Overview

## Executive summary (80/20)

- **Baseline:** `328888bc15e310315811c9e05cd3cdf1fb348818..186a6a331a62a97234949884050155d1d9bce13d`
- **Recommendation:** `Blocked`
- **Resolved:** Migration lineage, failed-claim fallback, DB claim-token fencing, composite recipient lookup, active delivery status filters and rollback-aware `marked` assignment.
- **Blocking:** A successful SMTP send can still enter FAILED/retry after a non-stale DB finalization error; fallback propagation diagnostics can still abort the outer PostgreSQL transaction.
- **Next action:** Add explicit post-SMTP reconciliation/no-resend behavior and isolate diagnostics outside the business transaction, then add PostgreSQL runtime tests and review Round 10.

## Developer overview

| Field | Value |
|---|---|
| Feature | Feature 07 — Background Jobs |
| Round | 9 |
| Critical | 0 |
| High | 2 |
| Medium | 5 |
| Low | 2 |
| Info | 1 |
| Ready for done | No |
| Full report | `REVIEW.md` |

## Round 8 findings status

| Item | Status | Summary |
|---|---|---|
| Migration lineage | Resolved statically | Bad generated baseline removed; forward-only `0030` added above custom migrator baseline. |
| Failed claim fallback | Resolved | No-row claim returns null. |
| DB status fencing | Resolved statically | Final update requires claim token + PROCESSING. |
| External SMTP side effect | Blocked | Non-stale DB failure after successful send still triggers FAILED/retry. |
| Composite identity | Resolved for send path | Lookup and reclaim receive recipient. |
| BFS rollback boolean | Resolved | Savepoint return value controls queue. |
| Diagnostic isolation | Blocked | Fallback SQL runs in outer transaction; catch cannot clear PG aborted state. |
| Notification SSE replay | Resolved | Existing replay remains deduplicated. |

## Open findings

| ID | Severity | Summary |
|---|---|---|
| H-001 | High | SMTP success followed by non-stale DB failure can mark FAILED/retry and duplicate email. |
| H-002 | High | Fallback diagnostic SQL can abort and roll back the outer business transaction. |
| M-001 | Medium | Forward migration lacks upgrade/fresh-bootstrap integration evidence. |
| M-002 | Medium | Job claim and attempt/event remain non-atomic. |
| M-003 | Medium | Stale recovery does not close active attempt/source event. |
| M-004 | Medium | Stale ownership uses brittle error-message matching. |
| M-005 | Medium | No runtime regression test diff or GitHub CI evidence. |
| L-001 | Low | Unused `lt` import remains. |
| L-002 | Low | Worker identity remains duplicated/random. |

## Verification status

| Area | Status |
|---|---|
| Forward migration shape | Pass statically |
| Migration runtime upgrade/bootstrap | Not demonstrated |
| Failed-claim behavior | Pass statically |
| Claim-token DB fencing | Pass statically |
| Composite recipient identity | Pass for current path |
| Post-SMTP DB failure | Fail |
| Provider-side duplicate prevention/reconciliation | Fail |
| BFS savepoint return guard | Pass statically |
| Fallback diagnostic transaction isolation | Fail |
| Tests/typecheck | Self-reported |
| GitHub CI | Missing |

## Next action

1. Track `smtpAccepted` separately from pre-send failures.
2. Never enter normal FAILED/retry after SMTP acceptance.
3. Persist an explicit reconciliation state/provider message ID or use provider idempotency keys.
4. Replace stale-error string matching with a typed error/code.
5. Move fallback propagation diagnostics to logger/outbox/separate transaction or another rollbackable savepoint.
6. Add custom-migrator upgrade/bootstrap tests.
7. Add PostgreSQL post-SMTP, stale-lease and diagnostic-failure regression tests in CI.

## Handoff

- **Owner:** Agent / Developer
- **Next step:** Planning → execution
- **Ready for done:** No
- **Blocking:** H-001, H-002
