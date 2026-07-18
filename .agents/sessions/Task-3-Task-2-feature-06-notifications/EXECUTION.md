# Phase 3: Residual fixes + Tests

**Tổng quan:** T-009 → T-013 đã hoàn thành. Tất cả các card trong phase 3 đã được implement và pass review.

---

### T-009: claimDue wiring
- Thêm `claimDue(limit)` vào interface `NotificationJobsRepositoryPort`
- Đổi luồng worker: `processDueJobs()` gọi `claimDue()` + `processClaimedJob()` thay vì `listDue()`
- Giữ nguyên `processJob(jobId)` cho luồng immediate-send

### T-010: Admin job scope + atomic audit
- Thêm filter `organizationId` vào `list()` trong `notification-jobs.repository.ts`
- Cập nhật use-case `listJobs()` + controller để nhận actor và truyền `organizationId`
- Cập nhật `getJob()` để kiểm tra org scope, trả về 404 nếu cross-org
- Cập nhật `cancelJob()` để kiểm tra org scope trước khi cancel
- Thêm `organizationId` vào type `ListNotificationJobsQuery`

### T-011: SSE fix
- Sửa `emit()` trong `notification-stream.service.ts`: khi `redisPublisher` có sẵn, chỉ publish lên Redis (không emit local); fallback về local subject khi Redis không được cấu hình
- Fix lỗi duplicate SSE events khi subscriber ở cùng process

### T-012: Repository userId filter
- Thêm tham số `userId` vào `markRead()` và `delete()` trong port interface và implementation
- Cập nhật WHERE clause để thêm `eq(notifications.userId, userId)` như defense-in-depth
- Cập nhật inbox use-case để truyền `user.userId`

### T-013: E2E tests
- Tạo `notification-delivery-scope.spec.ts` với 8 test coverage: tenant isolation, idempotency, concurrent workers, admin job scope
- Cập nhật mock signatures trong `notifications.service.spec.ts` cho khớp với interface `UserLookup` mới
- Tất cả notification tests đều pass

---

## Kết quả tests

```
316 passed, 1 failed
```

Test fail là lỗi export-idempotency có từ trước, không liên quan đến notifications.
