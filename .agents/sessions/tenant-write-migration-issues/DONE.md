# Done

## Executive summary (80/20)

- **Status**: Done with risks
- **Outcome**: Đã vá toàn bộ các lỗ hổng P0/P1 liên quan đến Audit System bao gồm RLS leakage, ACL bypass và connection leak do Postgres advisory lock.
- **Verification**: Code đã biên dịch thành công (`bun run build`), unit test audit pass toàn bộ. E2E tests đã được thêm nhưng **skipped** trên môi trường hiện tại do lỗi infrastructure (`ECONNREFUSED` từ test DB).
- **Residual risk**: Do test E2E không thể chạy được do lỗi môi trường, tính chính xác của E2E security rules cần được confirm qua CI.
- **Next action**: Handoff cho User review, tạo PR và kiểm tra trên môi trường CI.

## Developer overview

- **Status**: Done with risks
- **Verification summary**: Unit tests: Passed. TypeScript type check: Passed. E2E Tests: Skipped (blocked by env).
- **Residual risks**: Không thể chạy test E2E cục bộ do lỗi config Postgres/testcontainers.
- **Next action**: Push changes to main branch / create PR and verify via CI test pipeline.

## Status

Done with risks

## Summary

Đã cấu trúc lại toàn bộ cơ chế scope và file ACL cho module Audit: (1) Sửa tất cả các `PLATFORM` scope call-sites thành `ORGANIZATION` scope khi gắn liền với tenant resources. (2) Chặn tải xuống `AUDIT_EXPORT` từ endpoint file chung nếu không có quyền `audit.read`. (3) Chống rò rỉ file thông thường thông qua đường dẫn export audit. (4) Tái cơ cấu hàm `PurgeExpiredAuditLogsUseCase` để check-out và quản lý vòng đời Advisory Lock trên đúng 1 `PoolClient`, tránh connection leak.

## Scope completed

- Fix Tenant Call-site Scope: Completed. (Tất cả attachment/files/... log đều dùng `SYSTEM_SCOPE.ORGANIZATION` và pass org ID hợp lệ).
- Secure Audit Download ACL: Completed. (`FileAccessService` áp dụng strict ACL check đối với `AUDIT_EXPORT`).
- Fix Global Export RLS: Completed. (Super Admin global export dùng `withTenantContext` với `bypassRls: true`).
- Fix Purge Advisory Lock: Completed. (Sử dụng trực tiếp `DatabaseClient` và pool để mượn kết nối và thực hiện vòng đời lock-delete-unlock).
- Fix Frontend Truncation: Completed. (Frontend dùng `truncated` thay vì `isTruncated`).
- Write Security E2E Tests: Completed. (Đã add test cases vào `audit.e2e.spec.ts`).

## What changed

- **Audit Core (Service & Controller)**: Thay thế scope `PLATFORM` thành `ORGANIZATION` trên các tenant objects. 
- **Files & Security**: Áp dụng hard ACL (`audit.read` role) cho file `AUDIT_EXPORT` thay vì check ID của uploader. Fix global export bị vướng row level security.
- **Infrastructure (Database / Lock)**: `PurgeExpiredAuditLogsUseCase` được cấu trúc để sử dụng session lock đúng cách với pg `PoolClient`.
- **Frontend / UI**: Sửa typo property check báo truncate.

## Files changed

- `packages/api-platform/src/modules/audit/application/use-cases/export-audit-logs.use-case.ts`: Áp dụng bypass RLS với `null` org ID.
- `packages/api-platform/src/modules/audit/application/use-cases/purge-expired-audit-logs.use-case.ts`: Wrap advisory lock trong cùng 1 pool connection.
- `packages/api-platform/src/modules/files/application/services/file-access.service.ts`: Update RBAC authorization rule cho `AUDIT_EXPORT`.
- `apps/admin/src/features/audit-logs/controllers/use-audit-logs-controller.ts`: Fix typo `isTruncated` -> `truncated`.
- (Và các use-cases khác trong api-platform sửa hardcode/scope)

## Verification

- **TypeScript Compilation**: Chạy `bun run build` - Result: Passed. Evidence: No typecheck errors in `api-platform`.
- **Unit Tests**: Chạy `vitest run` trên module audit - Result: Passed. Evidence: All audit unit tests passed.
- **E2E Security Tests**: Chạy `vitest run` e2e - Result: Skipped. Evidence: Postgres database testcontainer refused connection `ECONNREFUSED 127.0.0.1:65432`.

## Review result

Reviewers đã kiểm tra và yêu cầu đổi các hardcode string thành các exported constants (`SYSTEM_SCOPE.ORGANIZATION`, `FILE_KIND.AUDIT_EXPORT`, v.v.). Đã hoàn tất sửa trong source và commit.

## Skipped / failed checks

- **E2E Security Test**: Skipped. Test database endpoint `127.0.0.1:65432` không khởi chạy được. Rủi ro: E2E security rules có thể hoạt động khác lý thuyết.

## Risks & follow-ups

- **E2E Environment setup** (Risk): Tích hợp database docker cho e2e bị hỏng trên local, cần fix để có thể chạy test cục bộ. (Owner: DevOps / Developer).

## Handoff

Thay đổi đã sẵn sàng để merge. Reviewer cần focus vào phần logic ở `FileAccessService` xem ACL đã đủ chặt chưa và kiểm tra lại Pipeline CI để chắc chắn các test E2E đã passed.
