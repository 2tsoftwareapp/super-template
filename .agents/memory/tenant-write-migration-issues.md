# Tenant Write Migration Issues (Audit Logs Multi-Tenant RLS & Performance)

## Tóm tắt (The Vital Few - 80/20)

- **PlatformTransactionPort**: Khi cần bypass Row Level Security (RLS) để đọc/ghi các dữ liệu cấp hệ thống (platform events, super admin queries), luôn đóng gói logic vào bên trong `PlatformTransactionPort.run()`. Port này sẽ tự mở một transaction Postgres với role bypassRls. Không cố tình "try-catch" rải rác.
- **Storage Cleanup Atomicity & Orphan Management**: Khi UseCase có thay đổi database đồng thời với thao tác ghi/xoá Object Storage (ví dụ: upload audit export file, xoá file đính kèm), bắt buộc DB phải gọi `TRANSACTION_PORT.run()`. Thao tác storage phải có block `try-catch` để xoá object nếu `commit` DB xảy ra lỗi. Nếu hệ thống chưa có Outbox worker, bắt buộc phải dùng `try-catch` bao quanh hàm `delete` storage và log lỗi `console.error` để không nuốt lỗi nếu quá trình dọn dẹp (cleanup) thất bại. Tránh rác (zombie objects) trên S3.
- **Batched Deletion với Advisory Lock**: Dành cho các tác vụ cron job (ví dụ: xoá audit logs cũ). Không được dùng chung 1 connection/1 transaction cho vòng lặp xoá lớn (gây lock row kéo dài và rò rỉ connection). Hãy sử dụng `pg_try_advisory_lock` (thông qua `AdvisoryLockPort`) để đảm bảo chỉ có 1 worker chạy. Vòng lặp xoá bên trong phải mỗi bước lấy 1 transaction ngắn (ví dụ xoá 5000 rows).
- **Partial Import Transaction (SAVEPOINT)**: Khi cần chèn/cập nhật hàng loạt (ví dụ import CSV), tránh lỗi 1 dòng làm rollback toàn bộ transaction. Drizzle hỗ trợ `execute(sql.raw('SAVEPOINT sp_name'))` và `ROLLBACK TO SAVEPOINT sp_name` giúp catch error ở từng dòng một cách an toàn.
- **Phân định rõ ràng Scope & Tenant Context**: Dù user là SUPER_ADMIN, mọi query/list/export phải tuân thủ scope của organization nếu context đang mang `organizationId`. Để lấy dữ liệu toàn hệ thống, phải truyền explicit filter `organizationId: null` và `scope: PLATFORM`.

## Gotchas

- Lỗi `Reflect.getMetadata` hoặc ECONNREFUSED khi chạy `bun test apps/api/test/*.e2e.spec.ts`: Môi trường giả lập Bun có thể không tương thích hoặc thiếu setup Postgres database trên cổng 65432. Bắt buộc test E2E cho repo bằng `vitest` (`pnpm run test:e2e`).
- E2E Tests cho global logic: Với test dành cho context không có org (Global scope), cần fake context bằng cách sử dụng token Header `x-organization-id: ''`. Trang bị cấu hình giả lập chuẩn.
