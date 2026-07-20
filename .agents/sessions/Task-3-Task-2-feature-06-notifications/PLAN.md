# Plan

> Strategy only — **no** full task cards (`### T-00x` with AC/Verify/Files) in this file.
> Session path: `.agents/sessions/Task-3-Task-2-feature-06-notifications`. See `TASKS.md` for executable work.

## Step ledger (mandatory — update every step)

| Step | Name | Status | Evidence |
|---|---|---|---|---|
| 01 | Init templates | `done` | PLAN.md + TASKS.md from Round 1, kept per user decision |
| 02 | Fill PLAN + Spec quality (Round 1) | `done` | Round 1 plan completed, executed, reviewed |
| 02b | Fill PLAN + Spec quality (Round 2) | `done` | Updated with Round 2 findings from INVESTIGATE.md |
| 03 | Fill TASKS inventory/cards | `done` | Work inventory, 5 Round 2 cards (T-002b, T-014→T-017), execution order, progress board |
| 04 | Self-check | `done` | Checks 1–18 pass; Ready=Yes; blockers=none |

> **Hard rule:** Do not mark a later step `done` while an earlier step is still
> `todo`/`blocked`. Do not fill TASKS before Spec quality review is done.

## Executive summary (80/20)

- **Mục tiêu (Round 2)**: Fix 5 blocking items còn lại sau Review Round 2 — sửa `onConflictDoNothing` where predicate, implement `NotificationDeliveryProcessor` gửi FCM, atomic inbox+delivery transaction, delivery retry/backoff, integration tests.
- **Round 1 scope**: Đã done (tenant isolation, sourceJobId wiring, claimDue, SSE fix, admin scope). Giữ nguyên.
- **Cách tiếp cận**: 4 phases — Phase 1 (Round 1 core fixes — giữ), Phase 2 (Round 1 delivery tracking — giữ), Phase 3 (Round 1 residual — giữ), Phase 4 (Round 2 fixes — delivery processor, atomicity, retry, tests).
- **Rủi ro lớn nhất**: Delivery processor yêu cầu thêm `sendToToken()` API trên `FcmPushService` — có thể ảnh hưởng existing push interface.
- **Hành động tiếp theo**: Complete TASKS step-03 → tự kiểm tra step-04 → execution.

## Developer overview

| Field | Value |
|---|---|---|
| Status | `planning` |
| Cards drafted | `5` (Round 2) + `13` (Round 1 done) |
| Critical open decisions | `0` — all INVs resolved; Round 2 findings have clear fixes from INVESTIGATE.md |
| Next action | Complete TASKS step-03, then self-check step-04 |

## Charts (when useful)

N/A

## Pre-planning decision gate

| Issue ID/source | Issue / decision | Severity | Clarity | Blocking? | Visual need/format | Resolution evidence | Status |
|---|---|---|---|---|---|---|---|
| INV-001 | `sourceJobId` không wire → idempotency không hoạt động | Critical | Clear | Yes | none | Confirmed by INVESTIGATE.md E-001→E-004 | Resolved |
| INV-002 | Recipient resolution không tenant-scoped → cross-tenant delivery | Critical | Clear | Yes | none | User chọn **Reject 400** khi target user ngoài tenant | Resolved |
| INV-003 | Notification org attribution dùng primaryOrg → sai tenant | Critical | Clear | Yes | none | Dùng `locked.organizationId` thay vì `findPrimaryOrganizationId()` | Resolved |
| INV-004 | Push delivery thiếu retry/dedup → mất push | Critical | Clear | Yes | none | User chọn **dedicated `notification_deliveries` table** | Resolved |
| INV-005 | `claimDue()` dead code → processDueJobs không atomic | High | Clear | No | none | Wire `claimDue()` vào port + worker | Resolved |
| INV-006 | SSE duplicate khi Redis bật | High | Partial | No | none | User chọn **chỉ publish Redis** (bỏ local emit) | Resolved |
| INV-007 | Admin job CRUD không enforce org | High | Clear | No | none | Thêm organizationId filter vào list/getById + cancel | Resolved |
| INV-008 | Job mutation + audit không atomic | High | Clear | No | none | Audit log trong cùng transaction với job mutation | Resolved |
| R2-001 | `ON CONFLICT` thiếu `where` predicate — không match partial unique index | Critical | Clear | Yes | none | Confirmed by INVESTIGATE.md E-101→E-103 | Resolved |
| R2-002 | Push pipeline broken — `claimPending`/`markSent` không ai gọi | Critical | Clear | Yes | none | Confirmed by E-104→E-107. Cần `NotificationDeliveryProcessor` | Resolved |
| R2-002a | `FcmPushService` cần method `sendToToken()` cho per-token delivery | High | Clear | No | none | `sendToUser()` hiện tại gửi batch; processor cần per-token result | Open |
| R2-003 | Inbox + delivery không atomic — `void upsertDeliveries` fire-and-forget | Critical | Clear | Yes | none | Confirmed by E-108→E-109. Cần atomic transaction | Resolved |
| R2-004 | Delivery retry state machine incomplete — no backoff | High | Clear | No | none | Confirmed by E-110→E-111. Deferrable? | Resolved |
| R2-005 | Job + audit không atomic trong create/cancel | High | Clear | No | none | Confirmed by E-112→E-113. Fix cùng Round 2 | Resolved |
| R2-006 | Idempotency key unique constraint không scope organizationId | Medium | Clear | No | none | Confirmed by E-114→E-115 | Resolved |
| R2-007 | Tests mock-only — không phát hiện DB-level bugs | High | Clear | No | none | Confirmed by E-116→E-117. Cần integration tests | Resolved |

### Questions requiring user input

| Issue | Focused question | Why the plan changes | Answer |
|---|---|---|---|
| INV-002 | USER/USERS target ngoài tenant: reject 400 hay silent skip? | Ảnh hưởng API contract | **Reject 400** |
| INV-004 | Push delivery: dedicated table hay simple tracking? | Ảnh hưởng scope | **Dedicated `notification_deliveries` table** |
| INV-006 | SSE duplicate: chỉ Redis pub/sub hay thêm originInstanceId? | Ảnh hưởng implementation | **Chỉ publish Redis, bỏ local emit** |
| R2-001 | Drop partial predicate (non-partial unique index) hay thêm `where` vào conflict target? | Ảnh hưởng migration strategy — INVESTIGATE.md recommend drop partial | Não blocking — both approaches work |
| R2-002 | Thêm method `sendToToken()` mới trên PushNotifier hay extend `sendToUser()`? | Ảnh hưởng push interface; recommend thêm `sendToToken()` mới, backward-compatible | Não blocking — implement `sendToToken` method mới |

> **STOP gate passed:** All Critical issues resolved or have clear recommended fixes. Questions above là implementation preference, không blocking.

## Spec quality review

### 1. Feasibility (tính khả thi)

| Finding | Evidence | Verdict |
|---|---|---|
| sourceJobId wiring: sửa port `CreateNotificationInput` + use-case batch insert — 3 files, low risk | INVESTIGATE.md E-001→E-004 | Pass |
| Recipient tenant scope: extend `UserLookup` port + implementation + controller validation — medium changeset | INVESTIGATE.md E-005→E-006 | Pass |
| Org attribution: bỏ `findPrimaryOrganizationId()` trong worker — 1 line change, low risk | INVESTIGATE.md E-007 | Pass |
| notification_deliveries table: new DB migration + schema + repository + retry worker — largest scope | INVESTIGATE.md E-008, user decision | Pass-with-gaps |
| claimDue wiring: thêm port method + gọi trong worker — 2 files, low risk | INVESTIGATE.md E-009→E-011 | Pass |
| SSE duplicate: bỏ local `subject.next()` trong emit — 1 line + fallback logic | INVESTIGATE.md E-012→E-013, user decision | Pass |
| **R2 — ON CONFLICT where predicate**: thêm 1 field trong `onConflictDoNothing` config — 1 line | INVESTIGATE.md E-101→E-103 | Pass |
| **R2 — NotificationDeliveryProcessor**: new class, cron, FcmPushService.sendToToken() — medium scope | INVESTIGATE.md E-104→E-107 | Pass |
| **R2 — Atomic inbox+delivery**: wrap 2 DB calls trong 1 transaction — refactor effort, cần careful | INVESTIGATE.md E-108→E-109 | Pass-with-gaps |
| **R2 — Delivery retry backoff**: sửa `markFailed` set `nextAttemptAt`, sửa `claimPending` filter | INVESTIGATE.md E-110→E-111 | Pass |
| **R2 — Integration tests**: testcontainers hoặc test DB, cần infra setup | INVESTIGATE.md E-116→E-117 | Pass-with-gaps |

### 2. Correctness (tính đúng đắn)

| Finding | Evidence | Verdict |
|---|---|---|
| Worker dùng `findPrimaryOrganizationId()` thay vì `locked.organizationId` | INVESTIGATE.md E-007 | **Fail** — cần sửa (done in Round 1) |
| `claimDue()` implementation có `FOR UPDATE SKIP LOCKED` đúng pattern | INVESTIGATE.md E-009 | Pass (done in Round 1) |
| SSE channel key `{orgId}:{userId}` đã đúng format cho isolation | INVESTIGATE.md E-012 | Pass |
| Inbox repo `listForUser`, `findById` đã filter organizationId | INVESTIGATE.md (repository code) | Pass (done in Round 1) |
| **R2 — ON CONFLICT target không match partial index** | INVESTIGATE.md E-101→E-103 | **Fail** — cần sửa conflict target |
| **R2 — Push pipeline gián đoạn: claimPending/markSent dead code** | INVESTIGATE.md E-104→E-107 | **Fail** — cần delivery processor |
| **R2 — Inbox+delivery không atomic: retry mất push** | INVESTIGATE.md E-108→E-109 | **Fail** — cần atomic transaction |
| **R2 — markFailed không set nextAttemptAt** | INVESTIGATE.md E-110→E-111 | **Fail** — cần fix retry state machine |

### 3. Capability recommendations (khả năng feature / gaps)

| Gap ID | Missing / weak capability | Suggested question / default | Blocking? | Status |
|---|---|---|---|---|---|
| CAP-001 | `PROCESSING` stale-job recovery: không có timeout cho job crash | Cron check `PROCESSING + updated_at < timeout → FAILED` | No | Open (deferred) |
| CAP-002 | SSE subject cleanup: subject leak khi subscriber disconnect | `finalize()` operator xóa subject khỏi Map | No | Open (deferred) |
| CAP-003 | markRead/delete repository nên filter userId trong SQL | Thêm `userId` vào WHERE của `markRead()`, `delete()` | No | Open (done in Round 1) |
| CAP-004 | `onConflictDoNothing` thiếu `where` predicate cho partial unique index | Thêm `where: sql\`${sourceJobId} is not null\`` hoặc drop partial predicate | **Yes (P0)** | Resolved |
| CAP-005 | Push delivery processor missing — FCM không bao giờ gửi | Implement `NotificationDeliveryProcessor` với `claimPending()` → `FcmPushService.sendToToken()` | **Yes (P0)** | Resolved |
| CAP-006 | Inbox + delivery không atomic — retry mất push | Wrap `createMany` + upsert deliveries trong DB transaction | **Yes (P0)** | Resolved |
| CAP-007 | Delivery retry không có backoff | `markFailed` set `nextAttemptAt` với exponential backoff; `claimPending` filter `<= now()` | No | Open (in Round 2 scope) |
| CAP-008 | Job idempotency key không scope organizationId | Thêm `organizationId` vào unique constraint | No | Open (deferrable) |
| CAP-009 | Integration tests với real DB còn thiếu | PostgreSQL integration tests cho ON CONFLICT, delivery pipeline, atomicity | No | Open (in Round 2 scope) |

**Round 2 Spec quality verdict:** Feasibility Pass (các fix đều trong module notifications, không thay đổi cross-cutting). Correctness Pass (fix confirmed bằng code analysis). Capability gaps CAP-005→CAP-007 đều resolved với clear approach. CAP-009 (integration tests) in scope.

## Goal

Sửa 5 blocking items từ Review Round 2 (3 P0, 2 P1) trên nền Round 1 đã hoàn thành: sửa `ON CONFLICT` target match partial unique index, implement `NotificationDeliveryProcessor` gửi FCM, atomic inbox+delivery transaction, delivery retry/backoff state machine, và integration tests với PostgreSQL thật.

## Scope

- **Phase 1 — Core fixes**:
  - Thêm `sourceJobId` vào `CreateNotificationInput` port
  - Worker `processJob()` truyền `locked.id` làm `sourceJobId`
  - Chỉ rõ conflict target trong `onConflictDoNothing`
  - Extend `UserLookup` port với method tenant-aware: `findActiveUserInOrganization`, `filterActiveUserIdsInOrganization`, `listDeliverableUserIdsInOrganization`
  - Controller validate membership: USER/USERS target ngoài tenant → 400
  - `ALL` audience = active members của `locked.organizationId`
  - Worker dùng `locked.organizationId` thay vì `findPrimaryOrganizationId()`
- **Phase 2 — Delivery tracking**:
  - Tạo `notification_deliveries` table: `id`, `notification_id`, `device_token_id`, `channel`, `status`, `attempts`, `provider_message_id`, `next_attempt_at`, `sent_at`, `last_error`
  - Unique `(notification_id, device_token_id, channel)`
  - Worker upsert delivery rows trong cùng transaction với inbox insert
  - Delivery retry worker claim PENDING deliveries, send FCM, mark SENT/FAILED
- **Phase 3 — Residual + hardening** (Round 1 — done):
  - Khai báo `claimDue()` trong port, gọi trong `processDueJobs()`
  - Thêm organizationId filter vào admin job list/getById/cancel
  - Audit log trong cùng transaction với job create/cancel
  - SSE: chỉ publish Redis, bỏ local emit; fallback local subject khi Redis không config
  - Thêm userId filter vào repository markRead/delete
  - E2E tests: tenant isolation, idempotency, concurrency
- **Phase 4 — Round 2 fixes**:
  - **R2-001**: Sửa `onConflictDoNothing` thêm `where: sql\`${notifications.sourceJobId} is not null\`` (hoặc drop partial predicate, tạo non-partial unique index)
  - **R2-002**: Implement `NotificationDeliveryProcessor` — cron worker claim PENDING delivery rows, gửi FCM via `FcmPushService.sendToToken()`, mark SENT/FAILED
  - **R2-003**: Atomic inbox + delivery — wrap `createMany` + upsert deliveries trong 1 DB transaction; thêm `findBySourceJobAndUsers()` cho retry path
  - **R2-004**: Delivery retry/backoff — `markFailed` set `nextAttemptAt` với exponential backoff; `claimPending` filter `next_attempt_at <= now()`; thêm `recoverStaleProcessing`
  - **R2-005**: Integration tests — PostgreSQL test cho: partial unique index + ON CONFLICT, delivery pipeline end-to-end, atomicity (inbox+delivery rollback), retry backoff, stale recovery

## Non-goals

- Không implement stale-job recovery cho PROCESSING timeout (deferred)
- Không implement SSE subject cleanup (deferred)
- Không retry push cho notification cũ (chỉ new deliveries từ fix)
- Không thay đổi mobile client (Dart) hay admin frontend (React)
- Không thêm `organizationId` vào idempotency key unique constraint (R2-006 — defer, low impact)
- Không thêm `organizationId` column cho `notification_deliveries` table (có thể defer)

## Assumptions

| Assumption | Risk | Confirmed |
|---|---|---|
| `notification_deliveries` table không cần migration rollback (add-only) | Low | Yes |
| Worker hiện tại chạy single-instance trong production | Medium | Chưa confirm — cần verify infra |
| `UserLookup` implementation có thể extend mà không break existing consumers | Low | Yes |

## Approach

1. **Phase 1 — Core fixes** (sourceJobId, recipient scope, org attribution) — done
2. **Phase 2 — Delivery tracking** (notification_deliveries table, upsert, retry worker) — done
3. **Phase 3 — Residual + hardening** (claimDue wiring, admin scope, atomicity, SSE fix, E2E tests) — done
4. **Phase 4 — Round 2 fixes** (thứ tự thực hiện):
   - 4a. **R2-001**: Sửa `ON CONFLICT` where predicate — 1 line + optional migration
   - 4b. **R2-003**: Atomic inbox+delivery transaction — refactor `processClaimedJob`
   - 4c. **R2-002**: `NotificationDeliveryProcessor` — new cron worker gửi FCM
   - 4d. **R2-004**: Delivery retry/backoff — sửa `markFailed` + `claimPending`
   - 4e. **R2-005**: Integration tests — PostgreSQL tests cho toàn bộ pipeline
5. **Tests after code** — integration tests viết sau implement (trong Phase 4e)

## Affected areas

| Area / path | Expected change | Confidence |
|---|---|---|
| `packages/api-platform/.../notifications/application/ports/notifications.repository.port.ts` | Thêm `sourceJobId` vào `CreateNotificationInput` | known |
| `packages/api-platform/.../notifications/application/use-cases/notification-delivery.use-case.ts` | sourceJobId wiring, org attribution fix, claimDue, admin scope, atomicity | known |
| `packages/api-platform/.../notifications/infrastructure/notifications.repository.ts` | onConflictDoNothing target | known |
| `packages/api-platform/.../notifications/infrastructure/notification-jobs.repository.ts` | claimDue port wiring | known |
| `packages/api-platform/.../notifications/application/ports/notification-jobs.repository.port.ts` | Thêm `claimDue()` vào interface | known |
| `packages/api-core/.../ports/user-lookup.port.ts` | Thêm tenant-aware methods | known |
| `packages/api-identity/.../users/infrastructure/users.repository.ts` | Implement tenant-aware methods | known |
| `packages/api-platform/.../notifications/presentation/notifications.controller.ts` | Validate recipient membership, admin job scope | known |
| `packages/api-platform/.../notifications/infrastructure/notification-stream.service.ts` | SSE: chỉ publish Redis, bỏ local emit | known |
| `packages/api-database/.../schema/platform/notifications.ts` | Thêm `notification_deliveries` table schema | known |
| `apps/api/drizzle/` | Migration file cho notification_deliveries | known |
| `packages/api-platform/.../notifications/application/services/notification-dispatch.service.ts` | Refactor dispatch để upsert delivery rows | known |
| `packages/api-platform/.../notifications/infrastructure/notifications.repository.ts` | **R2-001**: Thêm `where` vào `onConflictDoNothing` | known |
| `apps/api/drizzle/` | **R2-001**: Optional migration sửa unique index | known |
| `packages/api-platform/.../notifications/application/services/notification-delivery.processor.ts` | **R2-002**: New file — delivery processor cron worker | inferred |
| `packages/api-core/.../ports/push.interface.ts` | **R2-002**: Thêm `sendToToken()` method vào push interface | known |
| `packages/api-platform/.../notifications/infrastructure/fcm-push.service.ts` | **R2-002**: Implement `sendToToken()` — gửi FCM tới 1 token | known |
| `packages/api-platform/.../notifications/notifications.module.ts` | **R2-002**: Register delivery processor | known |
| `packages/api-platform/.../notifications/application/use-cases/notification-delivery.use-case.ts` | **R2-003**: Transaction wrap quanh createMany + dispatch | known |
| `packages/api-platform/.../notifications/infrastructure/deliveries.repository.ts` | **R2-004**: Sửa `markFailed` set `nextAttemptAt`, sửa `claimPending` filter | known |
| `packages/api-platform/.../notifications/application/ports/deliveries.repository.port.ts` | **R2-004**: Thêm `markRetryable` method | known |
| `packages/api-platform/.../notifications/infrastructure/__tests__/` | **R2-005**: New integration test files | inferred |

## Test strategy

- **Unit tests**: Round 1 done (13 tests). Giữ nguyên.
- **Integration tests (R2-005)**: PostgreSQL integration tests cho:
  - Partial unique index + ON CONFLICT WHERE predicate — insert trùng sourceJobId + userId → row không duplicate
  - Delivery pipeline end-to-end — upsert → processor claim → markSent
  - Inbox + delivery atomicity — transaction rollback không leave orphan
  - Delivery retry backoff — markFailed set nextAttemptAt → claimPending bỏ qua đến hạn
  - Stale PROCESSING recovery — quá timeout → recover thành PENDING
  - Job creation + audit atomicity — rollback audit khi job insert fail

## Verification strategy

- `pnpm run typecheck` — types
- `pnpm run test:unit` — unit + integration
- `pnpm run test:e2e` — E2E

## Definition of done

**Round 1 (done):**
- [x] sourceJobId được wire vào mọi inbox insert, retry không tạo duplicate
- [x] Recipient resolution giới hạn theo organization: USER/USERS ngoài tenant → 400, ALL = org members
- [x] Notification organizationId = locked.organizationId (không gọi findPrimaryOrganizationId)
- [x] notification_deliveries table + repository + upsert
- [x] claimDue() được wiring
- [x] SSE không emit duplicate khi Redis enabled
- [x] Admin job list/getById/cancel filter theo organizationId
- [x] Repository markRead/delete filter userId
- [x] `pnpm run typecheck` pass
- [x] Unit tests pass

**Round 2 (must fix):**
- [ ] `onConflictDoNothing` có `where` predicate match partial unique index (hoặc non-partial index)
- [ ] `NotificationDeliveryProcessor` claim PENDING → gửi FCM → mark SENT/FAILED
- [ ] Inbox insert + delivery rows trong cùng transaction (atomic)
- [ ] `findBySourceJobAndUsers()` cho retry path (không skip dispatch)
- [ ] Delivery retry/backoff: `markFailed` set `nextAttemptAt`, `claimPending` filter `<= now()`
- [ ] `recoverStaleProcessing(timeoutMinutes)` — PROCESSING quá timeout → PENDING/FAILED
- [ ] Integration tests PostgreSQL pass (7 tests)
- [ ] `TASKS.md` complete

## Rollback strategy

- **Code:** Git revert commit
- **Config:** Không có config change
- **Data:** Drop `notification_deliveries` table; unique index trên notifications — nếu drop partial và recreate non-partial, cần migration rollback

## Risks

| Risk | Impact | Mitigation |
|---|---|---|---|
| notification_deliveries upsert trong cùng transaction với inbox insert có thể tăng latency | Medium | Batch size 100, measure trước deploy |
| Worker cũ (chưa update) có thể insert inbox không có delivery rows | Medium | Deploy worker trước, migration sau |
| Extend UserLookup port có thể break module khác dùng interface | Low | Add methods, không modify existing signatures |
| FcmPushService.sendToToken() mới có thể khác semantics với sendToUser() hiện tại | Medium | Unit test + integration test verify |
| Integration tests cần PostgreSQL thật — CI may không có sẵn | Medium | Dùng testcontainers hoặc docker compose |

## Task index

**Round 1 (done):** T-001 → T-002 → T-003 → T-004 → T-005 → T-006 → T-007 → T-008 → T-009 → T-010 → T-011 → T-012 → T-013
**Round 2:** T-002b ON CONFLICT where predicate → T-015 Atomic inbox+delivery → T-014 NotificationDeliveryProcessor → T-016 Delivery retry/backoff → T-017 Integration tests

## Handoff

- Ready for sync/execution? **Yes** (sau khi step-04 self-check pass)
- Blockers: `none` (Round 2 findings đều có clear fix approach, questions not blocking)
