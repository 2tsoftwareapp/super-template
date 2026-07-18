# Giải quyết các vấn đề Tenant Migration và Security ACL trong Audit System

## Summary
PR này bao gồm toàn bộ các fixes cho Re-review Round 3 của hệ thống Audit liên quan đến RLS leakage, ACL bypass và connection leak. Đảm bảo tính minh bạch, chính xác của Audit events khi áp dụng vào các system tenant objects.

## Changes
1. Sửa tất cả các `SYSTEM_SCOPE.PLATFORM` call-sites khi thao tác trên resources của tenant (File, Attachment, Import, Notification) thành `SYSTEM_SCOPE.ORGANIZATION` để tránh RLS bypass policy reject.
2. Thêm policy vào generic `FileAccessService` để kiểm tra role `audit.read` thay vì check uploadedById cho file export audit. Chặn các request đọc file thường thông qua Audit Export endpoint (`404 Not Found`).
3. Sửa `ExportAuditLogsUseCase` để tự bypass RLS nếu context là `organizationId === null` cho GLOBAL SUPER_ADMIN.
4. Tái cấu trúc cơ chế Advisory Lock trong `PurgeExpiredAuditLogsUseCase` để giữ transaction/checkout lifecycle, ngăn connection leak.
5. Cập nhật frontend `use-audit-logs-controller.ts` sửa typo `isTruncated` -> `truncated`.
6. Bổ sung security unit/E2E test cover các case trên.

## Verification
- Biên dịch thành công Typescript code (`bun run build`).
- Audit unit tests chạy ổn định (`vitest run test/*.spec.ts`).
- E2E tests security policy đã được cài đặt nhưng skipped do lỗi Postgres testcontainers `ECONNREFUSED`.

## Review Notes
Reviewer cần kiểm tra kĩ:
- Logic mới trong `FileAccessService` tại hàm check ACL tải file.
- Pipeline CI đảm bảo chạy thành công file E2E tests (audit.e2e.spec.ts).

## Risks & Follow-ups
- Cần fix môi trường local cho các e2e tests (DB port 65432 down).
