# INVESTIGATE — Feature 06 Review Round 3

## executive_summary

- **P0 confirmed**: `NotificationDeliveryProcessor` cron chạy ngoài mọi tenant context → `notifications` table (RLS `FORCE`) trả 0 rows → delivery bị `FAILED` với "Missing notification or device token". Cần wrap cron body trong `WORKER_DISPATCH_CONTEXT`.
- **P1 confirmed**: `SendNotificationUseCase` tạo notification + audit trong transaction, nhưng delivery upsert chạy sau commit dạng fire-and-forget. Crash giữa commit và upsert → mất push vĩnh viễn.
- **P1 confirmed**: `allInBatch` dedupe thiếu — khi retry batch có user cũ + mới, `findBySourceJobAndUsers` (cùng transaction) trả cả rows vừa insert → duplicate trong `allInBatch`, dẫn đến SSE emit 2 lần, `deliveredCount` sai.
- **P1 confirmed**: E2E test fixtures dùng fake UUIDs vi phạm FK constraints; idempotency test assertion cho phép `0 === 0` pass; chưa từng chạy dưới restricted PostgreSQL role.
- **Next action**: Sẵn sàng cho planning/execution. 4 mục đều có fix pattern rõ ràng, không cần investigation thêm.

## developer_overview

| Field | Value |
|---|---|
| Investigation status | Root Cause Confirmed (all 4 issues) |
| Strongest hypothesis | Processor thiếu `WORKER_DISPATCH_CONTEXT` → RLS chặn read notification |
| Evidence gap | (none — tất cả đều confirmed qua code path và migration) |
| Next action | Chuyển sang planning để phân bổ work items |

## charts

```mermaid
graph TD
    subgraph "P0 — Delivery Processor RLS"
        A[Cron EVERY_30_SECONDS] --> B[Không có tenant context]
        B --> C[AsyncLocalStorage = undefined]
        C --> D[Pool set app.bypass_rls = 'false']
        D --> E[notificationsRepository.findById]
        E --> F[RLS: org_id = ''::uuid? → No]
        E --> G[RLS: bypass_rls = true? → No]
        F --> H[Row bị ẩn → null]
        G --> H
        H --> I[delivery → FAILED]
    end

    subgraph "P1a — Ad-hoc delivery atomicity"
        J[SendNotificationUseCase.execute] --> K[Transaction: create notification + audit]
        K --> L[Commit transaction]
        L --> M[dispatchService.dispatch → fire-and-forget]
        M --> N[void upsertDeliveries]
        N --> O{CRASH here?}
        O -->|Yes| P[No delivery rows → push lost]
    end

    subgraph "P1b — Partial-conflict batch"
        Q[createMany(ON CONFLICT DO NOTHING)] --> R[inserted = only new rows]
        R --> S[findBySourceJobAndUsers(SAME tx)]
        S --> T[returns OLD + NEW rows]
        T --> U[allInBatch = inserted + existing]
        U --> V[Duplicates! SSE ×2, count inflated]
    end
```

## question

4 vấn đề từ Review Round 3 có confirm được không? Root cause là gì, impact ra sao, fix pattern nào?

## status

Root Cause Confirmed

## context

- HEAD: `e24f73e76f7decac8a1f5938fd5287d8b21e519c`
- Branch: `main`
- Module: `packages/api-platform/src/modules/notifications/`
- Database: PostgreSQL 16 with RLS enforced on `notifications` (migration `0004_organizations_rls.sql`) and `notification_jobs` (migration `0005_expand_organization_rls.sql`)

## evidence

| ID | Source | Observation | Supports hypothesis? | Confidence |
|---|---|---|---|---|
| E-001 | `notification-delivery.processor.ts:38-171` | `@Cron(EVERY_30_SECONDS)` chạy `processDeliveries()` không wrap trong bất kỳ `WORKER_DISPATCH_CONTEXT` nào | P0 - confirmed | High |
| E-002 | `0004_organizations_rls.sql:57-59` | `ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY; FORCE ROW LEVEL SECURITY;` + policy yêu cầu `app.tenant_id` match hoặc `app.bypass_rls = 'true'` | P0 - confirmed | High |
| E-003 | `tenant-context.ts` | `createTenantAwarePool` đọc context từ `AsyncLocalStorage`; cron không set context → `app.bypass_rls = 'false'`, `app.tenant_id = ''` | P0 - confirmed | High |
| E-004 | `send-notification.use-case.ts:74-120` | `persist` transaction chỉ tạo notification + audit; `dispatch()` gọi sau commit, `void upsertDeliveries()` | P1a - confirmed | High |
| E-005 | `notification-delivery.use-case.ts:336-360` | `createMany` với `ON CONFLICT DO NOTHING` → `inserted` chỉ có rows mới; `findBySourceJobAndUsers(locked.id, batch, tx)` query cùng transaction → trả cả rows cũ + rows vừa insert → `allInBatch` duplicate | P1b - confirmed | High |
| E-006 | `notifications.repository.ts` | `findBySourceJobAndUsers` nhận cùng `tx` executor với `createMany` → thấy rows vừa insert trong cùng transaction | P1b - confirmed | High |
| E-007 | Code review notes | E2E tests dùng fake UUIDs (`000...001`) không tồn tại trong DB → FK violation khi chạy PostgreSQL thật | P1c - confirmed | Medium |
| E-008 | Existing pattern: `process-jobs.use-case.ts` | `ProcessJobsUseCase` wrap `claimDueJobs` trong `WORKER_DISPATCH_CONTEXT`, sau đó mỗi job chạy trong `tenantContextForJob` | P0 fix pattern | High |
| E-009 | Existing pattern: `notification-delivery.use-case.ts:254-260` | `processDueJobs` đã dùng `WORKER_DISPATCH_CONTEXT` cho claim job → delivery processor chưa follow pattern | P0 - gap | High |

## reproduction

### P0 — Processor RLS context

| Step | Action | Expected | Actual |
|---|---|---|---|
| 1 | `notification_deliveries` có row PENDING với notificationId hợp lệ | Row sẵn sàng để xử lý | — |
| 2 | Cron `processDeliveries()` claim delivery | Delivery claimed thành công | — |
| 3 | `notificationsRepository.findById(notificationId)` | Trả notification row | RLS chặn → trả null |
| 4 | Processor check `if (!notification)` | Không vào | Vào → mark FAILED |

### P1a — Ad-hoc delivery atomicity

| Step | Action | Expected | Actual |
|---|---|---|---|
| 1 | `SendNotificationUseCase.execute()` tạo notification | Transaction commit | — |
| 2 | Crash xảy ra ngay sau commit, trước khi `upsertDeliveries` chạy | — | — |
| 3 | Notification tồn tại trong DB | Push notification được gửi | Không có `notification_deliveries` row → không ai retry push |

### P1b — Partial-conflict batch duplicate

| Step | Action | Expected | Actual |
|---|---|---|---|
| 1 | Retry job với batch [user-a, user-b], user-a đã có row | — | — |
| 2 | `createMany` insert user-b → `inserted = [row-b]` | — | — |
| 3 | `findBySourceJobAndUsers(locked.id, [user-a, user-b], tx)` | `existing = [row-a]` | `existing = [row-a, row-b]` (thấy row-b vừa insert) |
| 4 | `allInBatch = [...inserted, ...existing]` | `[row-b, row-a]` | `[row-b, row-a, row-b]` (duplicate) |
| 5 | `deliveredCount += allInBatch.length` | 2 | 3 (sai) |
| 6 | SSE emit | 1 per user | user-b nhận 2 SSE events |

## observed_facts

| Fact | Source |
|---|---|
| `notifications` có `ENABLE ROW LEVEL SECURITY` + `FORCE ROW LEVEL SECURITY` | `0004_organizations_rls.sql:57-58` |
| `notifications` policy: `organization_id = app.tenant_id OR app.bypass_rls = 'true'` | `0004_organizations_rls.sql:59` |
| `notification_deliveries` không có RLS (migration 0022 không enable) | `0022_notification_deliveries.sql` |
| `NotificationDeliveryProcessor` cron không inject `TenantContextService` | `notification-delivery.processor.ts:25-36` |
| `ProcessJobsUseCase` và `NotificationDeliveryUseCase.processDueJobs` dùng `WORKER_DISPATCH_CONTEXT` | `process-jobs.use-case.ts`, `notification-delivery.use-case.ts:254-260` |
| `SendNotificationUseCase` transaction chỉ gồm create notification + audit log | `send-notification.use-case.ts:74-114` |
| `NotificationDispatchService.dispatch()` gọi `void upsertDeliveries()` ngoài transaction | `notification-dispatch.service.ts:24-27` |
| `findBySourceJobAndUsers` nhận cùng `tx` executor như `createMany` | `notification-delivery.use-case.ts:339, 333` |
| `allInBatch` không dedupe trước khi dùng cho delivery upsert và SSE | `notification-delivery.use-case.ts:342` |
| E2E tests dùng UUIDs dạng `000...001` không có trong fixtures | Code review |

## hypotheses

| Hypothesis | Supporting evidence | Counter evidence | Verification method | Confidence |
|---|---|---|---|---|
| H-001 (P0): Cron thiếu `WORKER_DISPATCH_CONTEXT` → RLS chặn read notification | E-001, E-002, E-003, E-008, E-009 | `notification_deliveries` không có RLS, nhưng processor chỉ claim delivery (pass), sau đó read notification (fail) | Inject mock logger + kiểm tra delivery FAILED count | High |
| H-002 (P1a): Ad-hoc send mất push nếu crash giữa commit và delivery upsert | E-004 | Trong thực tế crash window rất nhỏ (ms), nhưng vẫn tồn tại. Không thể recovery vì không có delivery row | Simulate crash: process.exit(0) sau commit, verify không có delivery row | High |
| H-003 (P1b): `findBySourceJobAndUsers` trong cùng transaction trả cả rows vừa insert → duplicate | E-005, E-006 | — | Add runtime dedupe, count unique IDs | High |

## root_cause

### P0 — Delivery processor RLS context (confirmed)
`NotificationDeliveryProcessor.processDeliveries()` chạy trong cron context không có bất kỳ tenant context nào. `createTenantAwarePool` đọc `AsyncLocalStorage` thấy `undefined`, set `app.bypass_rls = 'false'` và `app.tenant_id = ''`. Khi processor gọi `notificationsRepository.findById(id)`, RLS policy trên `notifications` (FORCE RLS) filter: `organization_id = ''::uuid` (NULL, không match) OR `app.bypass_rls = 'true'` (false). Row không được trả về → processor thấy `notification === null` → mark delivery FAILED.

`ProcessJobsUseCase` và `NotificationDeliveryUseCase.processDueJobs` đã có pattern đúng: claim cross-tenant trong `WORKER_DISPATCH_CONTEXT`, process per-job trong `tenantContextForJob(job)`.

### P1a — Ad-hoc send delivery atomicity (confirmed)
Send path tách delivery upsert khỏi mutation transaction. Notification + audit log được persist atomic, nhưng delivery rows được upsert sau commit dạng fire-and-forget. Nếu tiến trình crash hoặc throw ở khoảng trống này, deliver rows không tồn tại và không có cơ chế retry nào (processor chỉ biết đến delivery rows có trong DB).

### P1b — Partial-conflict batch duplicate (confirmed)
`allInBatch = [...inserted, ...existing]` với `existing` = `findBySourceJobAndUsers(locked.id, batch, tx)` chạy cùng transaction với `createMany`. Do đó `existing` chứa cả rows cũ (từ lần retry trước) và rows vừa được `createMany` insert trong transaction này. Thiếu deduplication dẫn đến duplicate SSE emissions và `deliveredCount` sai.

## impact

| Area affected | Impact | Confidence |
|---|---|---|
| Push notification delivery (cron path) | Delivery processor không gửi được FCM dưới restricted role — tất cả delivery bị FAILED. **Production blocker.** | High |
| Ad-hoc notification send (generic handler path) | Silent data loss: notification tồn tại nhưng push không bao giờ đến device. | High |
| Retry delivery (partial-conflict batch) | SSE emit duplicate thông báo; deliveredCount trong notification_jobs sai — không tracking được delivery accuracy. | High |
| E2E test suite | Tests không pass dưới restricted role; FK violation với fake UUIDs; tests không thể dùng để validate production behavior. | Medium |

## recommendation

### Fix order

1. **P0 — Wrap delivery processor trong `WORKER_DISPATCH_CONTEXT`**
   - Inject `TenantContextService` vào `NotificationDeliveryProcessor`
   - Wrap toàn bộ body của `processDeliveries()` (trừ `this.processing = true/false`) trong `this.tenantContextService.runAsync(WORKER_DISPATCH_CONTEXT, () => ...)`
   - Như pattern của `ProcessJobsUseCase.execute()` và `NotificationDeliveryUseCase.processDueJobs()`

2. **P1a — Đưa delivery upsert vào transaction trong ad-hoc send**
   - Inject `DELIVERIES_REPOSITORY` vào `SendNotificationUseCase`
   - Trong `persist` callback, sau khi create notification → `upsertDeliveriesForNotification(view, tx)` — method này đã có optional executor parameter
   - Chỉ emit SSE sau khi transaction commit
   - `dispatch()` chỉ gọi khi caller không muốn deferred dispatch hoặc dispatch đơn giản là emit SSE

3. **P1b — Dedupe `allInBatch`**
   - Dùng `Map<id, NotificationRecord>` để dedupe trước khi loop:
     ```typescript
     const allInBatch = [...new Map(
       [...inserted, ...existing].map(row => [row.id, row]),
     ).values()];
     ```

4. **P1c — Sửa E2E test fixtures**
   - Tạo notification và device token thật trước khi insert delivery trong test
   - Reset job về PENDING hoặc gọi `processClaimedJob` qua test seam
   - Assert notification rows > 0, không chỉ uniqueUserIds check
   - Chạy `pnpm --filter api test:e2e` dưới restricted app role

### Follow-up (P2)
- `recoverStaleProcessing` nên kiểm tra `attempts >= max` trước khi recover
- Notification job stale recovery cho `notification_jobs` PROCESSING
- Xóa `rewrite_plan*.py`, `rewrite_tasks*.py` scripts ở root nếu không dùng nữa

## open_questions

| Question | Owner | Blocking? |
|---|---|---|
| (none — tất cả đều confirmed với code path evidence) | — | No |

## handoff

- **Ready for planning?** Yes
- **Ready for execution?** Yes (fix patterns rõ ràng, có sẵn trong codebase)
- **Suggested next skill**: `planning` — tạo PLAN.md + TASKS.md cho 4 mục, ưu tiên P0 trước
