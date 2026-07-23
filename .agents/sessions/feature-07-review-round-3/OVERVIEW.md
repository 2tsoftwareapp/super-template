# Overview: Feature 07 — Background Jobs Review Round 3

## Executive summary (80/20)

- **Status:** Review completed trên baseline `cee1d1292f2a66acb36b3d47eec4b260160a497c`.
- **Recommendation:** `Needs fix`
- **Blocking findings:** Fencing result bị bỏ qua; mail/notification idempotency chưa ngăn duplicate; dependency propagation không bao phủ đầy đủ terminal paths.
- **Verification:** Không có CI status; E2E source còn signature cũ và test redaction sai mục tiêu.
- **Next action:** Quay lại `planning` và xử lý H-001 → H-004 trước review round 4.

## Developer overview

| Field | Value |
|---|---|
| Feature | Feature 07 — Background Jobs |
| Baseline | `cee1d1292f2a66acb36b3d47eec4b260160a497c` |
| Review round | 3 |
| Recommendation | `Needs fix` |
| Critical | 0 |
| High | 4 |
| Medium | 3 |
| Low | 2 |
| Info | 1 |
| Blocking status | H-001, H-002, H-003, H-004 |
| Review artifact | `REVIEW.md` |
| Next skill | `planning` |

## Scope

- Mandatory tenant/platform job scope.
- Claim, lease, fencing, retry và stale recovery.
- Job attempt/event observability.
- Mail và notification handler idempotency.
- Dependency graph locking, status và failure propagation.
- Payload redaction, idempotency indexes và E2E evidence.

## Open findings

| ID | Severity | Summary | Status |
|---|---|---|---|
| H-001 | High | Application bỏ qua `null` từ fenced transitions nhưng vẫn finish attempt/event/propagate. | Open |
| H-002 | High | `notification.send` không populate durable source identity; retry tạo duplicate. | Open |
| H-003 | High | Mail unique index chạy sau SMTP nên không ngăn duplicate external send. | Open |
| H-004 | High | Propagation bỏ sót cancel/no-handler/stale/transitive paths và swallow lỗi. | Open |
| M-001 | Medium | `listDependents`/`markBlocked` không scope; event dùng parent tenant. | Open |
| M-002 | Medium | Claim row và claimed attempt/event không atomic. | Open |
| M-003 | Medium | E2E gọi signature cũ; redaction test không kiểm tra list response. | Open |
| L-001 | Low | Worker identity tạo ngẫu nhiên ở hai nơi, recovery log khó correlate. | Open |
| L-002 | Low | Worker flow thiếu comment convention và có stale comment. | Open |
| I-001 | Info | Không có CI/session execution evidence cho self-reported verification. | Open |

## Requirement status

| Group | Status |
|---|---|
| Scope enforcement | Partial |
| Fencing | Partial / ineffective at application boundary |
| Stale recovery | Partial |
| Mail idempotency | Failed |
| Notification idempotency | Failed |
| Dependency propagation | Failed / incomplete |
| Cycle locking | Covered statically |
| Payload redaction | Implemented, not correctly tested |
| Atomic observability | Partial |
| Unit/E2E/CI evidence | Insufficient |

## Next action

1. Enforce fenced transition result before attempt/event/propagation.
2. Implement durable idempotency identity for notification background jobs.
3. Replace mail insert-after-SMTP with durable delivery claim/state machine.
4. Centralize terminal transition propagation for failed/cancelled/blocked/no-handler/stale paths and transitive chains.
5. Scope dependent queries/updates and use dependent tenant for events.
6. Make claim + attempt + claimed event atomic.
7. Repair E2E tests and add concurrency/crash-window coverage.
8. Run typecheck, unit, PostgreSQL E2E and CI before round 4.

## Handoff

- **Owner:** Agent / Developer
- **Next skill:** `planning`
- **Ready for done/PR:** No
- **Blocking:** Yes — four High findings
