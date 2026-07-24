# Overview: Feature 07 — Background Jobs Review Round 5

## Executive summary (80/20)

- **Status:** Review completed trên baseline `7a0615a3a47c41f69af419ef215f402e7a4b9e56`.
- **Recommendation:** `Blocked`
- **Resolved:** Scope/build contract và worker fencing ordering.
- **Blocking:** Notification conflict target không khớp index; propagation savepoint lỗi runtime/isolation; mail FAILED row không được reclaim nên retry không thể gửi lại.
- **Next action:** Sửa 3 High blockers, bổ sung PostgreSQL integration/crash-window tests, rồi review round 6.

## Developer overview

| Field | Value |
|---|---|
| Feature | Feature 07 — Background Jobs |
| Baseline | `7a0615a3a47c41f69af419ef215f402e7a4b9e56` |
| Review round | 5 |
| Recommendation | `Blocked` |
| Critical | 0 |
| High | 3 |
| Medium | 4 |
| Low | 1 |
| Info | 1 |
| Blocking status | H-001, H-002, H-003 |
| Review artifact | `REVIEW.md` |
| Next skill | `planning` |

## Round 4 status

| Round 4 item | Round 5 status | Summary |
|---|---|---|
| Build blocker / scope | Resolved statically | Port, repository và call sites cùng nhận `JobScope`. |
| Worker fencing | Resolved statically | Attempt/event chỉ đóng sau fenced transition thành công. |
| Notification idempotency | Still blocked | `ON CONFLICT` target không khớp composite partial unique index. |
| Mail idempotency | Still blocked | Existing FAILED row chỉ gây throw; không có reclaim/resend path. |
| BFS propagation | Still blocked | Savepoint UUID không hợp lệ và helper rethrow làm rollback outer transaction. |
| Lifecycle bug | Regression | `BLOCKED` bị loại khỏi terminal/blocking dù không có unblock transition. |

## Open findings

| ID | Severity | Summary | Status |
|---|---|---|---|
| H-001 | High | Notification conflict target một cột không match unique index hai cột. | Open |
| H-002 | High | Savepoint name chứa UUID hyphens và rethrow nên propagation không isolate. | Open |
| H-003 | High | Mail retry không thể claim lại FAILED delivery để resend. | Open |
| M-001 | Medium | BLOCKED classification trái lifecycle thực tế/R2-07. | Open |
| M-002 | Medium | Claim và attempt/claimed event chưa atomic. | Open |
| M-003 | Medium | Stale exhausted attempt/source event chưa được đóng. | Open |
| M-004 | Medium | Không có CI/EXECUTION/test diff cho 68/68 claim. | Open |
| L-001 | Low | Worker identity vẫn random ở hai module. | Open |
| I-001 | Info | Shared scoped propagation service và fencing structure là cải thiện đúng hướng. | Noted |

## Verification status

| Area | Status |
|---|---|
| Static TypeScript contract | Pass |
| Worker fencing ordering | Pass statically |
| Notification PostgreSQL conflict | Fail |
| Mail retry recovery | Fail |
| BFS structure | Pass statically |
| Savepoint runtime syntax | Fail |
| Per-edge isolation | Fail |
| BLOCKED lifecycle | Fail requirement |
| Unit test evidence | Insufficient |
| CI status/workflow | Missing |

## Next action

1. Đổi notification conflict target thành `[sourceBackgroundJobId, userId]` hoặc đổi invariant/index đồng bộ.
2. Sanitize/quote savepoint name và catch sau rollback để tiếp tục sibling edges.
3. Thêm mail delivery state machine + atomic claim/reclaim cho FAILED/stale PROCESSING.
4. Khôi phục `BLOCKED` terminal/blocking hoặc thiết kế unblock transition đầy đủ.
5. Close stale source attempt/event atomically.
6. Thêm PostgreSQL integration tests cho notification, savepoint, BFS và mail retry.
7. Lưu `EXECUTION.md`, cập nhật TASKS/OVERVIEW và chạy CI bắt buộc.

## Handoff

- **Owner:** Agent / Developer
- **Next skill:** `planning`
- **Ready for done/PR:** No
- **Blocking:** Yes — three High findings
