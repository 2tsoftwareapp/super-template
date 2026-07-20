# INVESTIGATE — Feature 06 Notifications · Review Round 2

## Executive summary

- **3 P0 blockers confirmed**: (1) `ON CONFLICT DO NOTHING` thiếu `where` predicate → không match partial unique index; (2) push pipeline gián đoạn — `claimPending`/`markSent` dead code, không worker nào gửi FCM; (3) inbox insert + delivery-row creation không atomic — retry mất push vĩnh viễn.
- **2 P1 confirmed**: delivery retry state machine thiếu backoff; job mutation + audit không cùng transaction.
- **1 P1 confirmed**: idempotency key unique constraint không scope organizationId.
- **Test coverage gap**: tất cả là mock-level unit tests — không integration test DB constraints, không test delivery pipeline, không test atomicity.
- **Kết luận**: Feature 06 chưa sẵn sàng merge. Cần 5 fix bắt buộc trước khi tiếp tục.

## Developer overview

| Field | Value |
|-------|-------|
| Investigation status | **Root Cause Confirmed** — tất cả 7 claims từ Review Round 2 đều có evidence |
| Strongest hypothesis | Partial unique index không match (P0) là lỗi dễ trigger nhất — job delivery crash ngay khi chạy thực tế |
| Evidence gap | Không có CI workflow run cho HEAD commit; 1 test repo đang fail |
| Next action | Sửa 5 blocking items → viết integration tests → chạy CI |

## Charts

```mermaid
flowchart TD
    subgraph P0_1[P0-1: ON CONFLICT mismatch]
        A1[Migration: partial unique index\nWHERE source_job_id IS NOT NULL]
        A2[Repository: onConflictDoNothing\n{ target: [sourceJobId, userId] }]
        A3[Missing WHERE predicate →\nPostgreSQL can't match index]
        A1 --> A3
        A2 --> A3
        A3 --> A4[Insert fails OR\nduplicates not prevented]
    end

    subgraph P0_2[P0-2: Push pipeline broken]
        B1[dispatch() calls void upsertDeliveries]
        B2[upsertDeliveries only writes\nnotification_deliveries rows]
        B3[claimPending / markSent:\nzero production call sites]
        B4[No delivery processor exists]
        B1 --> B2 --> B3 --> B4
        B4 --> B5[FCM push never sent]
    end

    subgraph P0_3[P0-3: Not atomic]
        C1[processClaimedJob:\ncreateMany]
        C2[no DB transaction]
        C3[void upsertDeliveries\nfire-and-forget]
        C4[markCompleted\nseparate call]
        C1 --> C2
        C2 --> C3
        C3 --> C4
        C4 --> C5[Crash → inbox exists\nbut delivery missing]
    end

    P0_1 -->|blocks| D[Feature 06 NOT APPROVED]
    P0_2 --> D
    P0_3 --> D
```

## Question

Các claim từ Review Round 2 (commit `1b6d4850a2a7ac5ca2a3739c64dbb1aeeb6eb1bb`) về partial unique index, push delivery, atomicity, retry state machine, audit atomicity, idempotency scope, và test coverage có chính xác không?

## Status

**Root Cause Confirmed** — 7/7 findings confirmed with code evidence.

## Context

- **HEAD:** `1b6d4850a2a7ac5ca2a3739c64dbb1aeeb6eb1bb`
- **Commit:** `fix(notifications): tenant isolation, idempotency, push delivery tracking, admin job scope`
- **Session:** `.agents/sessions/Task-3-Task-2-feature-06-notifications/`
- **Review verdict:** 7.8/10 — NEEDS CHANGES (Round 2)

## Evidence

| ID | Source | Observation | Supports | Confidence |
|----|--------|-------------|----------|------------|
| E-101 | `notifications.ts:61-63` (schema) | Unique index: `(source_job_id, user_id) WHERE source_job_id IS NOT NULL` | P0-1 partial index | **Cao** |
| E-102 | `0021_notification_hardening.sql:5` | Migration SQL: `WHERE "notifications"."source_job_id" is not null` | P0-1 | **Cao** |
| E-103 | `notifications.repository.ts:48-49` | `onConflictDoNothing({ target: [sourceJobId, userId] })` — thiếu `where` clause | P0-1 | **Cao** |
| E-104 | `notification-dispatch.service.ts:23-28` | `dispatch()` emit SSE + `void this.upsertDeliveries()` — fire-and-forget | P0-2 push broken | **Cao** |
| E-105 | `notification-dispatch.service.ts:30-54` | `upsertDeliveries()` chỉ upsert DB rows, không gọi `PUSH_NOTIFIER` | P0-2 | **Cao** |
| E-106 | `deliveries.repository.ts:37-62` | `claimPending()` defined — **zero call sites** trong production | P0-2 | **Cao** |
| E-107 | `deliveries.repository.ts:64-81` | `markSent()` defined — **zero call sites** trong production | P0-2 | **Cao** |
| E-108 | `notification-delivery.use-case.ts:301-325` | `processClaimedJob`: `createMany()` → `dispatch()` → `markCompleted()` — không transaction | P0-3 không atomic | **Cao** |
| E-109 | `notification-delivery.use-case.ts:327-332` | Catch block gọi `markFailed` riêng — job chuyển FAILED nếu insert lỗi | P0-3 | **Cao** |
| E-110 | `deliveries.repository.ts:83-98` | `markFailed()` không set `nextAttemptAt` | P1 retry state machine | **Cao** |
| E-111 | `deliveries.repository.ts:37-51` | `claimPending()` WHERE chỉ `status = 'PENDING'`, không kiểm tra `next_attempt_at <= now()` | P1 retry | **Cao** |
| E-112 | `notification-delivery.use-case.ts:123-153` | `createDeliveryJob`: `create()`/`createIdempotent()` → `auditWriter.log()` — không transaction | P1 audit atomicity | **Cao** |
| E-113 | `notification-delivery.use-case.ts:237-256` | `cancelJob`: `markCancelled()` → `auditWriter.log()` — không transaction | P1 audit atomicity | **Cao** |
| E-114 | `notifications.ts:154-156` (schema) | Unique index: `notification_jobs_actor_idempotency_key_unique` on `(actorId, idempotencyKey)` — không có `organizationId` | P1 idempotency scope | **Cao** |
| E-115 | `notification-jobs.repository.port.ts:71-88` | `findByIdempotencyKey` chỉ filter `actorId + idempotencyKey`, không `organizationId` | P1 scope | **Cao** |
| E-116 | `notification-delivery-scope.spec.ts:92-114` | "Idempotency test": chỉ assert `createMany` called 1 lần, không test actual DB constraint | Test gap | **Cao** |
| E-117 | `notification-delivery-scope.spec.ts:116-173` | "Concurrent worker test": chỉ assert `claimDue(20)` được gọi — không real concurrency | Test gap | **Cao** |
| E-118 | `notifications.repository.ts:43-51` | Drizzle `onConflictDoNothing` có field `where?: SQL` — có thể thêm predicate | P0-1 fix available | **Cao** |

## Reproduction

### P0-1: ON CONFLICT không match partial index

Môi trường: PostgreSQL bất kỳ, Drizzle ORM.

```
Step 1: Chạy migration 0021 → unique index với WHERE clause
Step 2: Worker gọi createMany() với sourceJobId != null
Step 3: onConflictDoNothing({ target: [sourceJobId, userId] })
Step 4: PostgreSQL không tìm được matching unique arbiter
Step 5: Insert lỗi → exception → processClaimedJob catch → job FAILED

Expected: Conflict → DO NOTHING → skip duplicate, tiếp tục
Actual: Lỗi SQL → job FAILED, không notification nào được tạo
```

### P0-2: Push pipeline broken

```
Step 1: dispatch() gọi void upsertDeliveries(notification)
Step 2: upsertDeliveries upsert notification_deliveries row (PENDING)
Step 3: Job COMPLETED
Step 4: Không worker nào claimPending + gửi FCM
Step 5: notification_deliveries row stuck ở PENDING vĩnh viễn

Expected: FCM push được gửi sau khi inbox created
Actual: Push không bao giờ gửi
```

### P0-3: Inbox + delivery không atomic

```
Step 1: createMany() insert inbox rows thành công
Step 2: void upsertDeliveries() crash (DB lỗi, connection drop, ...)
Step 3: Error bị catch rỗng → silent swallow
Step 4: markCompleted() chạy → job COMPLETED
Step 5: Retry → sourceJobId conflict → DO NOTHING → dispatch không chạy
Step 6: delivery row bị thiếu vĩnh viễn

Expected: inbox + delivery trong cùng transaction, retry tạo delivery
Actual: delivery mất vĩnh viễn
```

## Observed facts

| Fact | Source |
|------|--------|
| Schema có partial unique index với WHERE clause | `notifications.ts:61-63` |
| Migration tạo partial unique index với WHERE | `0021_notification_hardening.sql:5` |
| Repository `onConflictDoNothing` chỉ có target, không where | `notifications.repository.ts:48-49` |
| `dispatch()` không gọi FCM push — chỉ upsert DB rows | `notification-dispatch.service.ts:23-28` |
| `claimPending()`, `markSent()` không có call site nào | `deliveries.repository.ts:37,64` |
| `processClaimedJob` không dùng transaction | `notification-delivery.use-case.ts:301-325` |
| `upsertDeliveries` fire-and-forget, error bị catch rỗng | `notification-dispatch.service.ts:27,52-54` |
| `markFailed()` không set `nextAttemptAt` | `deliveries.repository.ts:83-98` |
| `claimPending()` không filter `next_attempt_at <= now()` | `deliveries.repository.ts:44` |
| Job create + audit không cùng transaction | `notification-delivery.use-case.ts:123-153` |
| Job cancel + audit không cùng transaction | `notification-delivery.use-case.ts:237-256` |
| Unique index idempotency key không có organizationId | `notifications.ts:154-156` |
| `findByIdempotencyKey` không filter org | `notification-jobs.repository.port.ts:71-88` |
| Test "idempotency" chỉ mock, không test real DB | `notification-delivery-scope.spec.ts:92-114` |
| Test "concurrent worker" chỉ check claimDue limit | `notification-delivery-scope.spec.ts:116-173` |
| `sourceJobId` đã được wired đúng (fix từ Round 1) | `notification-delivery.use-case.ts:309` |
| Recipient resolution đã tenant-scoped (fix từ Round 1) | `notification-delivery.use-case.ts:349-369` |
| Org attribution đã dùng `locked.organizationId` (fix Round 1) | `notification-delivery.use-case.ts:289-293` |
| `claimDue()` đã wiring (fix từ Round 1) | `notification-delivery.use-case.ts:261-266` |
| Admin job scope đã filter org (fix từ Round 1) | `notification-delivery.use-case.ts:186-210, 212-259` |

## Hypotheses

| ID | Hypothesis | Supporting evidence | Counter evidence | Confidence |
|----|-----------|--------------------|-----------------|------------|
| H-101 | `onConflictDoNothing` thiếu `where` predicate → PostgreSQL không match partial unique index → insert error → job FAILED | E-101, E-102, E-103 | `CREATE UNIQUE INDEX` partial; `ON CONFLICT` target cần predicate matching. Nếu PostgreSQL fallback sang unique constraint khác (không có), hoặc nếu Drizzle tự động infer, có thể không lỗi. | **Cao** |
| H-102 | Push pipeline broken: delivery rows được tạo nhưng không bao giờ được processor claim → gửi FCM | E-104, E-105, E-106, E-107 | FcmPushService vẫn registered, có thể có external cron đọc bảng trực tiếp | **Cao** |
| H-103 | Inbox + delivery không atomic → crash mất push vĩnh viễn | E-108, E-109 | Nếu upsertDeliveries luôn success (không crash), vấn đề không xảy ra | **Cao** |
| H-104 | Delivery retry state machine incomplete → transient error = permanent failure | E-110, E-111 | Nếu delivery processing ít transient error, impact thấp | **Cao** |
| H-105 | Job mutation + audit không trong transaction → audit missing khi job success | E-112, E-113 | AuditWriter có thể internal retry | **Trung bình** |
| H-106 | Idempotency key không scope organization → cross-org collision | E-114, E-115 | actorId là global user ID, collision chỉ xảy ra với system-level actor | **Trung bình** |

## Code path

| Layer | File/Component | Role | Observation |
|-------|---------------|------|-------------|
| Schema | `packages/api-database/src/schema/platform/notifications.ts:61-63` | Notification table | Partial unique index `WHERE source_job_id IS NOT NULL` |
| Repository | `packages/api-platform/src/modules/notifications/infrastructure/notifications.repository.ts:48-49` | createMany | `onConflictDoNothing` thiếu `where` predicate |
| Repository | `packages/api-platform/src/modules/notifications/infrastructure/deliveries.repository.ts:37-62` | claimPending | Defined — zero production call sites |
| Repository | `packages/api-platform/src/modules/notifications/infrastructure/deliveries.repository.ts:64-81` | markSent | Defined — zero production call sites |
| Repository | `packages/api-platform/src/modules/notifications/infrastructure/deliveries.repository.ts:83-98` | markFailed | Không set `nextAttemptAt` |
| Service | `packages/api-platform/src/modules/notifications/application/services/notification-dispatch.service.ts:23-28` | dispatch | Fire-and-forget, không gọi PUSH_NOTIFIER |
| Service | `packages/api-platform/src/modules/notifications/application/services/notification-dispatch.service.ts:30-54` | upsertDeliveries | Chỉ upsert DB rows, error bị catch rỗng |
| Use case | `packages/api-platform/src/modules/notifications/application/use-cases/notification-delivery.use-case.ts:279-333` | processClaimedJob | createMany + dispatch + markCompleted — không transaction |
| Use case | `packages/api-platform/src/modules/notifications/application/use-cases/notification-delivery.use-case.ts:123-153` | createDeliveryJob | Job insert + audit — không transaction |
| Use case | `packages/api-platform/src/modules/notifications/application/use-cases/notification-delivery.use-case.ts:237-256` | cancelJob | markCancelled + audit — không transaction |
| Port | `packages/api-platform/src/modules/notifications/application/ports/notification-jobs.repository.port.ts:71-88` | findByIdempotencyKey | Không filter organizationId |
| Tests | `packages/api-platform/src/modules/notifications/application/__tests__/notification-delivery-scope.spec.ts:92-114` | Idempotency test | Mock-only, không test real DB constraint |
| Tests | `packages/api-platform/src/modules/notifications/application/__tests__/notification-delivery-scope.spec.ts:116-173` | Concurrent test | Mock-only, không real concurrency |

## Root cause

**3 P0 root causes confirmed:**

1. **P0-1 — `ON CONFLICT` target mismatch**: `onConflictDoNothing({ target: [sourceJobId, userId] })` thiếu `where: sql\`${sourceJobId} is not null\``. PostgreSQL yêu cầu conflict target predicate phải match với partial unique index predicate. Không match → insert error → job FAILED.

2. **P0-2 — Push pipeline gián đoạn**: Worker upsert `notification_deliveries` rows ở state `PENDING`, nhưng không có processor/consumer nào gọi `claimPending()` → `markSent()` để gửi FCM. `FcmPushService` registered nhưng không được inject vào production code path nào.

3. **P0-3 — Inbox + delivery không atomic**: `processClaimedJob` dùng 3 DB calls riêng rẽ (createMany, upsertDeliveries, markCompleted) không trong transaction. `void this.upsertDeliveries()` fire-and-forget, error bị catch rỗng. Retry không dispatch lại delivery rows vì `ON CONFLICT DO NOTHING` skip.

## Impact

| Area affected | Impact | Confidence |
|---------------|--------|------------|
| Inbox idempotency (P0-1) | Job delivery fail ngay khi chạy thực tế | **Cao** |
| Push notification (P0-2) | FCM push không bao giờ gửi | **Cao** |
| Delivery reliability (P0-3) | Crash mất push vĩnh viễn dù inbox đã tồn tại | **Cao** |
| Delivery retry (P1) | Transient error → permanent failure | **Cao** |
| Audit trail (P1) | Audit missing khi job success/fail | **Trung bình** |
| Cross-org idempotency (P1) | SUPER_ADMIN cross-org collision | **Thấp** |
| Test confidence | Không phát hiện DB-level bugs | **Cao** |

## Recommendation

**5 fix bắt buộc (theo thứ tự ưu tiên):**

1. **P0-1: Sửa `onConflictDoNothing`** — thêm `where: sql\`${notifications.sourceJobId} is not null\`` vào conflict target. Hoặc drop partial predicate, tạo unique index full `(source_job_id, user_id)` (PostgreSQL coi NULL ≠ NULL).

2. **P0-2: Implement `NotificationDeliveryProcessor`** — cron worker gọi `claimPending()` → load notification + device token → gửi FCM → `markSent()`/`markFailed()`. Cần `sendToToken()` API trên `FcmPushService`.

3. **P0-3: Atomic inbox + delivery** — wrap `createMany` + upsert delivery rows trong một DB transaction. Dùng `findBySourceJobAndUsers()` để lấy cả rows vừa insert lẫn rows đã tồn tại từ retry.

4. **P1: Delivery retry state machine** — `markFailed` set `nextAttemptAt` với exponential backoff; `claimPending` filter `next_attempt_at <= now()`; thêm `recoverStaleProcessing`.

5. **P1: Integration/E2E tests** — PostgreSQL integration tests cho: partial unique index conflict, delivery pipeline, inbox+delivery atomicity, job+audit atomicity.

**Non-blocking follow-ups:**
- Thêm `organizationId` vào unique constraint của idempotency key (P1)
- Job mutation + audit atomicity (P1)
- SSE transient Redis failure fallback (P2)
- Subject cleanup (P2)

## Open questions

| Question | Owner | Blocking? |
|----------|-------|-----------|
| Nên drop partial predicate hay thêm `where` vào conflict target? | DevOps/SRE | **Có** — ảnh hưởng migration script |
| Delivery processor nên là cron mới hay mở rộng job processor hiện tại? | Nhóm feature | Không |
| `sendToToken` hay `sendToUser` API cho FcmPushService? | Nhóm feature | **Có** — ảnh hưởng implementation |
| Cần thêm `organization_id` cho `notification_deliveries` table? | Nhóm feature | Không — có thể defer |

## Handoff

| Field | Value |
|-------|-------|
| Ready for planning? | **Có** — tất cả 5 blocking items đã rõ, recommendations có sẵn |
| Ready for execution? | Chưa — cần plan chi tiết và thống nhất approach cho delivery processor |
| Suggested next skill | `planning` → `execution` → `review` |
| Note | DONE.md cần flip sang "Needs fix" trước khi tiếp tục (post-done defect loop) |
