# Feature 07 — Round 6 · OVERVIEW

## Executive summary (80/20)

- **Review baseline:** `6289f180a5dc32fa295e535d6fe56eee69d92286..477b3c3536b6b0b561bb64f024552c6b7003a379`
- **Recommendation:** `Blocked`
- **Resolved:** Notification conflict target, quoted savepoint identifier, scoped fencing contract and terminal `BLOCKED` classification.
- **Blocking:** Mail retry SQL/state machine does not match the database schema and is unsafe under concurrency; propagation is not idempotent after a partial edge failure.
- **Next action:** Fix two High findings, add PostgreSQL concurrency/crash-window tests, then run Round 7 review.

## Developer overview

| Field | Value |
|---|---|
| Feature | Feature 07 — Background Jobs |
| Review round | 6 |
| Base | `6289f180a5dc32fa295e535d6fe56eee69d92286` |
| Head reviewed | `477b3c3536b6b0b561bb64f024552c6b7003a379` |
| Recommendation | `Blocked` |
| Critical | 0 |
| High | 2 |
| Medium | 6 |
| Low | 1 |
| Info | 1 |
| Review artifact | `REVIEW.md` |
| Ready for done | No |

## Round 5 findings status

| Item | Status | Summary |
|---|---|---|
| Notification `ON CONFLICT` target | Resolved statically | Target now matches `(sourceBackgroundJobId, userId)` partial index. |
| Savepoint UUID syntax | Resolved statically | Savepoint identifier is safely quoted. |
| Propagation error isolation | Partial / blocked | Failed edges still emit/queue, and existing `BLOCKED` intermediates stop descendant traversal. |
| Mail retry | Blocked | Raw SQL uses missing enum states/column and claim/reclaim lifecycle is concurrency-unsafe. |
| `BLOCKED` lifecycle | Resolved statically | Restored as terminal; worker continues to claim only `PENDING`. |
| Broken spec imports | Resolved statically | Audit/files specs now use `@platform` aliases. |

## Open findings

| ID | Severity | Summary | Status |
|---|---|---|---|
| H-001 | High | Mail state machine is incompatible with schema and can duplicate/lose sends. | Open |
| H-002 | High | Propagation is inconsistent and non-idempotent after partial failure. | Open |
| M-001 | Medium | Notification replay re-emits SSE for an existing row. | Open |
| M-002 | Medium | Job claim and attempt/claimed event remain non-atomic. | Open |
| M-003 | Medium | Stale exhaustion does not close attempt or record source event. | Open |
| M-004 | Medium | No PostgreSQL integration or CI evidence. | Open |
| M-005 | Medium | Execution evidence contains stale SHA/range and outdated status. | Open |
| M-006 | Medium | Cleanup removed tracked project rules/history without a tracked replacement. | Open |
| L-001 | Low | Worker identity remains duplicated and random. | Open |

## Verification status

| Area | Status |
|---|---|
| Scope contract | Pass statically |
| Worker fencing | Pass statically |
| Notification conflict SQL | Pass statically |
| Notification full replay | Partial — duplicate SSE remains |
| Savepoint quoting | Pass statically |
| Propagation BFS replay/isolation | Fail |
| Mail schema compatibility | Fail |
| Mail concurrency/crash safety | Fail |
| `BLOCKED` lifecycle | Pass statically |
| Typecheck | Plausible, no attached CI |
| PostgreSQL integration | Not run |
| GitHub CI | Missing |

## Next action

1. Add real mail delivery states/lease fields through schema + migration.
2. Implement atomic `PROCESSING` claim/fencing; do not insert first attempts as retryable `FAILED`.
3. Reclaim only `FAILED` or expired `PROCESSING`; make crash recovery explicit.
4. Make propagation replay through already-`BLOCKED` nodes.
5. Do not queue descendants or emit a success-like dependency event when the direct edge rollback leaves its node unblocked.
6. Prevent notification SSE re-emission on idempotent replay.
7. Add PostgreSQL integration tests and CI for all concurrency/crash paths.
8. Refresh `EXECUTION.md` with the actual commit range and command outputs.

## Handoff

- **Owner:** Agent / Developer
- **Next step:** Planning → execution
- **Ready for done:** No
- **Blocking:** Yes — H-001 and H-002
