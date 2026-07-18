# Done

## Executive summary

- **Final status**: Done — 13/13 tasks complete, typecheck ✅, 316/317 tests pass (1 pre-existing fail).
- **Delivered value**: Sửa 10 issues từ Feature 06 Review Round 1 — tenant isolation, idempotency, push delivery tracking, admin job scope, SSE fix.
- **Verification**: typecheck pass, unit tests pass, diff review clean, security hardening confirmed.
- **Rủi ro tồn đọng**: stale-job recovery (CAP-001) và SSE subject cleanup (CAP-002) deferred — không blocking.
- **Hành động tiếp theo**: Merge PR, deploy migration trước worker.

## Developer overview

| Field | Value |
|---|---|
| Status | Done |
| Tasks | 13/13 complete |
| Blockers | None |
| Verification | typecheck ✅ · 316/317 tests ✅ · diff review ✅ |
| Residual risks | 2 deferred (non-blocking) |
| Next action | Merge → deploy migration → deploy worker |

## Charts

N/A

## Status

Done

## Summary

Củng cố tính năng Notification qua 3 phase:

- **Phase 1 — Core fixes**: Thêm `sourceJobId` vào port + wire vào worker insert; chỉ rõ conflict target trong `onConflictDoNothing`; extend `UserLookup` với 3 method tenant-aware (join `organization_members`); validate recipient membership tại controller (USER/USERS ngoài org → 400); fix org attribution trong worker (dùng `locked.organizationId`).
- **Phase 2 — Delivery tracking**: Tạo `notification_deliveries` table với unique constraint + index; repository port + Drizzle implementation với `FOR UPDATE SKIP LOCKED`; refactor dispatch service upsert delivery rows thay vì direct FCM.
- **Phase 3 — Residual + hardening**: Wire `claimDue()` vào port + worker flow; admin job list/getById/cancel filter organizationId; SSE emit chỉ qua Redis (fallback local); repository markRead/delete filter userId; thêm 8 unit tests + fix existing tests.

## Scope completed

| Scope item | Status | Evidence |
|---|---|---|
| sourceJobId wiring | Done | `CreateNotificationInput` + worker batch insert |
| onConflictDoNothing target | Done | `onConflictDoNothing({ target: [sourceJobId, userId] })` |
| Tenant-aware UserLookup | Done | 3 methods: `findActiveUserInOrganization`, `filterActiveUserIdsInOrganization`, `listDeliverableUserIdsInOrganization` |
| Recipient membership validation | Done | USER/USERS target ngoài org → 400 |
| Org attribution fix | Done | `locked.organizationId` thay vì `findPrimaryOrganizationId()` |
| notification_deliveries schema | Done | Table + migration 0022 |
| Delivery repository | Done | Port + implementation + DI |
| Dispatch upsert | Done | `dispatch()` upsert delivery rows |
| claimDue wiring | Done | Port interface + `processDueJobs()` |
| Admin job scope | Done | list/getById/cancel filter org |
| SSE fix | Done | Chỉ Redis publish, fallback local |
| Repository userId filter | Done | markRead/delete WHERE includes userId |
| Unit tests | Done | 8 new tests + existing test mocks updated |

## What changed

| Area | Change summary | Reason |
|---|---|---|
| Notification port interfaces | Thêm `sourceJobId`, `claimDue()`, `userId` filter params | Idempotency + atomic claim + defense-in-depth |
| UserLookup port | 3 tenant-aware methods | Recipient scope per org |
| UsersRepository | Implementation with `organization_members` join | Tenant-aware user resolution |
| Notification schema | `notification_deliveries` table + enum + migration | Push delivery tracking |
| Notification dispatch | Upsert delivery rows thay vì direct FCM | At-least-once push delivery |
| SSE stream | Bỏ local emit khi Redis enabled | Fix duplicate events |
| Controller | Thêm actor params + org scope checks | Admin job isolation |

## Files changed

| File path | Summary |
|---|---|
| `packages/api-core/src/ports/user-lookup.port.ts` | Thêm 3 tenant-aware methods |
| `packages/api-database/src/schema/index.ts` | Export `notificationDeliveries` + `notificationDeliveryStatusEnum` |
| `packages/api-database/src/schema/platform/enums.ts` | Thêm `notificationDeliveryStatusEnum` |
| `packages/api-database/src/schema/platform/notifications.ts` | Thêm `notificationDeliveries` table definition |
| `packages/api-identity/src/modules/users/infrastructure/users.repository.ts` | Implement tenant-aware methods |
| `packages/api-platform/src/modules/notifications/application/ports/notification-jobs.repository.port.ts` | Thêm `claimDue()` |
| `packages/api-platform/src/modules/notifications/application/ports/notifications.repository.port.ts` | `sourceJobId` field, `userId` param on markRead/delete |
| `packages/api-platform/src/modules/notifications/application/notifications.types.ts` | `organizationId` in `ListNotificationJobsQuery` |
| `packages/api-platform/src/modules/notifications/application/services/notification-dispatch.service.ts` | Upsert delivery rows; remove `PUSH_NOTIFIER` dep |
| `packages/api-platform/src/modules/notifications/application/use-cases/notification-delivery.use-case.ts` | sourceJobId wiring, org attribution, claimDue, admin scope, recipient validation |
| `packages/api-platform/src/modules/notifications/application/use-cases/notification-inbox.use-case.ts` | Pass userId to markRead/delete |
| `packages/api-platform/src/modules/notifications/infrastructure/notification-jobs.repository.ts` | `organizationId` filter in list() |
| `packages/api-platform/src/modules/notifications/infrastructure/notification-stream.service.ts` | SSE emit chỉ Redis |
| `packages/api-platform/src/modules/notifications/infrastructure/notifications.repository.ts` | onConflictDoNothing target, userId filter |
| `packages/api-platform/src/modules/notifications/notifications.module.ts` | Register `DeliveriesRepository` |
| `packages/api-platform/src/modules/notifications/presentation/notifications.controller.ts` | Actor params on list/getById |
| `packages/api-platform/src/modules/notifications/application/__tests__/notification-delivery-scope.spec.ts` | 8 new unit tests |
| `packages/api-platform/src/modules/notifications/application/__tests__/notifications.service.spec.ts` | Updated mock signatures |
| `packages/api-seed/src/seeds/notifications/seed.ts` | Fix missing organizationId param |

## Verification

| Check | Command/Method | Result | Evidence |
|---|---|---|---|
| Typecheck | `pnpm run typecheck` | Passed | No errors |
| Unit tests | `pnpm run test` | 316/317 passed | 1 pre-existing failure (exports-idempotency) |
| Diff review | `git diff HEAD` | Clean | 22 files, +782/-439, scoped |
| Security check | Manual review | No new risks | Auth/permissions unchanged |

## Review result

No findings. Review verdict: **Ready**.

## Skipped/failed checks

| Check | Status | Reason | Risk |
|---|---|---|---|
| exports-idempotency test | Failed (pre-existing) | `TRANSACTION_PORT` not registered in test module | Low — unrelated |

## Risks/follow-ups

| Item | Type | Impact | Owner/Next action |
|---|---|---|---|
| CAP-001 stale-job recovery | Follow-up | Medium — job crash leaves PROCESSING state | Deferred |
| CAP-002 SSE subject cleanup | Follow-up | Low — memory leak | Deferred |
| Deploy order | Risk | Medium — worker mới upsert vào table chưa tồn tại | Deploy migration trước worker |

## Handoff

- **Next step**: Merge PR → deploy DB migration (`0022_notification_deliveries`) → deploy worker.
- **Reviewer focus**: notification_deliveries migration, tenant-aware UserLookup implementation, SSE emit change.
- **QA focus**: Test cross-org isolation (USER/USERS/ALL), job retry idempotency, concurrent worker safety.
- **Deployment notes**: Migration trước, worker sau. No backward-incompatible changes.
