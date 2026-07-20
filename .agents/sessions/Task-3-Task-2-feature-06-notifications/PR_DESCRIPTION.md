# Round 2 fixes — Notification delivery pipeline + atomicity + retry

## Summary

Fix 5 blocking items from Feature 06 Notifications Review Round 2 (3 P0, 2 P1):

- **ON CONFLICT WHERE** — thêm `where` predicate để match partial unique index
- **Delivery processor** — cron worker gửi FCM từ delivery rows
- **Atomic transaction** — inbox insert + delivery upsert trong cùng DB transaction
- **Retry/backoff** — exponential backoff, stale recovery, claimPending filter
- **Integration tests** — e2e test file cho DB-level invariants

## Changes

| Area | Change |
|---|---|
| notifications.repository.ts | ON CONFLICT WHERE (`sourceJobId is not null`); `findBySourceJobAndUsers`; `findById` orgId optional |
| notification-delivery.use-case.ts | Inject `TransactionPort`; wrap batch loop trong transaction; SSE emit sau commit |
| notification-dispatch.service.ts | `emitSSE` method; `upsertDeliveriesForNotification` nhận executor |
| push.interface.ts + fcm-push.service.ts | `sendToToken` method + `PushSendResult` |
| device-tokens.repository | `listByIds` |
| deliveries.repository | `markRetryable`; `recoverStaleProcessing`; `claimPending` WHERE filter |
| notification-delivery.processor.ts (new) | Cron 30s: claimPending → sendToToken → markSent/Retryable/Failed |
| notifications.e2e.spec.ts (new) | 4 test suites (ON CONFLICT, delivery pipeline, retry, stale recovery) |

## Verification

- Typecheck: ✅ pass
- Unit tests: 59/59 ✅ pass
- E2E tests: ⚠️ written (cần Docker+Postgres để chạy)

## Reviewer focus

- Atomic transaction boundary — SSE emit đúng ngoài transaction?
- NotificationDeliveryProcessor retry logic — invalid token cleanup, max attempts threshold
- ON CONFLICT WHERE predicate — match partial unique index?

## Risks

- E2E tests chưa chạy với real DB — viết sẵn, cần Docker
- Processor chưa có unit test coverage
