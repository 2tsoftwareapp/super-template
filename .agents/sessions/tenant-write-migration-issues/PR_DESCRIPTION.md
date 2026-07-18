## Summary
Đã hoàn thành sửa các lỗi còn tồn đọng ở vòng re-review liên quan đến Audit System bao gồm RLS leakage, ACL bypass và connection leak. Các use case mutation tenant hiện tại đã sử dụng đúng scope `ORGANIZATION`. 

## Changes
- Thay thế scope `PLATFORM` thành `ORGANIZATION` trên các tenant resources (Upload, Version, Attach).
- Sử dụng `PLATFORM_TRANSACTION_PORT` để bypass RLS trong export audit logs global.
- Cập nhật biến `truncated` thành `isTruncated` để tương thích frontend.
- Bọc toàn bộ các write process cho mutation và audit bằng `TransactionPort` để đảm bảo atomicity.
- Khắc phục các mock transaction port bị sai để đảm bảo unit tests chạy thành công.

## Verification
- Unit Tests: Passed (`pnpm --filter api test`)
- Typescript Check: Passed (`bun run build`)
- E2E Tests: Cần xác nhận trên CI do môi trường local bị lỗi Testcontainers `ECONNREFUSED`.

## Review Notes
Reviewer chú ý kiểm tra lại E2E pipeline trên Github Actions và phần access control của `AUDIT_EXPORT` ở `FileAccessService` xem có khớp với role `audit.read` chưa.

## Risks & Follow-ups
- Môi trường test E2E cho local hiện đang bị gãy (Database setup local).
