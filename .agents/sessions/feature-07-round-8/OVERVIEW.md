# Feature 07 — Round 8 Review Overview

## Executive summary (80/20)

- **Baseline:** `fb08da0c83e08dd49ae980031d547093f6960736..449bf1bf83e6dbf75f356e469201766db44947e8`
- **Recommendation:** `Blocked`
- **Critical:** Migration `0000/0001` conflicts with the custom migrator's filename ordering and baseline backfill logic.
- **High:** Claim token fences DB state but not stale SMTP side effects; BFS still queues after savepoint rollback because `marked` remains true in memory.
- **Resolved:** Failed claim returns null, completion uses claim token, reclaim includes recipient, notification SSE remains deduplicated.
- **Next action:** Replace the migration with a forward-only migration above the current highest index, fix rollback-aware BFS and define SMTP reconciliation/idempotency; then review Round 9.

## Developer overview

| Field | Value |
|---|---|
| Feature | Feature 07 — Background Jobs |
| Round | 8 |
| Critical | 1 |
| High | 2 |
| Medium | 6 |
| Low | 1 |
| Info | 1 |
| Ready for done | No |
| Full report | `REVIEW.md` |

## Round 7 findings status

| Item | Status | Summary |
|---|---|---|
| Mail migration | Blocked / regression | New full baseline `0000` and `0001` are unsafe in the existing migration lineage. |
| Failed claim fallback | Resolved | No-row UPDATE returns null. |
| DB status fencing | Resolved statically | Final update requires claim token + PROCESSING. |
| SMTP external-effect fencing | Open | Old sender can still send after lease loss. |
| Composite identity | Partial | Reclaim includes recipient; initial lookup still omits it. |
| BFS queue guard | Partial / blocked | Null transition is guarded, but event failure rolls back DB while `marked=true` remains. |
| Notification SSE replay | Resolved | Existing replay does not emit SSE. |

## Open findings

| ID | Severity | Summary |
|---|---|---|
| C-001 | Critical | Migration numbering/baseline strategy can skip DDL or fail on duplicate schema objects. |
| H-001 | High | Claim token cannot prevent duplicate SMTP after timeout/lease expiry. |
| H-002 | High | Savepoint rollback does not roll back in-memory `marked`, so descendants may still be traversed. |
| M-001 | Medium | Existing mail lookup omits recipient from composite identity. |
| M-002 | Medium | Delivery list filters omit PENDING/PROCESSING. |
| M-003 | Medium | Job claim and attempt/event are non-atomic. |
| M-004 | Medium | Stale recovery does not close attempt/source event. |
| M-005 | Medium | No migration/concurrency test diff or CI evidence. |
| M-006 | Medium | Tracked workflow/bootstrap guidance remains removed. |
| L-001 | Low | Worker identity remains duplicated/random. |

## Verification status

| Area | Status |
|---|---|
| Failed claim behavior | Pass statically |
| Claim-token DB fencing | Pass statically |
| Reclaim recipient identity | Pass statically |
| Forward migration upgrade | Fail |
| Fresh DB bootstrap | Fail / unverified |
| External SMTP fencing | Fail |
| BFS null transition | Pass statically |
| BFS savepoint rollback | Fail |
| Tests | Self-reported 333 pass |
| Typecheck | Self-reported clean |
| GitHub CI | Missing |

## Next action

1. Remove the generated full-schema `0000` from the established migration stream.
2. Add one forward-only migration above the current highest index for enum values and mail columns/token.
3. Test the custom migrator against prior production schema, empty-ledger initialized schema and fresh DB.
4. Assign `marked` only after the savepoint completes successfully.
5. Add SMTP provider idempotency/reconciliation or another explicit external-side-effect policy.
6. Use `(sourceJobId, recipient)` in every lookup and retry path.
7. Add PostgreSQL migration, concurrency, timeout and rollback regression tests in CI.

## Handoff

- **Owner:** Agent / Developer
- **Next step:** Planning → execution
- **Ready for done:** No
- **Blocking:** C-001, H-001, H-002
