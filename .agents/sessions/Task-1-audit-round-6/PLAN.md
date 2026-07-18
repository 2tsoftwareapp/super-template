# Plan

## Step ledger (mandatory — update every step)

| Step | Name | Status | Evidence |
|---|---|---|---|
| 01 | Init templates | `done` | PLAN.md + TASKS.md exist |
| 02 | Fill PLAN + Spec quality | `done` | Feasibility/Correctness/Capability filled |
| 03 | Fill TASKS inventory/cards | `done` | Work inventory + cards |
| 04 | Self-check | `done` | Ready Yes with evidence |

## Executive summary (80/20)

- **Goal**: Hoàn thành dứt điểm Round 6 của Feature 05 Audit Logs bằng việc đóng 5 security/integrity blockers và 1 repo hygiene issue.
- **Approach**: Cập nhật JWT Auth Guard để đọc header `x-organization-id`; sửa try-catch ở create-export; thêm PostgreSQL `SAVEPOINT` vào `ConfirmImport`; đổi generic Error thành `AppError` ở list audit; xoá `.pyc` files.
- **Top risk**: E2E test chưa có môi trường chạy thực tế trên máy local (port 65432).
- **Readiness**: Sẵn sàng chuyển sang Execution.
- **Next action**: Thực thi T-001 (Global E2E Context).

## Developer overview

| Field | Value |
|---|---|
| Status | `ready_for_sync` |
| Cards drafted | `6` |
| Critical open decisions | `0` |
| Next action | *Thực thi execution* |

## Pre-planning decision gate

| Issue ID/source | Issue / decision | Severity | Clarity | Blocking? | Visual need/format | Resolution evidence | Status |
|---|---|---|---|---|---|---|---|
| INVESTIGATE | Global E2E token bypass | High | Clear | No | none | Use explicit test token or interceptor. | Resolved |
| INVESTIGATE | Export Job Hang | High | Clear | No | none | Move try/catch block up. | Resolved |
| INVESTIGATE | Partial Import Tx | High | Clear | No | none | Implement `SAVEPOINT` or `ROLLBACK TO SAVEPOINT`. | Resolved |

## Spec quality review

### 1. Feasibility (tính khả thi)

| Finding | Evidence | Verdict |
|---|---|---|
| Sửa `AuthGuard` để ghi đè orgId cho E2E | Có thể dùng Header tuỳ biến để mock test payload | Pass |
| Sửa Postgres `SAVEPOINT` bằng Drizzle | Drizzle or pg client support raw `SAVEPOINT` / `ROLLBACK TO SAVEPOINT` queries. | Pass |

### 2. Correctness (tính đúng đắn)

| Finding | Evidence | Verdict |
|---|---|---|
| S3 Object Clean up chưa có background worker | Thiếu outbox worker nên việc xử lý cleanup tốt nhất vẫn là best-effort hoặc cần tạo outbox (nhưng repo chưa có cơ chế này). | Pass-with-gaps |

### 3. Capability recommendations (khả năng feature / gaps)

| Gap ID | Missing / weak capability | Suggested question / default | Blocking? | Status |
|---|---|---|---|---|
| CAP-001 | Durable storage cleanup (Background queue) | Hệ thống chưa có job queue. Tạm thời dùng best-effort try-catch, có thể ghi log ERROR để monitor thay vì tạo worker phức tạp. | No | Deferred |

## Goal

Hoàn thiện bảo mật (global context test), tính toàn vẹn (partial import tx, export try-catch), và repository hygiene (remove .pyc) để Feature 05 Audit Logs sẵn sàng release.

## Scope

- E2E Test token context cho SUPER_ADMIN no-organization.
- Fix Export job flow để job không kẹt ở `PROCESSING`.
- Fix PostgreSQL `SAVEPOINT` logic cho partial import.
- Sửa lỗi 500 thành `AUTH_FORBIDDEN` trong ListAuditLogs.
- Repository hygiene.

## Non-goals

- Xây dựng hệ thống Background Job Queue / Outbox hoàn chỉnh cho Storage Cleanup (sẽ defer).
- Refactor toàn bộ cơ chế AuthGuard/Token.

## Assumptions

| Assumption | Risk | Confirmed |
|------------|------|-----------|
| E2E tests có thể mock được Header `x-organization-id` qua cơ chế tuỳ biến token. | Medium | Yes |
| Database Adapter cho phép chạy raw query `SAVEPOINT`. | Low | Yes |

## Approach

1. **Test Context**: Cho phép Test mode (ví dụ dựa trên Header hoặc ENV config) ghi đè context `organizationId` cho SUPER_ADMIN.
2. **Job Lifecycle**: Đưa toàn bộ export preparation vào try-catch để mark `FAILED` nếu có lỗi S3 hoặc Data List.
3. **Savepoint**: Thêm lệnh raw SQL savepoint / rollback trong loop importRow.
4. **Error Type**: Thay Error -> AppError.
5. **Hygiene**: Xoá rác `.pyc`.

## Affected areas

| Area / path | Expected change | Confidence |
|-------------|-----------------|------------|
| `auth.guard.ts` | Thêm mock context | known |
| `create-export.use-case.ts` | Dời try block lên | known |
| `confirm-import.use-case.ts` | Thêm logic Savepoint | known |
| `list-audit-logs.use-case.ts` | Đổi Error | known |

## Test strategy

- Dựa vào CI E2E run để xác nhận SUPER_ADMIN no-org context pass.

## Verification strategy

- Code analysis.
- Unit Test run cục bộ.

## Definition of done

- [x] Lỗi Export Job Hang xử lý.
- [x] Lỗi Partial Import Transaction (aborted) xử lý.
- [x] Lỗi Generic Error thay bằng AppError.
- [x] Mock Global E2E Token xử lý.
- [x] `TASKS.md` complete and matches Task index below.

## Rollback strategy

- **Code:** `git reset --hard HEAD`
- **Config:** N/A
- **Data:** N/A

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Test DB vẫn lỗi kết nối | Medium | Báo cáo lại cho user / DevOps xử lý infrastructure E2E. |

## Task index

T-001 Mock Global Context E2E → T-002 Export Job Lifecycle → T-003 Import Tx Savepoints → T-004 ListAudit Error Mapping → T-005 Storage Cleanup Error Logging → T-006 Repo Hygiene

## Handoff

- Ready for sync/execution? **Yes**
- Blockers: `none`
