## Summary
Hoàn thiện toàn bộ Feature 05 Audit Logs dựa trên Review Round 6. Cập nhật sửa chữa các edge case lớn liên quan đến RLS bypassing cho System Tasks, tránh trạng thái treo cho Export Jobs, tối ưu Atomicity khi ghi log, và cung cấp giải pháp Abstract Savepoint để đảm bảo code logic UseCase an toàn và trong sáng (clean code).

## Changes
- **api-core / api-database:** Cung cấp cơ chế `withSavepoint` vào `TransactionPort` cho phép application loop qua nhiều batch mà không vỡ transaction, không lộ raw SQL, và luôn `RELEASE SAVEPOINT` kể cả khi có lỗi (chống bloat).
- **api-platform (Export Job):** Fixed lỗi treo state `PROCESSING` ở file upload khi database commit failed.
- **api-platform (Import Job):** Xóa bỏ Drizzle dependencies khỏi domain logic, thay bằng abstraction Savepoint port.
- **api-platform (Audit Log):** Hoàn thiện các test context E2E, mock Header để giả lập chính xác Global / Organization scope cho role SUPER_ADMIN.
- **api-seed:** Fix module resolution lỗi `.js`.

## Verification
- `bun run build` verifies type safety for platform API logic changes.
- `vitest` / Unit test suite successfully passed on modified files.
- Manual verification of Savepoint queries compatibility in Drizzle.

## Review Notes

- Reviewer should verify `SAVEPOINT` implementation correctly isolates failures and doesn't leak transaction blocks.
- Background worker for S3 Cleanup is currently marked as deferred. A fallback strategy with `console.error` and block catch is implemented as a placeholder.

## Risks/Follow-ups

- Potential zombie objects in S3 if the API instance gets killed midway. (Requires an Outbox/BullMQ queue later on).
