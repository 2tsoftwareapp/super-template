# Overview: Feature 07 — Background Jobs Review Round 4

## Executive summary (80/20)

- **Status:** Review completed trên baseline `bbd997477cbe5490659e9b343bc6c1b3598f8e2c`.
- **Recommendation:** `Blocked`
- **Build blocker:** Port, repository implementation và propagation call sites không cùng signature; claim `typecheck clean` không khớp source.
- **Correctness blockers:** Fencing chưa đầy đủ; mail retry có thể mất email; notification replay có thể làm job fail sau khi side effect đã commit; propagation chưa transitive/isolation cho mọi terminal path.
- **Next action:** Sửa H-001 → H-005, thêm concurrency/crash-window/PostgreSQL E2E và review round 5.

## Developer overview

| Field | Value |
|---|---|
| Feature | Feature 07 — Background Jobs |
| Baseline | `bbd997477cbe5490659e9b343bc6c1b3598f8e2c` |
| Review round | 4 |
| Recommendation | `Blocked` |
| Critical | 0 |
| High | 5 |
| Medium | 3 |
| Low | 1 |
| Info | 1 |
| Blocking status | H-001, H-002, H-003, H-004, H-005 |
| Review artifact | `REVIEW.md` |
| Next skill | `planning` |

## Previous High status

| Round 3 finding | Round 4 status | Summary |
|---|---|---|
| H-001 Worker fencing | Partial / still open | Success path checks fence, but no-handler ignores it and failure path finishes attempt before fence result. |
| H-002 Notification idempotency | Partial / still open | Durable identity/index exists, but replay throws unique violation instead of succeeding idempotently. |
| H-003 Mail idempotency | Partial / still open | Duplicate SMTP reduced, but transient failure/crash can permanently suppress unsent mail and complete the job. |
| H-004 Dependency propagation | Partial / still open | More terminal paths covered, but cancel/stale only direct; same-transaction catch is not true error isolation. |

## Open findings

| ID | Severity | Summary | Status |
|---|---|---|---|
| H-001 | High | Port/adapter/call-site signature mismatch breaks typecheck and scope enforcement. | Open |
| H-002 | High | Stale worker can still finish attempt/event in no-handler and failure paths. | Open |
| H-003 | High | Mail preinsert-as-FAILED makes retries silently skip unsent mail. | Open |
| H-004 | High | Notification unique conflict is treated as error, not idempotent replay success. | Open |
| H-005 | High | Propagation is incomplete across terminal paths and error isolation is invalid without savepoints. | Open |
| M-001 | Medium | Claim and attempt/claimed event remain non-atomic. | Open |
| M-002 | Medium | Stale exhausted source attempt/event is not finalized. | Open |
| M-003 | Medium | No CI/test artifact; no test files changed for the four fixes. | Open |
| L-001 | Low | Worker identity remains random and duplicated across modules. | Open |
| I-001 | Info | Durable notification source schema and some direct propagation are useful partial improvements. | Noted |

## Verification status

| Area | Status |
|---|---|
| Static TypeScript contract | Failed |
| Success-path fencing | Partial pass |
| Retry/fail/no-handler fencing | Failed |
| Mail duplicate prevention | Narrow pass |
| Mail retry correctness | Failed |
| Notification durable identity | Implemented |
| Notification idempotent replay | Failed |
| Direct dependency propagation | Partial |
| Transitive propagation for all terminal paths | Failed |
| Error isolation | Failed |
| Migration static review | Pass |
| Unit test evidence | Insufficient |
| CI status/workflow | Missing |

## Next action

1. Align `JobsRepositoryPort`, `JobsRepository` and all call sites with mandatory `JobScope`.
2. Move every `finishAttempt`/event/propagation behind successful fenced transition, including no-handler.
3. Replace mail `FAILED` preinsert shortcut with durable delivery claim/state machine and valid retry policy.
4. Implement notification conflict-as-existing semantics and prevent duplicate dispatch.
5. Centralize scoped transitive propagation for failed/cancelled/no-handler/stale paths.
6. Use savepoints, separate transactions or outbox for genuine per-edge error isolation.
7. Close source attempts/events during stale exhaustion.
8. Add regression tests and run root typecheck, unit, PostgreSQL E2E and migrations in CI.

## Handoff

- **Owner:** Agent / Developer
- **Next skill:** `planning`
- **Ready for done/PR:** No
- **Blocking:** Yes — five High findings
