# Done

## Executive summary (80/20)

- **Status**: Done with risks
- **Value**: Hệ thống Audit Log đa khách hàng (multi-tenant) đã an toàn, nhất quán dữ liệu giữa CSDL và Storage, và xử lý được rác mà không bị khoá chết hệ thống.
- **Verification**: Logic được xác nhận qua code analysis và build success.
- **Residual risk**: Test tự động (E2E) bị lỗi infrastructure tại môi trường giả lập (không kết nối được test database). Cần kiểm tra lại CI/CD environment.
- **Next action**: Review PR cuối cùng và kiểm tra CI pipeline để fix Postgres service connection.

## Developer overview

- **Status**: Done with risks
- **Verification**: Đã chạy test, pass các file unit, nhưng E2E fail do test DB không chạy (ECONNREFUSED).
- **Residual risks**: Không có coverage E2E pipeline ở phiên làm việc này do infra lỗi.
- **Next action**: Khắc phục lỗi infra của E2E runner; có thể merge code lên staging để test.

## Summary

Đã hoàn tất Re-review Round 4 & 5 cho tính năng Audit Logs. Hệ thống đã khắc phục các lỗ hổng rò rỉ dữ liệu RLS, thiết lập đúng cơ chế lọc phạm vi `SUPER_ADMIN`, đảm bảo tính toàn vẹn giữa Storage Object và Database Transaction trong trường hợp gặp lỗi. Vòng lặp xoá dữ liệu log cũ được tối ưu bằng advisory locks với từng lô (batch) ngắn, ngăn chặn memory/connection leaks.

## Scope completed

- T-007: Thêm `PlatformTransactionPort` (done) - Tạo abstraction chạy logic CSDL trong mode bypass RLS.
- T-008: Thêm `AdvisoryLockPort` & Fix Purge (done) - Lock database để batch purge audit logs an toàn.
- T-009: Fix Interceptor & Export RLS (done) - Sửa lỗi bypass RLS khi export global log của SUPER_ADMIN.
- T-010: Implement Atomicity & List filter (done) - Áp dụng port transaction chung cho metadata và audit.
- T-011: Fix E2E test DB & Mock bugs (done) - Đưa symbol Injection `DATABASE` chuẩn vào test.
- T-012: Fix Audit-Export storage orphans (done) - Rollback cloud storage objects khi db lỗi; sử dụng field `truncated`.
- T-013: Fix Export Scope, Purge Loop & E2E context (done) - Áp dụng filter context chuẩn cho SUPER_ADMIN khi lấy danh sách logs.

## What changed

- **Audit Query/Export**: Sửa lỗi SUPER_ADMIN list/export log của tất cả tổ chức nếu vô tình có active session của một tenant. Yêu cầu `organizationId` null explicit. Đổi cờ `isTruncated` -> `truncated`.
- **Database/Transactions**: Sửa kiến trúc transaction, cung cấp `PlatformTransactionPort` cho các logic cần quyền vượt RLS. Các file delete operations bắt exception và tự rollback object trên S3.
- **Job Retention Purge**: Lặp và xoá audit logs cũ thành các lô 5.000 dòng thông qua từng db transaction riêng biệt thay vì gom chung một transaction dài hạn.

## Files changed

- `packages/api-platform/src/modules/audit/application/use-cases/purge-expired-audit-logs.use-case.ts`: Cải tiến loop batch.
- `packages/api-platform/src/modules/audit/infrastructure/audit.repository.ts`: Thêm method purge limit.
- `packages/api-platform/src/modules/files/application/use-cases/delete-file.use-case.ts`, `delete-attachment`, `confirm-import`, `create-export`: Sửa atomicity.
- `packages/api-platform/src/modules/audit/application/use-cases/export-audit-logs.use-case.ts`: Đặt try-catch cho S3 upload, xoá nếu DB tx commit fail.
- `apps/api/test/audit.e2e.spec.ts`: Sử dụng `x-organization-id: ""` để test bypass auth context của SUPER_ADMIN.

## Verification

- **Code compilation**: `pnpm run typecheck` - passed.
- **Unit/Integration tests**: `bun test` - passed (những test không cần postgres container).
- **E2E tests**: `bun run test:e2e` - failed/skipped (Lỗi `ECONNREFUSED` 127.0.0.1:65432 - infrastructure issue).

## Review result

Đã sửa toàn bộ các vòng review từ T-007 đến T-013 bao gồm blocker về atomicity và memory context. Không còn findings tồn đọng trên mã nguồn.

## Skipped / Failed checks

- `E2E tests`: failed - Môi trường máy test không mở cổng 65432 của CSDL test. Risk: Tính năng không được E2E pipeline xác nhận 100%. Mức độ: Medium.

## Risks & Follow-ups

- **Risk**: Môi trường E2E local/CI đang gặp vấn đề port DB (Impact: Medium) -> Next action: DevOps fix infra.

## Handoff

Task hoàn thành ở mức code. Người review tiếp theo có thể verify thủ công trên Staging hoặc sau khi sửa xong môi trường test cục bộ. Review code PR để kiểm tra kiến trúc atomicity.
