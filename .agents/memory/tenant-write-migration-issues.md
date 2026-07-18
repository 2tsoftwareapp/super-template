# Tenant write migration issues (Re-review 3)

## Outcome

Đã sửa lỗi multi-tenant data bleed/access controls trong hệ thống Audit.

## Decisions

- **Tenant scope enforcement**: Ép các event của tenant sử dụng `SYSTEM_SCOPE.ORGANIZATION` và pass kèm `organizationId` vào payload, thay vì để `PLATFORM` dẫn đến RLS (Row Level Security) từ chối ghi dữ liệu.
- **Export ACL Isolation**: File sinh ra từ Audit Export không dùng `uploadedById` để cấp quyền như file thường, mà dựa vào rule `audit.read` role (hoặc SUPER_ADMIN).
- **Atomicity giữa Mutation và Audit**: Dùng chung 1 transaction port (`TRANSACTION_PORT` hoặc `PLATFORM_TRANSACTION_PORT`) bao trọn cả logic business (tạo file, đính kèm, sửa đổi) và logic ghi audit. Không dùng pool check-out thủ công vì RLS sẽ không được kích hoạt đúng context.

## Gotchas

- **Advisory Lock Connection Leak**: PostgreSQL `pg_try_advisory_lock` (session mode) dính với process đang check out connection từ connection pool. Đừng gọi qua các proxy repository không trả lại đúng original executor, phải xin `PoolClient` trực tiếp từ dependency và release nó ở block `finally`.
- **Global Export with RLS**: Audit export Global (SUPER_ADMIN) sinh ra file không thuộc tổ chức nào (org ID null). File repository có bật RLS, vì thế phải truyền bypass `withTenantContext({ tenantId: null as unknown as string, bypassRls: true, userId: actor.userId })` để lưu export file meta.

## Conventions

- API trả về biến là `isTruncated` (boolean) để frontend có thể cảnh báo user về giới hạn xuất export. Không dùng biến `truncated`.
- Trong Vitest, E2E Database Tests nếu có inject TransactionPort, phải mock đầy đủ `expect.anything()` cho tham số `tx` được bọc bên trong port.

## Pointers

- **FileAccessService**: Nơi quản lý quyền tải file hỗn hợp (File thường vs Audit Export).
- **PurgeExpiredAuditLogsUseCase**: Nơi minh hoạ rõ ràng cách dùng Postgres Session Advisory Lock trong NestJS.
