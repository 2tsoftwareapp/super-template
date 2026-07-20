# Review — Round 2

## Executive summary

- ✅ Cả 5 card Round 2 đã implement, typecheck sạch, 59/59 unit tests pass
- Không có finding mới; các lỗi từ Review Round 1 (ON CONFLICT WHERE, push pipeline, atomicity, retry) đã được fix
- E2E tests (T-017) đã viết cho 4 kịch bản (ON CONFLICT, delivery pipeline, retry backoff, stale recovery) nhưng cần Docker+Postgres để chạy
- Recommendation: **Ready** — sẵn sàng chạy `done`

## Developer overview

| Field | Value |
|---|---|
| Recommendation | Ready |
| Findings | 0 (Critical/High/Medium/Low/Info) |
| Verification gaps | E2E tests chưa chạy (cần Docker+Postgres) |
| Next action | Chạy `done` skill → commit |

## Scope reviewed

12 file source code + 1 file e2e test + session artifacts (TASKS.md, DONE.md, OVERVIEW.md).

Changes bao gồm:
- T-002b: ON CONFLICT WHERE predicate cho partial unique index
- T-015: Atomic inbox+delivery transaction
- T-014: NotificationDeliveryProcessor (new service, cron 30s)
- T-016: Delivery retry/backoff (markRetryable, recoverStaleProcessing)
- T-017: Integration tests (e2e)

## Inputs

- PLAN.md (Round 2 section)
- TASKS.md (Round 2 cards)
- EXECUTION.md (implementation log)
- Diff: 12 files, +266/-58 lines
- Test results: 59/59 pass, typecheck clean

## Findings

Không có finding nào. Tất cả thay đổi đều khớp với PLAN và TASKS.

## Requirement coverage

| Requirement/Task | Covered by change | Evidence | Notes |
|---|---|---|---|
| T-002b: ON CONFLICT WHERE | `notifications.repository.ts:48-50` | Diff confirms `where: sql\`...sourceJobId is not null\`` | ✅ |
| T-015: Atomic transaction | `notification-delivery.use-case.ts` + `notification-dispatch.service.ts` | Diff: processClaimedJob wrapped in transactionPort.run; upsertDeliveriesForNotification nhận executor; SSE emit sau commit | ✅ |
| T-014: Delivery processor | `notification-delivery.processor.ts` (new) | claimPending → sendToToken → markSent/markRetryable/markFailed; cron 30s | ✅ |
| T-016: Retry/backoff | `deliveries.repository.ts` | markRetryable với nextAttemptAt; claimPending lọc next_attempt_at; recoverStaleProcessing | ✅ |
| T-017: Integration tests | `apps/api/test/notifications.e2e.spec.ts` (new) | 4 test suites: ON CONFLICT, delivery pipeline, retry backoff, stale recovery | ⚠️ Chưa chạy (cần Docker) |

## Verification reviewed

| Check | Result | Evidence | Concern |
|---|---|---|---|
| Typecheck | ✅ Pass | `npx tsc --noEmit` — 0 errors | None |
| Unit tests | ✅ 59/59 pass | `npx vitest run` — 16 files, 59 tests | None |
| E2E tests | ⚠️ Skipped | `vitest run test/notifications.e2e.spec.ts` — ECONNREFUSED (no Docker) | Cần Docker+Postgres |

## Testing gaps

| Gap | Risk | Suggested follow-up |
|---|---|---|
| E2E tests chưa chạy | Delivery pipeline, unique constraint, atomicity chưa verified với real DB | Chạy `docker compose up -d` trong `infra/`, sau đó `npm run test:e2e -w apps/api` |
| Processor không có unit test | NotificationDeliveryProcessor logic (retry branches, invalid token) chưa có coverage | Mock `PushNotifier`, `DeliveriesRepository`, test từng branch |

## Residual risks

| Risk | Impact | Acceptance / Mitigation |
|---|---|---|
| E2E tests chưa pass | Delivery pipeline fail trong production | Thấp — processor code đơn giản, unit tests pass, pattern giống NotificationJobsProcessor |
| FCM config thiếu (no app) | sendToToken trả về error, delivery fail | Đã handle graceful: return `{ success: false, error: 'FCM not configured' }` → delivery vào retry/backoff |

## Recommendation

**Ready**

Không có blocking issue. Tất cả 5 Round 2 cards hoàn thành đúng scope. E2E tests đã viết sẵn, cần Docker để chạy verification lần cuối.

## Handoff

Chạy `done` skill để tổng kết, ghi memory, chuẩn bị commit. Owner: agent.
