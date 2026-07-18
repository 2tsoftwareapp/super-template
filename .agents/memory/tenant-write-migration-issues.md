# Tenant write migration issues (Re-review 3)

## Outcome

Đã sửa lỗi multi-tenant data bleed/access controls trong hệ thống Audit.

## Decisions

- **Tenant scope enforcement**: Ép các event của tenant sử dụng `SYSTEM_SCOPE.ORGANIZATION` và pass kèm `organizationId` vào payload, thay vì để `PLATFORM` dẫn đến RLS (Row Level Security) từ chối ghi dữ liệu.
- **Export ACL Isolation**: File sinh ra từ Audit Export không dùng `uploadedById` để cấp quyền như file thường, mà dựa vào rule `audit.read` role (hoặc SUPER_ADMIN).

## Gotchas

- **Advisory Lock Connection Leak**: PostgreSQL `pg_try_advisory_lock` (session mode) dính với process đang check out connection từ connection pool. Đừng gọi qua các proxy repository không trả lại đúng original executor, phải xin `PoolClient` trực tiếp từ dependency và release nó ở block `finally`.
- **Global Export with RLS**: Audit export Global (SUPER_ADMIN) sinh ra file không thuộc tổ chức nào (org ID null). File repository có bật RLS, vì thế phải truyền bypass `withTenantContext({ tenantId: null as unknown as string, bypassRls: true, userId: actor.userId })` để lưu export file meta.

## Conventions

- Frontend trả warning nếu API trả về `truncated: true` thay vì `isTruncated`.

## Pointers

- **FileAccessService**: Nơi quản lý quyền tải file hỗn hợp (File thường vs Audit Export).
- **PurgeExpiredAuditLogsUseCase**: Nơi minh hoạ rõ ràng cách dùng Postgres Session Advisory Lock trong NestJS.
