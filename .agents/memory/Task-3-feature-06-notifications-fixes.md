# Feature 06 notification fixes — memory

> The **vital few** (Juran): the ~20% of knowledge from this task that will help
> ~80% of future work. **Not a changelog.** Omit anything reconstructable from
> git history, `DONE.md`, or the code itself.

- **Task / date:** `Task-3-feature-06-notifications-fixes` · `2026-07-18` (Round 2: `2026-07-19`)
- **Outcome (1 line):** Fixed 15 issues across 2 review rounds — tenant isolation, idempotency, push delivery tracking, admin job scope, SSE fix, ON CONFLICT WHERE, delivery processor, atomic transaction, retry/backoff.

## Decisions & why

- **Recipient ngoài tenant → throw 400** — user rejected silent-skip because admin cần biết ngay lỗi nhập sai userId. Trace: PLAN INV-002.
- **Push delivery → dedicated `notification_deliveries` table** — thay vì simple tracking flag, vì cần retry queue + at-least-once delivery cho FCM. Trace: PLAN INV-004.
- **SSE duplicate → chỉ publish Redis, bỏ local emit** — subscriber nhận event qua Redis echo, không emit local subject nữa. Trace: PLAN INV-006, user decision.
- **ON CONFLICT WHERE → thêm predicate `sourceJobId is not null`** — Option A (1 line fix, không migration) thay vì Option B (drop + recreate partial index). Partial unique index chỉ apply khi `sourceJobId IS NOT NULL`, nên WHERE predicate là bắt buộc. Trace: INVESTIGATE E-101→E-103.
- **SSE emit ngoài transaction** — inbox insert + delivery upsert trong cùng transaction; SSE emit chỉ sau khi commit thành công. Tránh gửi event khi transaction rollback. Trace: T-015 AC.
- **NotificationDeliveryProcessor dùng `sendToToken` thay vì `sendToUser`** — processor xử lý theo token (1 delivery = 1 token), không theo user. `sendToUser` không dùng được vì nó query tokens nội bộ. Trace: T-014 AC.

## Gotchas / pitfalls

- **`claimDue()` implementation** đã tồn tại trong repo từ trước nhưng không được khai báo trong port interface — `NotificationJobsRepositoryPort` thiếu method, worker phải dùng `listDue()` + `markProcessing()` riêng lẻ. Signal: luôn kiểm tra port interface trước khi gọi method mới.
- **`CreateNotificationInput.sourceJobId`** phải là optional (`string | null`) vì ad-hoc notification send không có job — giá trị `null` cho phép DB column nullable. Signal: kiểm tra tất cả call sites khi thêm field required vào port.
- **`createMany` với `ON CONFLICT DO NOTHING` không return existing rows** — khi retry cùng sourceJobId+userId, `RETURNING` chỉ trả rows vừa insert. Cần gọi `findBySourceJobAndUsers()` riêng để lấy rows đã tồn tại. Signal: luôn load lại sau `ON CONFLICT DO NOTHING` nếu cần xử lý rows cho all recipients.
- **`TransactionExecutor = unknown`** — port interface dùng `TransactionExecutor` (type alias `unknown`), implementation dùng `DatabaseExecutor`. TypeScript không complain vì cả 2 đều accept `unknown`, nhưng runtime có thể fail nếu executor sai type. Signal: pass executor từ `transactionPort.run(tx => ...)` — Drizzle runtime cast đúng.
- **Processor không có organization context** — `findById(notificationId)` cần optional `organizationId` vì delivery processor không biết org của notification. Signal: làm `organizationId?` optional trên port khi caller không có org context.

## Conventions / patterns to reuse

- **Tenant-aware UserLookup pattern** — join `organization_members` + filter `status = 'ACTIVE'` + `deletedAt IS NULL`. Xem `users.repository.ts:237-300`.
- **Delivery upsert pattern** — `upsertBatch()` dùng `ON CONFLICT DO NOTHING` với unique key `(notification_id, device_token_id, channel)`. Xem `deliveries.repository.ts`.
- **Dispatch refactor pattern** — `dispatch()` emit SSE + upsert delivery rows; `PUSH_NOTIFIER` thay bằng `DELIVERIES_REPOSITORY`. Xem `notification-dispatch.service.ts`.
- **Atomic transaction pattern** — `transactionPort.run(tx => { ... })` + pass `tx` (TransactionExecutor) vào mọi repository method. SSE emit ngoài transaction. Xem `notification-delivery.use-case.ts:302-329`.
- **Delivery retry/backoff pattern** — `markRetryable` set status PENDING + nextAttemptAt với exponential backoff. `claimPending` filter `(next_attempt_at IS NULL OR next_attempt_at <= now())`. `recoverStaleProcessing` cho PROCESSING quá timeout. Xem `deliveries.repository.ts`.

## Pointers

- Notification module → `packages/api-platform/src/modules/notifications/`
- UserLookup port → `packages/api-core/src/ports/user-lookup.port.ts`
- notification_deliveries table → `packages/api-database/src/schema/platform/notifications.ts`
