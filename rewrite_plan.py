import re

plan_content = """# Plan

> Filled by planning step-02. Strategy only — **no** full task cards (`### T-00x` with AC/Verify/Files) in this file.
> Session path: `.agents/sessions/Task-3-Task-2-feature-06-notifications`. See `TASKS.md` for executable work.

## Step ledger (mandatory — update every step)

| Step | Name | Status | Evidence |
|---|---|---|---|
| 01 | Init templates | `done` | PLAN.md + TASKS.md exist |
| 02 | Fill PLAN + Spec quality | `done` | Feasibility/Correctness/Capability filled |
| 03 | Fill TASKS inventory/cards | `todo` / `done` / `blocked` | Work inventory + cards |
| 04 | Self-check | `todo` / `done` / `blocked` | Ready Yes/No with evidence |

## Executive summary (80/20)

- **Goal**: Implement Notification Hardening for tenant isolation, deduplication, and at-least-once delivery.
- **Approach**: Database migration to support `sourceJobId` and `FOR UPDATE SKIP LOCKED`. Refactor Repositories, Use Cases, and SSE streams to strictly scope by `organizationId`.
- **Top Risk**: Inbox isolation could break existing notifications or endpoints if `organizationId` is not correctly derived from the request.
- **Readiness**: Ready to draft micro-tasks in TASKS.md.
- **Next Action**: Fill `TASKS.md` (Step 03).

## Developer overview

| Field | Value |
|---|---|
| Status | `planning` |
| Cards drafted | `0` |
| Critical open decisions | `0` |
| Next action | fill tasks |

## Charts (when useful)

N/A

## Pre-planning decision gate

| Issue ID/source | Issue / decision | Severity | Clarity | Blocking? | Visual need/format | Resolution evidence | Status |
|---|---|---|---|---|---|---|---|
| ISS-001 | Tenant Isolation missing | High | Clear | Yes | none | User confirmed `organizationId` filter | Resolved |
| ISS-002 | Idempotent Delivery missing | High | Clear | Yes | none | User confirmed `sourceJobId` and `ON CONFLICT DO NOTHING` | Resolved |

### Questions requiring user input

| Issue | Focused question | Why the plan changes | Answer |
|---|---|---|---|
| None | N/A | N/A | N/A |

## Spec quality review

### 1. Feasibility (tính khả thi)

| Finding | Evidence | Verdict |
|---|---|---|
| Postgres supports `FOR UPDATE SKIP LOCKED` and `ON CONFLICT DO NOTHING`. | User direction / Postgres features | Pass |

### 2. Correctness (tính đúng đắn)

| Finding | Evidence | Verdict |
|---|---|---|
| The current SSE and push models need `organizationId` matching and deduping logic to match actual usage constraints. | Codebase | Pass |

### 3. Capability recommendations (khả năng feature / gaps)

| Gap ID | Missing / weak capability | Suggested question / default | Blocking? | Status |
|---|---|---|---|---|
| None | N/A | N/A | No | Resolved |

## Goal

Hardening Notification Feature (Feature 06) by ensuring absolute tenant isolation, idempotency on job retries, and at-least-once deduplicated push delivery.

## Scope

- **Database**: Add `sourceJobId`, `organizationId` indices, unique constraints on `notifications` and push identities.
- **Repository**: Enforce `{ userId, organizationId }` in all inbox operations.
- **Controllers/Use Cases**: Extract `organizationId` from auth context securely.
- **Delivery**: Implement `ON CONFLICT DO NOTHING` for inbox creation and `FOR UPDATE SKIP LOCKED` for concurrent delivery safely.
- **Realtime**: Scope SSE streams by `userId + active organizationId`.
- **Tests**: Add strict tenant isolation and concurrency tests.

## Non-goals

- Exactly-once push delivery to external FCM (best-effort at-least-once is accepted).
- Notification aggregation or batching logic.

## Assumptions

| Assumption | Risk | Confirmed |
|------------|------|-----------|
| Global platform notifications (organizationId = null) will be handled separately in future iterations or via specific isolated endpoints. | Low | Yes |

## Approach

1. Run Database Migrations (T-001)
2. Update Repository Scopes (T-002)
3. Enforce Use-Case/Controller checks (T-003)
4. Implement Idempotent Inbox and Concurrency safety for worker (T-004, T-006)
5. Refactor Push delivery logic (T-005)
6. Update Real-time streams (T-007)
7. E2E and Unit testing (T-008)

## Affected areas

| Area / path | Expected change | Confidence |
|-------------|-----------------|------------|
| `packages/api-database/src/schema/platform/notifications.ts` | Add columns and indices | known |
| `packages/api-platform/src/modules/notifications/infrastructure/` | Repo scoping + worker updates | known |
| `packages/api-platform/src/modules/notifications/application/use-cases/` | Context injection + extraction | known |
| `packages/api-platform/src/modules/notifications/presentation/` | Protect endpoints | known |

## Test strategy

- Tenant Isolation: Mock users with multiple orgs, ensure Org A unread count ignores Org B.
- Duplicate Delivery: Trigger worker concurrently, verify only 1 item gets created.

## Verification strategy

- Run E2E suites.
- Test endpoint via local curl or Postman switching `x-organization-id`.

## Definition of done

- [ ] All inbox queries use `userId + organizationId`.
- [ ] No endpoint allows clients to pick arbitrary tenants.
- [ ] Job retries don't increase notification counts.
- [ ] Multiple concurrent workers don't duplicate items.
- [ ] Cross-tenant access returns 404.
- [ ] Migration includes a valid rollback.
- [ ] `TASKS.md` complete and matches Task index below

## Rollback strategy

- **Code:** Git revert.
- **Data:** Drop `source_job_id` and unique indices if needed in `down` migration.

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Missing `organizationId` in current controller methods might cause compiler errors | Medium | Adjust all callers to provide it via `AuthenticatedRequestUser`. |

## Task index

T-001 Database migration → T-002 Repository tenant scope → T-003 Controller/use-case enforcement → T-004 Idempotent inbox creation → T-005 Push delivery deduplication → T-006 Concurrency safety → T-007 SSE/realtime tenant isolation → T-008 Tests

## Handoff

- Ready for sync/execution? **No**
- Blockers: `none`
"""

with open(".agents/sessions/Task-3-Task-2-feature-06-notifications/PLAN.md", "w") as f:
    f.write(plan_content)

print("PLAN.md rewritten")
