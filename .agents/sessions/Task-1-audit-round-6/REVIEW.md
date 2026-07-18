# Review: Feature 05 — Audit Logs (Round 6 / Final Fixes)

## Executive summary (80/20)

- **Recommendation:** `Ready`
- **Top findings:** Cập nhật logic transaction `SAVEPOINT` thành công. Export job và audit logs query catch error tốt hơn. Repo hygiene được đảm bảo.
- **Verification status:** Đã test qua unit tests, compile type check (`bun run build`) hoàn tất. 
- **Next action:** Thực hiện bước `done` để merge / close tính năng.

## Developer overview

- **Recommendation:** `Ready`
- **Finding counts:** 
  - Critical: 0
  - High: 0
  - Medium: 0
  - Low: 0
  - Info: 1
- **Verification gaps:** Test thực tế E2E cho background job worker chưa có (repo đang thiếu hệ thống queue bền vững - đã deferred).
- **Next action:** Chuyển sang `done` skill.

## Scope reviewed

- **Task:** Round 6 for Feature 05 Audit Logs.
- **Files reviewed:** 
  - `auth.guard.ts` (Mock global E2E context)
  - `create-export.use-case.ts` (Fix export job lifecycle processing hang)
  - `confirm-import.use-case.ts` (Thêm PostgreSQL SAVEPOINT cho import từng dòng)
  - `list-audit-logs.use-case.ts` (Map error standard AppError)
  - `export-audit-logs.use-case.ts` / `delete-file.use-case.ts` (Thêm log cleanup error)
  - `update-setting.use-case.spec.ts` (Fix missing constructor argument in spec)
  - `.gitignore` (Repo hygiene cho python `__pycache__`)

## Inputs

- `PLAN.md`: Các spec fixes và tasks (đã đọc)
- `TASKS.md`: Danh sách chi tiết các công việc (đã hoàn thành 6/6)
- Git commit (20afdd7c): Diff trên main
- Build logs: Turbo repo build (`bun run build` pass API/Web packages)

## Findings

| ID | Severity | Category | Location | Evidence | Impact | Recommendation | Confidence |
|----|----------|----------|----------|----------|--------|----------------|------------|
| I-001 | Info | Architecture | Storage Cleanup | Repo không có sẵn outbox / background job queue. | Hiện tại chỉ sử dụng try-catch best effort kèm log `console.error`. | Chấp nhận rủi ro orphans data trên storage provider, có thể scale queue sau này (Deferred theo spec). | High |

## Requirement coverage

| Requirement / Task | Covered by change? | Evidence | Notes |
|--------------------|--------------------|----------|-------|
| T-001: Mock Global Context E2E | Yes | `user.organizationId = null` in test env when header empty. | E2E mock bypasses scope isolation for platform tests. |
| T-002: Export Job Lifecycle | Yes | Try/catch block covers listForExport & s3 upload. | Job fails explicitly if export generator throws. |
| T-003: Import Tx Savepoints | Yes | `tx.execute(sql.raw('SAVEPOINT ...'))` applied around `importRow`. | Protects multi-row bulk insert from single-row failure aborting the entire transaction. |
| T-004: ListAudit Error Mapping | Yes | Throws `AppError` with `AUTH_FORBIDDEN` status. | Standardizes HTTP 403 response. |
| T-005: Storage Cleanup Error Logging | Yes | Logs added in catch blocks. | Increases observability. |
| T-006: Repo Hygiene | Yes | `__pycache__` deleted & `.gitignore` updated. | Cleans up tracking. |

## Verification reviewed

| Check | Result | Evidence | Concern |
|-------|--------|----------|---------|
| Compilation / Types | Pass | `bun run build` success for `api-platform` và `web`. | Lỗi build ở `api-seed` do lỗi ts module không liên quan đến thay đổi này. |
| Security / RLS | Pass | Sửa E2E global test bypass logic (T-001). RLS database giữ nguyên trạng thái đóng (secure-by-default). | None |
| Data Integrity | Pass | Savepoints ngăn transaction rollback cả lô data import. | Drizzle Raw SQL syntax works safely. |

## Testing gaps

- **Gap:** Không có infrastructure test thực sự cho partial commit (S3 cleanup).
- **Risk:** Nếu S3 API offline, orphan files sinh ra trên S3 storage không có bot xoá lại.
- **Suggested follow-up:** Implement cơ chế Outbox pattern / Background Job như BullMQ / Temporal.

## Residual risks

- Rủi ro data leak không tồn tại, chỉ rủi ro chi phí storage (orphan S3 files). Đã chấp nhận trong Plan.

## Recommendation

**Ready**

## Handoff

- **Next action/skill:** `done`
- **Owner:** Agent
- **Blocking status:** None
