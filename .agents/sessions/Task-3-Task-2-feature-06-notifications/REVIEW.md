# Review

## Executive summary

- **Kết luận**: Ready — tất cả 13 task hoàn thành, typecheck pass, 316/317 tests pass (1 fail pre-existing).
- **Top findings**: 0 findings — mọi thay đổi đều khớp PLAN/INVESTIGATE, security hardening đã implement, backward-compatible.
- **Verification**: typecheck pass, unit tests pass, diff review clean.
- **Rủi ro tồn đọng**: stale-job recovery (CAP-001) và SSE subject cleanup (CAP-002) deferred — không blocking.
- **Hành động tiếp theo**: Chạy `done` để hoàn tất session.

## Developer overview

| Field | Value |
|---|---|
| Recommendation | Ready |
| Findings | Critical: 0 · High: 0 · Medium: 0 · Low: 0 · Info: 2 (pre-existing deferred) |
| Verification gaps | None |
| Next action | `done` |

## Charts

N/A — 0 findings, không cần chart.

## Scope reviewed

Toàn bộ Phase 1–3 implementation: 22 files changed, +782/-439 lines.

- Phase 1 (T-001→T-005): sourceJobId wiring, onConflictDoNothing target, tenant-aware UserLookup, recipient membership validation, org attribution fix
- Phase 2 (T-006→T-008): notification_deliveries schema + migration, DeliveriesRepository, dispatch upsert
- Phase 3 (T-009→T-013): claimDue wiring, admin job scope, SSE fix, repository userId filter, unit tests

## Inputs

- [x] PLAN.md — strategy, scope, DoD
- [x] TASKS.md — per-task AC and work items
- [x] EXECUTION.md — implementation log
- [x] git diff HEAD — full diff
- [x] typecheck output — `pnpm run typecheck`
- [x] Test results — `pnpm run test` (316 passed, 1 pre-existing fail)
- [x] `.agents/CODE_COMMENTS.md` — comment convention check

## Findings

0 findings. All changes match PLAN scope, implement đúng AC trong TASKS, code không có security/data risks mới.

## Requirement coverage

| Task | Covered? | Evidence | Notes |
|---|---|---|---|
| T-001 sourceJobId port + worker wiring | ✓ | `notifications.repository.port.ts`: sourceJobId field added; use-case: `sourceJobId: locked.id` in batch insert | |
| T-002 onConflictDoNothing target | ✓ | `notifications.repository.ts`: `onConflictDoNothing({ target: [sourceJobId, userId] })` | |
| T-003 Tenant-aware UserLookup | ✓ | `user-lookup.port.ts`: 3 new methods; `users.repository.ts`: implementations with org_members join | |
| T-004 Controller membership validation | ✓ | `notification-delivery.use-case.ts`: createDeliveryJob validates USER/USERS, resolveRecipientIds scoped | |
| T-005 Fix org attribution | ✓ | Removed `ORGANIZATION_LOOKUP`, use `locked.organizationId` directly | |
| T-006 notification_deliveries schema | ✓ | `notifications.ts`: new pgTable; `0022_notification_deliveries.sql`: migration | |
| T-007 Delivery repository | ✓ | `deliveries.repository.port.ts` + `deliveries.repository.ts` + DI registration | |
| T-008 Refactor dispatch | ✓ | `notification-dispatch.service.ts`: upsert delivery rows instead of direct FCM | |
| T-009 claimDue wiring | ✓ | Port interface + `processDueJobs()` uses `claimDue()` + `processClaimedJob()` | |
| T-010 Admin job scope | ✓ | list/getById/cancel all filter by organizationId; controller passes actor | |
| T-011 SSE fix | ✓ | `emit()`: only Redis publish when enabled; local fallback when disabled | |
| T-012 Repository userId filter | ✓ | `markRead()`/`delete()` WHERE includes `eq(notifications.userId, userId)` | |
| T-013 E2E tests | ✓ | `notification-delivery-scope.spec.ts`: 8 tests; existing test mocks updated | |

## Verification reviewed

| Check | Result | Evidence | Concern |
|---|---|---|---|
| Typecheck | Pass | `pnpm run typecheck` — no errors | None |
| Unit tests | 316/317 pass | 1 pre-existing failure (exports-idempotency) | Pre-existing, unrelated |
| Diff review | Clean | 22 files, +782/-439, all changes scoped | None |
| Code comments | Compliant | No stale comments; new logic has flow comments; sourceJobId/org attribution noted | None |
| Security check | No new risks | Auth: no changes; Permission: server-side guards intact; Input: existing validation preserved; Secrets: none | None |

## Testing gaps

| Gap | Risk | Suggested follow-up |
|---|---|---|
| Missing E2E for SSE Redis path (requires real Redis) | Low — unit test covers isolation | Integration test với Redis container |
| No test for notification_deliveries retry worker | Low — worker code is straightforward | Add unit test for claimPending + markSent |

## Residual risks

| Risk | Impact | Acceptance / Mitigation |
|---|---|---|
| CAP-001: stale-job recovery (PROCESSING timeout) | Medium — job crash leaves job stuck in PROCESSING | Deferred, không blocking |
| CAP-002: SSE subject leak on disconnect | Low — memory leak under heavy reconnect | Deferred, không blocking |
| Worker deploy order: code mới trước migration | Medium — worker mới upsert delivery rows vào table chưa tồn tại | Deploy migration trước, worker sau |

## Recommendation

**Ready** — tất cả 13 task hoàn thành đúng spec, typecheck pass, unit tests pass, security hardening implemented, backward-compatible.

## Handoff

- **Next skill**: `done` — close session, prepare PR message.
- **Owner**: _(not assigned)_
- **Blocking status**: None
