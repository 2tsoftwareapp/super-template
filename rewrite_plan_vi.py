import re

plan_content = """# Plan

> Filled by planning step-02. Strategy only — **no** full task cards (`### T-00x` with AC/Verify/Files) in this file.
> Session path: `.agents/sessions/Task-3-Task-2-feature-06-notifications`. See `TASKS.md` for executable work.

## Step ledger (mandatory — update every step)

| Step | Name | Status | Evidence |
|---|---|---|---|
| 01 | Init templates | `done` | PLAN.md + TASKS.md exist |
| 02 | Fill PLAN + Spec quality | `done` | Feasibility/Correctness/Capability filled |
| 03 | Fill TASKS inventory/cards | `done` | Work inventory + cards |
| 04 | Self-check | `done` | Ready Yes with evidence |

## Executive summary (80/20)

- **Mục tiêu**: Củng cố tính năng Notification (Feature 06) bằng cách đảm bảo cách ly tenant (tenant isolation), chống trùng lặp (deduplication) và cơ chế at-least-once delivery.
- **Cách tiếp cận**: Thêm migration DB để hỗ trợ `sourceJobId` và sử dụng `FOR UPDATE SKIP LOCKED`. Refactor các Repository, Use Case, và SSE stream để filter chặt chẽ theo `organizationId`.
- **Rủi ro lớn nhất**: Việc giới hạn theo `organizationId` ở inbox có thể làm gãy các endpoint hiện tại nếu request không truyền đúng context `organizationId`.
- **Mức độ sẵn sàng**: Đã sẵn sàng các micro-task trong TASKS.md.
- **Hành động tiếp theo**: Handoff sang skill `sync` hoặc `execution`.

## Developer overview

| Field | Value |
|---|---|
| Status | `planning` |
| Cards drafted | `8` |
| Critical open decisions | `0` |
| Next action | sync / execution |

## Charts (when useful)

N/A

## Pre-planning decision gate

| Issue ID/source | Issue / decision | Severity | Clarity | Blocking? | Visual need/format | Resolution evidence | Status |
|---|---|---|---|---|---|---|---|
| ISS-001 | Thiếu tenant isolation trong inbox | High | Clear | Yes | none | User đã xác nhận filter theo `organizationId` | Resolved |
| ISS-002 | Thiếu cơ chế idempotent delivery | High | Clear | Yes | none | User đã xác nhận dùng `sourceJobId` và `ON CONFLICT DO NOTHING` | Resolved |

### Questions requiring user input

| Issue | Focused question | Why the plan changes | Answer |
|---|---|---|---|
| None | N/A | N/A | N/A |

## Spec quality review

### 1. Feasibility (tính khả thi)

| Finding | Evidence | Verdict |
|---|---|---|
| Postgres hỗ trợ `FOR UPDATE SKIP LOCKED` và `ON CONFLICT DO NOTHING`. | User direction / Postgres features | Pass |

### 2. Correctness (tính đúng đắn)

| Finding | Evidence | Verdict |
|---|---|---|
| Mô hình SSE và push hiện tại cần thêm logic filter `organizationId` và chống trùng lặp để phù hợp với thực tế. | Codebase | Pass |

### 3. Capability recommendations (khả năng feature / gaps)

| Gap ID | Missing / weak capability | Suggested question / default | Blocking? | Status |
|---|---|---|---|---|
| None | N/A | N/A | No | Resolved |

## Goal

Củng cố tính năng Notification (Feature 06) bằng việc cách ly tuyệt đối tenant, đảm bảo tính idempotent khi job retry, và chống trùng lặp khi giao push notification.

## Scope

- **Database**: Thêm cột `sourceJobId`, index theo `organizationId`, và các unique constraint trên table `notifications` cùng định danh push.
- **Repository**: Bắt buộc dùng tham số `{ userId, organizationId }` cho mọi thao tác với inbox.
- **Controllers/Use Cases**: Trích xuất `organizationId` từ auth context một cách an toàn.
- **Delivery**: Implement `ON CONFLICT DO NOTHING` khi tạo inbox và `FOR UPDATE SKIP LOCKED` cho worker xử lý đồng thời.
- **Realtime**: Giới hạn phạm vi phát SSE theo `userId + active organizationId`.
- **Tests**: Thêm test kiểm tra tính độc lập của tenant và test worker chạy song song.

## Non-goals

- Không hướng tới exactly-once delivery cho dịch vụ ngoài như FCM (best-effort at-least-once là chấp nhận được).
- Không gom cụm (batching/aggregation) nhiều notification.

## Assumptions

| Assumption | Risk | Confirmed |
|------------|------|-----------|
| Các notification thuộc global platform (organizationId = null) sẽ được xử lý riêng biệt trong tương lai hoặc qua các endpoint độc lập. | Low | Yes |

## Approach

1. Chạy Database Migrations (T-001)
2. Cập nhật Repository Scopes (T-002)
3. Áp dụng giới hạn tại Use-Case/Controller (T-003)
4. Tích hợp Idempotent Inbox và Concurrency safety cho worker (T-004, T-006)
5. Cải thiện logic Push delivery (T-005)
6. Sửa luồng Real-time streams (T-007)
7. Viết E2E và Unit testing (T-008)

## Affected areas

| Area / path | Expected change | Confidence |
|-------------|-----------------|------------|
| `packages/api-database/src/schema/platform/notifications.ts` | Thêm cột và index | known |
| `packages/api-platform/src/modules/notifications/infrastructure/` | Giới hạn repo + cập nhật worker | known |
| `packages/api-platform/src/modules/notifications/application/use-cases/` | Validate và truyền context | known |
| `packages/api-platform/src/modules/notifications/presentation/` | Bảo vệ các endpoint | known |

## Test strategy

- Tenant Isolation: Mock user thuộc nhiều org khác nhau, đảm bảo số unread của Org A không bao gồm Org B.
- Duplicate Delivery: Cho phép nhiều worker kích hoạt đồng thời, kiểm chứng chỉ 1 notification được sinh ra.

## Verification strategy

- Chạy các bộ E2E suites.
- Test endpoint qua curl cục bộ hoặc Postman, đổi `x-organization-id`.

## Definition of done

- [ ] Tất cả inbox queries đều dùng `userId + organizationId`.
- [ ] Không endpoint nào cho phép client tuỳ chọn tenant.
- [ ] Job retry không làm tăng số lượng notification.
- [ ] Nhiều worker chạy cùng lúc không tạo duplicate item.
- [ ] Truy cập chéo tenant trả về 404.
- [ ] Migration có logic rollback hợp lệ.
- [ ] `TASKS.md` đã hoàn tất và tương ứng với Task index bên dưới.

## Rollback strategy

- **Code:** Git revert.
- **Data:** Drop `source_job_id` và các unique index tại file migration `down`.

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Thiếu `organizationId` tại controller hiện hành có thể gây lỗi compile | Medium | Sửa tất cả vị trí đang gọi để truyền vào qua `AuthenticatedRequestUser`. |

## Task index

T-001 Database migration → T-002 Repository tenant scope → T-003 Controller/use-case enforcement → T-004 Idempotent inbox creation → T-005 Push delivery deduplication → T-006 Concurrency safety → T-007 SSE/realtime tenant isolation → T-008 Tests

## Handoff

- Ready for sync/execution? **Yes**
- Blockers: `none`
"""

with open(".agents/sessions/Task-3-Task-2-feature-06-notifications/PLAN.md", "w") as f:
    f.write(plan_content)

print("PLAN.md rewritten in Vietnamese")
