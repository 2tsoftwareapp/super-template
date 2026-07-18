# Plan

> Strategy only — **no** full task cards (`### T-00x` with AC/Verify/Files) in this file.
> Session path: `.agents/sessions/Task-3-Task-2-feature-06-notifications`. See `TASKS.md` for executable work.

## Step ledger (mandatory — update every step)

| Step | Name | Status | Evidence |
|---|---|---|---|
| 01 | Init templates | `done` | PLAN.md + TASKS.md overwritten with fresh templates |
| 02 | Fill PLAN + Spec quality | `done` | All sections filled, questions answered |
| 03 | Fill TASKS inventory/cards | `todo` | |
| 04 | Self-check | `done` | Checks 1–14 pass; Ready=Yes | |

> **Hard rule:** Do not mark a later step `done` while an earlier step is still
> `todo`/`blocked`. Do not fill TASKS before Spec quality review is done.

## Executive summary (80/20)

- **Mục tiêu**: Sửa 4 P0 + 3 P1 + 2 P2 issues từ Feature 06 Review Round 1 — sourceJobId wiring, recipient tenant scope, org attribution, push delivery, claimDue, SSE duplicate, admin job scope, atomicity.
- **Cách tiếp cận**: 3 phases — Phase 1 (sourceJobId + recipient scope + org attribution), Phase 2 (notification_deliveries table + push retry), Phase 3 (claimDue wiring + SSE + admin scope + atomicity + E2E tests).
- **Rủi ro lớn nhất**: notification_deliveries table thay đổi architecture push delivery đáng kể; migration phải backward-compatible.
- **Mức độ sẵn sàng**: 3 blocking decisions đã resolve; sẵn sàng seed TASKS.
- **Hành động tiếp theo**: Fill TASKS step-03.

## Developer overview

| Field | Value |
|---|---|
| Status | `planning` |
| Cards drafted | `0` |
| Critical open decisions | `0` (3 resolved) |
| Next action | Fill TASKS inventory/cards |

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

### Questions requiring user input

| Issue | Focused question | Why the plan changes | Answer |
|---|---|---|---|
| INV-002 | USER/USERS target ngoài tenant: reject 400 hay silent skip? | Ảnh hưởng API contract | **Reject 400** |
| INV-004 | Push delivery: dedicated table hay simple tracking? | Ảnh hưởng scope | **Dedicated `notification_deliveries` table** |
| INV-006 | SSE duplicate: chỉ Redis pub/sub hay thêm originInstanceId? | Ảnh hưởng implementation | **Chỉ publish Redis, bỏ local emit** |

> **STOP gate passed:** All Critical issues resolved, no blocking unknowns.

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

### 2. Correctness (tính đúng đắn)

| Finding | Evidence | Verdict |
|---|---|---|
| Worker dùng `findPrimaryOrganizationId()` thay vì `locked.organizationId` | INVESTIGATE.md E-007 | **Fail** — cần sửa |
| `claimDue()` implementation có `FOR UPDATE SKIP LOCKED` đúng pattern | INVESTIGATE.md E-009 | Pass (chỉ thiếu wiring) |
| SSE channel key `{orgId}:{userId}` đã đúng format cho isolation | INVESTIGATE.md E-012 | Pass |
| Inbox repo `listForUser`, `findById` đã filter organizationId | INVESTIGATE.md (repository code) | Pass |

### 3. Capability recommendations (khả năng feature / gaps)

| Gap ID | Missing / weak capability | Suggested question / default | Blocking? | Status |
|---|---|---|---|---|
| CAP-001 | `PROCESSING` stale-job recovery: không có timeout cho job crash | Cron check `PROCESSING + updated_at < timeout → FAILED` | No | Open (deferred) |
| CAP-002 | SSE subject cleanup: subject leak khi subscriber disconnect | `finalize()` operator xóa subject khỏi Map | No | Open (deferred) |
| CAP-003 | markRead/delete repository nên filter userId trong SQL | Thêm `userId` vào WHERE của `markRead()`, `delete()` | No | Open (deferred) |

## Goal

Sửa 10 issues từ Feature 06 Review Round 1 (4 P0, 3 P1, 2 P2, 1 test gap): wire sourceJobId vào inbox insert, giới hạn recipient theo organization, gán đúng organization cho notification, thêm delivery tracking table, wiring claimDue, fix SSE duplicate, enforce admin job scope, atomic job+audit, và thêm E2E tests.

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
- **Phase 3 — Residual + hardening**:
  - Khai báo `claimDue()` trong port, gọi trong `processDueJobs()`
  - Thêm organizationId filter vào admin job list/getById/cancel
  - Audit log trong cùng transaction với job create/cancel
  - SSE: chỉ publish Redis, bỏ local emit; fallback local subject khi Redis không config
  - Thêm userId filter vào repository markRead/delete
  - E2E tests: tenant isolation, idempotency, concurrency

## Non-goals

- Không implement stale-job recovery cho PROCESSING timeout (deferred)
- Không implement SSE subject cleanup (deferred)
- Không retry push cho notification cũ (chỉ new deliveries từ fix)
- Không thay đổi mobile client (Dart) hay admin frontend (React)

## Assumptions

| Assumption | Risk | Confirmed |
|---|---|---|
| `notification_deliveries` table không cần migration rollback (add-only) | Low | Yes |
| Worker hiện tại chạy single-instance trong production | Medium | Chưa confirm — cần verify infra |
| `UserLookup` implementation có thể extend mà không break existing consumers | Low | Yes |

## Approach

1. **Phase 1 — Core fixes** (sourceJobId, recipient scope, org attribution)
2. **Phase 2 — Delivery tracking** (notification_deliveries table, upsert, retry worker)
3. **Phase 3 — Residual + hardening** (claimDue wiring, admin scope, atomicity, SSE fix, E2E tests)
4. **Tests after code** — viết test cho từng phase sau khi implement

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

## Test strategy

- **Unit tests**: sourceJobId idempotency (mock insert trùng), recipient tenant scope (mock UserLookup trả về user ngoài org → 400)
- **Integration tests**: worker processDueJobs với concurrent jobs, SSE isolation per org
- **E2E tests**: tenant isolation (list/unread/mark-read không thấy cross-org data), admin job CRUD scoped per org

## Verification strategy

- `pnpm run typecheck` — types
- `pnpm run test:unit` — unit + integration
- `pnpm run test:e2e` — E2E

## Definition of done

- [ ] sourceJobId được wire vào mọi inbox insert, retry không tạo duplicate
- [ ] Recipient resolution giới hạn theo organization: USER/USERS ngoài tenant → 400, ALL = org members
- [ ] Notification organizationId = locked.organizationId (không gọi findPrimaryOrganizationId)
- [ ] notification_deliveries table + repository + upsert + retry worker
- [ ] claimDue() được wiring (hoặc dead code bị xóa)
- [ ] SSE không emit duplicate khi Redis enabled
- [ ] Admin job list/getById/cancel filter theo organizationId
- [ ] Job mutation + audit trong cùng transaction
- [ ] Tất cả E2E tests pass
- [ ] `TASKS.md` complete

## Rollback strategy

- **Code:** Git revert commit
- **Config:** Không có config change
- **Data:** Drop `notification_deliveries` table; unique index trên notifications tự nhiên không backward-incompatible

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| notification_deliveries upsert trong cùng transaction với inbox insert có thể tăng latency | Medium | Batch size 100, measure trước deploy |
| Worker cũ (chưa update) có thể insert inbox không có delivery rows | Medium | Deploy worker trước, migration sau |
| Extend UserLookup port có thể break module khác dùng interface | Low | Add methods, không modify existing signatures |

## Task index

T-001 sourceJobId port + worker wiring → T-002 onConflictDoNothing target → T-003 Tenant-aware UserLookup → T-004 Controller membership validation + ALL scope → T-005 Fix org attribution → T-006 notification_deliveries schema + migration → T-007 Delivery repository → T-008 Refactor dispatch upsert → T-009 claimDue wiring → T-010 Admin job scope + atomic audit → T-011 SSE fix → T-012 Repository userId filter → T-013 E2E tests

## Handoff

- Ready for sync/execution? **Yes**
- Blockers: `none`
