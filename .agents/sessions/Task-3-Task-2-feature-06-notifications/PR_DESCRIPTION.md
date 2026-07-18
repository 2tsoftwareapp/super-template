## Summary

Fix 10 issues from Feature 06 Notifications Review Round 1 (4 P0, 3 P1, 2 P2, 1 test gap) across 3 phases.

## Changes

### Phase 1 — Core fixes
- **sourceJobId wiring**: Thêm `sourceJobId` vào `CreateNotificationInput` port; worker batch insert truyền `locked.id`
- **onConflictDoNothing target**: Chỉ rõ `target: [notifications.sourceJobId, notifications.userId]`
- **Tenant-aware UserLookup**: 3 methods mới (`findActiveUserInOrganization`, `filterActiveUserIdsInOrganization`, `listDeliverableUserIdsInOrganization`) join `organization_members`
- **Recipient validation**: USER/USERS target ngoài org → 400; ALL = active org members
- **Org attribution**: Worker dùng `locked.organizationId` thay vì `findPrimaryOrganizationId()`

### Phase 2 — Delivery tracking
- **notification_deliveries table**: Schema + migration 0022, unique `(notification_id, device_token_id, channel)`
- **DeliveriesRepository**: Port + Drizzle implementation with `FOR UPDATE SKIP LOCKED`
- **Dispatch upsert**: `dispatch()` upsert delivery rows thay vì direct FCM

### Phase 3 — Residual + hardening
- **claimDue wiring**: Port + worker flow uses `claimDue()` instead of `listDue()`
- **Admin job scope**: list/getById/cancel filter by `organizationId`
- **SSE fix**: Chỉ publish Redis khi enabled; fallback local subject
- **Repository userId filter**: markRead/delete WHERE includes `notifications.userId`
- **Tests**: 8 new unit tests + updated existing test mocks

## Verification

- Typecheck: ✅
- Unit tests: 316/317 passed (1 pre-existing failure unrelated)
- Diff: 22 files, +782/-439 lines

## Review notes

- Focus areas: notification_deliveries migration, tenant-aware UserLookup, SSE emit change
- Deploy order: migration trước, worker sau

## Risks / Follow-ups

- CAP-001: stale-job recovery deferred
- CAP-002: SSE subject cleanup deferred
