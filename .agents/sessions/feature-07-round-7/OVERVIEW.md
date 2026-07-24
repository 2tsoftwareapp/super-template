# Feature 07 — Round 7 Review Overview

## Executive summary (80/20)

- **Baseline:** `c3f243e39bb17fdc840cfe5ca6bf19cd1bb212dd..03f08e40035e349b05aedf5083217123182f2872`
- **Recommendation:** `Blocked`
- **Resolved:** Notification replay no longer emits duplicate SSE.
- **Blocking:** Mail has no committed migration and no ownership fencing; BFS still traverses descendants after a failed/null direct transition.
- **Next action:** Fix H-001/H-002, add PostgreSQL migration/concurrency tests, then review Round 8.

## Developer overview

| Field | Value |
|---|---|
| Feature | Feature 07 — Background Jobs |
| Round | 7 |
| Critical | 0 |
| High | 2 |
| Medium | 6 |
| Low | 1 |
| Info | 1 |
| Ready for done | No |
| Full report | `REVIEW.md` |

## Previous finding status

| Item | Status | Summary |
|---|---|---|
| H-001 Mail state machine | Partial / blocked | Schema source updated, but migration and real claim fencing are missing. |
| H-002 BFS propagation | Partial / blocked | Existing blocked nodes resume traversal; failed/null block attempts also traverse incorrectly. |
| M-001 Notification SSE replay | Resolved | `isExisting` suppresses `emitSSE()`. |
| Atomic claim observability | Open | Job claim remains separate from attempt/event creation. |
| Stale recovery observability | Open | Open attempt/source terminal event still incomplete. |
| PostgreSQL/CI evidence | Open | No migration/test diff or GitHub checks. |

## Open findings

| ID | Severity | Summary |
|---|---|---|
| H-001 | High | Mail is not deployable without migration and lease is not an ownership fence. |
| H-002 | High | BFS queues descendants after unsuccessful direct transitions. |
| M-001 | Medium | Mail lookup/reclaim omit recipient from composite identity. |
| M-002 | Medium | Mail list filters omit PENDING/PROCESSING. |
| M-003 | Medium | Claim and attempt/event remain non-atomic. |
| M-004 | Medium | Stale recovery does not close attempt/source event. |
| M-005 | Medium | 333 tests/typecheck have no committed runtime evidence or CI. |
| M-006 | Medium | Tracked project workflow/governance bootstrap remains removed. |
| L-001 | Low | Worker identity remains duplicated/random. |

## Verification status

| Area | Status |
|---|---|
| Notification replay SSE | Pass statically |
| Mail schema declarations | Pass statically |
| Mail migration | Missing |
| Mail exclusive claim | Fail |
| Mail completion fencing | Fail |
| BFS replay through existing BLOCKED | Pass statically |
| BFS transition-aware consistency | Fail |
| Tests | Self-reported 333 pass |
| Typecheck | Self-reported clean |
| GitHub CI | Missing |

## Next action

1. Commit a forward migration for the mail enum and lease columns.
2. Add a claim token/worker ownership field and fence completion updates.
3. Return null on a failed mail claim; never treat an existing PROCESSING row as owned.
4. Use `(sourceJobId, recipient)` for delivery identity.
5. Queue a propagation node only if already terminal/blocking or newly blocked successfully.
6. Define behavior for PROCESSING dependents and isolate diagnostics outside the business transaction.
7. Add real PostgreSQL migration, race, timeout and partial-propagation tests in CI.

## Handoff

- **Owner:** Agent / Developer
- **Next step:** Planning → execution
- **Ready for done:** No
- **Blocking:** H-001, H-002
