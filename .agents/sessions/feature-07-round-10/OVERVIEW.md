# Feature 07 — Round 10 Review Overview

## Executive summary (80/20)

- **Baseline:** `29713b9c6b73f85d7ae7ed2a524e63d14f66dd7e..91c769d834b5a371eb46676eaeae482d2686a62d`
- **Recommendation:** `Blocked`
- **Resolved:** Propagation fallback diagnostics no longer execute SQL in the outer transaction. Post-SMTP database errors no longer immediately enter the FAILED branch.
- **Blocking:** SMTP success is still not durably recorded when the SENT update fails. The delivery remains `PROCESSING`; after worker completion failure/crash and lease expiry, replay can reclaim and send again.
- **Next action:** Add provider idempotency or durable sent-unconfirmed reconciliation, then add PostgreSQL crash-window tests and review Round 11.

## Developer overview

| Field | Value |
|---|---|
| Feature | Feature 07 — Background Jobs |
| Round | 10 |
| Critical | 0 |
| High | 1 |
| Medium | 5 |
| Low | 2 |
| Info | 1 |
| Ready for done | No |
| Full report | `REVIEW.md` |

## Round 9 findings status

| Item | Status | Summary |
|---|---|---|
| Post-SMTP DB failure | Partial / blocked | Immediate retry is suppressed, but no durable sent/reconciliation state prevents later stale reclaim and resend. |
| Propagation diagnostic transaction abort | Resolved | Failure diagnostics use Nest Logger instead of the outer DB transaction. |
| Migration `0030` | Retained | No regression in this range. |
| Composite identity and active status filters | Retained | No regression in this range. |

## Open findings

| ID | Severity | Summary |
|---|---|---|
| H-001 | High | SMTP accepted + SENT update failure can still lead to duplicate send after worker crash/completion failure and lease-based reclaim. |
| M-001 | Medium | SMTP rejection plus FAILED update failure can burn job attempts before the delivery lease expires. |
| M-002 | Medium | Job claim and attempt/event remain non-atomic. |
| M-003 | Medium | Exhausted stale recovery observability remains incomplete. |
| M-004 | Medium | No committed crash-window tests or GitHub CI evidence. |
| M-005 | Medium | Tracked project workflow/bootstrap guidance remains incomplete. |
| L-001 | Low | Ambiguous mail warning lacks structured reconciliation identifiers. |
| L-002 | Low | Worker identity remains inconsistent across processing components. |

## Verification status

| Area | Status |
|---|---|
| Propagation outer transaction safety | Pass statically |
| Immediate post-SMTP FAILED path | Pass statically |
| Durable SMTP acceptance proof | Fail |
| Replay after completion failure | Fail |
| Regression tests | Missing in reviewed range |
| GitHub CI | Missing |

## Next action

1. Add provider idempotency keyed by `(sourceJobId, recipient)`, or persist provider acceptance into a durable reconciliation workflow.
2. Introduce an explicit ambiguous/sent-unconfirmed state that cannot be blindly resent.
3. Test SMTP accepted → SENT update failure → worker completion crash/failure → lease expiry → replay.
4. Align delivery lease and job retry behavior for SMTP rejection plus status-update failure.
5. Add required PostgreSQL/runtime tests to CI.

## Handoff

- **Owner:** Agent / Developer
- **Next step:** Planning → execution
- **Ready for done:** No
- **Blocking:** H-001
