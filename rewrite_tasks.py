import re

tasks_content = """# Tasks

> Session path: `.agents/sessions/Task-3-Task-2-feature-06-notifications`
> See `PLAN.md` for strategy, design, and architecture.

## Work inventory

| ID | Type | Description |
|---|---|---|
| T-001 | Migration | Add `sourceJobId`, indices, unique constraints on `notifications` table. |
| T-002 | Repository | Enforce `organizationId` matching in all `NotificationsRepository` inbox ops. |
| T-003 | App Layer | Extract and enforce `organizationId` from auth context in use-cases/controllers. |
| T-004 | DB Logic | Implement `INSERT ... ON CONFLICT DO NOTHING` for idempotent inbox creation. |
| T-005 | DB Logic | Push delivery deduplication (unique identity constraint `notification_id, device_token_id, channel`). |
| T-006 | DB Logic | Concurrency safety (`FOR UPDATE SKIP LOCKED` or similar atomic claim for worker). |
| T-007 | Infra | Scope SSE stream broadcast and subscription to `userId + organizationId`. |
| T-008 | Test | Strict tenant isolation and concurrent worker specs. |

## Progress board

| ID | Status | Verify | Code | Tests | Title |
|---|---|---|---|---|---|
| T-001 | `todo` | `[ ]` | `[ ]` | `[ ]` | Database migration |
| T-002 | `todo` | `[ ]` | `[ ]` | `[ ]` | Repository tenant scope |
| T-003 | `todo` | `[ ]` | `[ ]` | `[ ]` | Controller/use-case enforcement |
| T-004 | `todo` | `[ ]` | `[ ]` | `[ ]` | Idempotent inbox creation |
| T-005 | `todo` | `[ ]` | `[ ]` | `[ ]` | Push delivery deduplication |
| T-006 | `todo` | `[ ]` | `[ ]` | `[ ]` | Concurrency safety |
| T-007 | `todo` | `[ ]` | `[ ]` | `[ ]` | SSE/realtime tenant isolation |
| T-008 | `todo` | `[ ]` | `[ ]` | `[ ]` | Tests |

## Execution details

---

### T-001: Database migration

**Trace:** PLAN.md § Scope
**Status:** `todo`

**Description:**
Add `sourceJobId` (UUID, nullable) to `notifications`.
Add `UNIQUE (source_job_id, user_id)` (or with `notification_key`).
Add indices: `notifications_org_user_created_idx` (org, user, created_at DESC) and `notifications_org_user_unread_idx` (org, user, read_at).

**Work items:**
- [ ] 1. Generate new Drizzle migration.
- [ ] 2. Define `sourceJobId` column in schema.
- [ ] 3. Define unique constraints in schema.
- [ ] 4. Define indices in schema.

**Acceptance criteria:**
- Migration applies and rolls back cleanly.

**Verify:** Run `db:migrate`.

**Files:** `packages/api-database/src/schema/platform/notifications.ts`, `.sql` migration file.

---

### T-002: Repository tenant scope

**Trace:** PLAN.md § Scope
**Status:** `todo`

**Description:**
Refactor `NotificationsRepository` methods (list inbox, unread count, mark read, mark all read, delete) to strictly require `{ userId: string; organizationId: string }` and filter appropriately.

**Work items:**
- [ ] 1. Update interface definitions for repository methods to include `organizationId`.
- [ ] 2. Update implementation of `listForUser`, `countUnread`, `markAsRead`, etc., to enforce `organizationId` filter.

**Acceptance criteria:**
- Queries must match both `userId` and `organizationId`.

**Verify:** Compile backend, run unit tests.

**Files:** `packages/api-platform/src/modules/notifications/infrastructure/notifications.repository.ts`.

---

### T-003: Controller/use-case enforcement

**Trace:** PLAN.md § Scope
**Status:** `todo`

**Description:**
Ensure `NotificationInboxUseCase` and its Controller receive `organizationId` securely from the authenticated request actor context via `requireOrganizationId(actor)`. Do not read from body/query.

**Work items:**
- [ ] 1. Refactor `NotificationInboxUseCase` inputs to explicitly accept `organizationId`.
- [ ] 2. Refactor Controller to extract `requireOrganizationId` from `AuthenticatedRequestUser`.
- [ ] 3. Ensure global platform notifications handle `organizationId = null` differently/separately.

**Acceptance criteria:**
- Tenant scope is extracted implicitly from auth context.

**Verify:** Compile backend, API tests.

**Files:** `packages/api-platform/src/modules/notifications/application/use-cases/notification-inbox.use-case.ts`, `packages/api-platform/src/modules/notifications/presentation/http/notification-inbox.controller.ts`.

---

### T-004: Idempotent inbox creation

**Trace:** PLAN.md § Scope
**Status:** `todo`

**Description:**
Refactor inbox insertion to use `INSERT ... ON CONFLICT DO NOTHING` relying on the unique `source_job_id` constraint. Return `{ notification, created: boolean }` so the worker knows if it's a retry.

**Work items:**
- [ ] 1. Update `createMany` (or equivalent) in repository to handle `ON CONFLICT DO NOTHING`.
- [ ] 2. Return a mapped structure indicating `created: boolean`.

**Acceptance criteria:**
- Duplicate inserts are ignored silently but identified via return flags.

**Verify:** Unit tests simulating duplicate insert.

**Files:** `packages/api-platform/src/modules/notifications/infrastructure/notifications.repository.ts`.

---

### T-005: Push delivery deduplication

**Trace:** PLAN.md § Scope
**Status:** `todo`

**Description:**
Establish a delivery identity using `(notification_id, device_token_id, channel)` via unique constraints. Define states `PENDING`, `PROCESSING`, `SENT`, `FAILED`.

**Work items:**
- [ ] 1. Update DB schema for push delivery jobs (or add appropriate tracking columns if using existing job table).
- [ ] 2. Apply unique constraint `(notification_id, device_token_id, channel)`.
- [ ] 3. Refactor push worker to claim only non-`SENT` statuses.

**Acceptance criteria:**
- Delivery identity is unique per device/channel/notification.

**Verify:** Unit tests simulating multiple attempts to push the same message.

**Files:** `packages/api-database/src/schema/platform/notifications.ts`, `packages/api-platform/src/modules/notifications/application/use-cases/notification-delivery.use-case.ts`.

---

### T-006: Concurrency safety

**Trace:** PLAN.md § Scope
**Status:** `todo`

**Description:**
Implement `FOR UPDATE SKIP LOCKED` to allow safe, concurrent claim of delivery jobs by multiple workers.

**Work items:**
- [ ] 1. Update worker job querying to include `FOR UPDATE SKIP LOCKED` via Drizzle/Postgres.
- [ ] 2. Ensure atomic update of job status to `PROCESSING`.

**Acceptance criteria:**
- Two workers claiming at the exact same moment get different jobs.

**Verify:** Integration test firing multiple worker claims.

**Files:** `packages/api-platform/src/modules/notifications/infrastructure/notification-jobs.repository.ts`.

---

### T-007: SSE/realtime tenant isolation

**Trace:** PLAN.md § Scope
**Status:** `todo`

**Description:**
Update `NotificationStreamService` to subscribe and broadcast to channels using `userId + active organizationId`. Manage connection closure when switching orgs if required.

**Work items:**
- [ ] 1. Modify channel name generation in Redis Pub/Sub to include `organizationId`.
- [ ] 2. Update frontend SSE connection to establish context properly, or enforce context in the backend route.

**Acceptance criteria:**
- Events are only broadcast to users logged into the specific tenant.

**Verify:** E2E test with user spanning two orgs receiving stream data.

**Files:** `packages/api-platform/src/modules/notifications/infrastructure/notification-stream.service.ts`.

---

### T-008: Tests

**Trace:** PLAN.md § Scope
**Status:** `todo`

**Description:**
Add test suites enforcing criteria.

**Work items:**
- [ ] 1. Test Org A inbox doesn't contain Org B notifications.
- [ ] 2. Test Org A mark-read doesn't affect Org B.
- [ ] 3. Test retry with same `sourceJobId` doesn't duplicate.
- [ ] 4. Test concurrent workers claim separate jobs.
- [ ] 5. Test SSE isolation.

**Acceptance criteria:**
- All specs pass.

**Verify:** `npm run test` / `bun test`.

**Files:** E2E and spec files for Notifications.

---
"""

with open(".agents/sessions/Task-3-Task-2-feature-06-notifications/TASKS.md", "w") as f:
    f.write(tasks_content)

print("TASKS.md rewritten")
