# Feature 06 notification fixes — memory

> The **vital few** (Juran): the ~20% of knowledge from this task that will help
> ~80% of future work. **Not a changelog.** Omit anything reconstructable from
> git history, `DONE.md`, or the code itself.

- **Task / date:** `Task-3-feature-06-notifications-fixes` · `2026-07-18`
- **Outcome (1 line):** Fixed 10 issues from Review Round 1 — tenant isolation, idempotency, push delivery tracking, admin job scope, SSE fix.

## Decisions & why

- **Recipient ngoài tenant → throw 400** — user rejected silent-skip because admin cần biết ngay lỗi nhập sai userId. Trace: PLAN INV-002.
- **Push delivery → dedicated `notification_deliveries` table** — thay vì simple tracking flag, vì cần retry queue + at-least-once delivery cho FCM. Trace: PLAN INV-004.
- **SSE duplicate → chỉ publish Redis, bỏ local emit** — subscriber nhận event qua Redis echo, không emit local subject nữa. Trace: PLAN INV-006, user decision.

## Gotchas / pitfalls

- **`claimDue()` implementation** đã tồn tại trong repo từ trước nhưng không được khai báo trong port interface — `NotificationJobsRepositoryPort` thiếu method, worker phải dùng `listDue()` + `markProcessing()` riêng lẻ. Signal: luôn kiểm tra port interface trước khi gọi method mới.
- **`CreateNotificationInput.sourceJobId`** phải là optional (`string | null`) vì ad-hoc notification send không có job — giá trị `null` cho phép DB column nullable. Signal: kiểm tra tất cả call sites khi thêm field required vào port.

## Conventions / patterns to reuse

- **Tenant-aware UserLookup pattern** — join `organization_members` + filter `status = 'ACTIVE'` + `deletedAt IS NULL`. Xem `users.repository.ts:237-300`.
- **Delivery upsert pattern** — `upsertBatch()` dùng `ON CONFLICT DO NOTHING` với unique key `(notification_id, device_token_id, channel)`. Xem `deliveries.repository.ts`.
- **Dispatch refactor pattern** — `dispatch()` emit SSE + upsert delivery rows; `PUSH_NOTIFIER` thay bằng `DELIVERIES_REPOSITORY`. Xem `notification-dispatch.service.ts`.

## Pointers

- Notification module → `packages/api-platform/src/modules/notifications/`
- UserLookup port → `packages/api-core/src/ports/user-lookup.port.ts`
- notification_deliveries table → `packages/api-database/src/schema/platform/notifications.ts`
