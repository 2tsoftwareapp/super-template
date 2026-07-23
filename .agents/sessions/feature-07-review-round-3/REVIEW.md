# Review: Feature 07 — Background Jobs (Round 3)

## Executive summary (80/20)

- **Recommendation:** `Needs fix`
- **Top findings:** Worker fencing được thêm ở repository nhưng application bỏ qua kết quả transition; stale worker vẫn có thể ghi attempt/event sai. Mail và notification idempotency chưa thực sự ngăn side effect trùng.
- **Dependency risk:** Failure propagation chưa bao phủ cancel, no-handler, stale-exhausted và chuỗi dependency nhiều tầng; một số job phụ thuộc có thể nằm `PENDING` vĩnh viễn.
- **Verification status:** Static review trên đúng commit `cee1d1292f2a66acb36b3d47eec4b260160a497c`; không có CI status. E2E source vẫn gọi signature cũ và test payload redaction không kiểm tra list response.
- **Next action:** Quay lại `planning`/`execution`, ưu tiên H-001 → H-004, bổ sung concurrency/crash-window E2E rồi review round 4.

## Developer overview

- **Recommendation:** `Needs fix`
- **Finding counts:**
  - Critical: 0
  - High: 4
  - Medium: 3
  - Low: 2
  - Info: 1
- **Verification gaps:** Không tìm thấy `PLAN.md`, `TASKS.md`, `EXECUTION.md` gắn trực tiếp với Feature 07 Round 2; GitHub không trả CI status cho commit; chưa có test concurrency cho fencing, timeout, handler idempotency và propagation.
- **Next action:** Chuyển về `planning`; không `done`/PR cho baseline này.

## Scope reviewed

Review chính xác commit `cee1d1292f2a66acb36b3d47eec4b260160a497c` và các yêu cầu R2-01 → R2-14 được ghi trong commit message, gồm:

- Tenant/platform scope trên jobs repository, use cases và controller.
- Worker lease, fencing, retry, stale recovery và observability.
- Mail/notification handler idempotency.
- Dependency graph locking, cycle prevention và failure propagation.
- Payload redaction, metrics scope và global idempotency indexes.
- Unit/E2E evidence được commit tuyên bố.

Các commit sau `cee1d12` không được tính là bằng chứng fix cho verdict của baseline này; chúng cần review riêng.

## Inputs

- `.agents/settings.yaml`
- `.agents/skills/review/SKILL.md`
- `.agents/CODE_COMMENTS.md`
- Commit diff `cee1d1292f2a66acb36b3d47eec4b260160a497c`
- `packages/api-platform/src/modules/jobs/application/use-cases/process-jobs.use-case.ts`
- `packages/api-platform/src/modules/jobs/application/use-cases/cancel-job.use-case.ts`
- `packages/api-platform/src/modules/jobs/application/use-cases/add-job-dependency.use-case.ts`
- `packages/api-platform/src/modules/jobs/application/ports/jobs.repository.port.ts`
- `packages/api-platform/src/modules/jobs/infrastructure/jobs.repository.ts`
- `packages/api-platform/src/modules/jobs/infrastructure/job-observability.repository.ts`
- `packages/api-platform/src/modules/jobs/application/jobs.processor.ts`
- `packages/api-platform/src/modules/jobs/domain/job-lifecycle.ts`
- `packages/api-platform/src/modules/jobs/application/services/job-handlers.registry.ts`
- Mail delivery use case/repository/schema liên quan R2-04.
- Notification send use case/repository/schema liên quan R2-05.
- `apps/api/test/background-jobs-tenant.e2e.spec.ts`
- `PLAN.md`: Not found for this Feature 07 round.
- `TASKS.md`: Not found for this Feature 07 round.
- `EXECUTION.md`: Not found for this Feature 07 round.
- GitHub CI/status: no status returned for `cee1d12`.

## Findings

| ID | Severity | Category | Location | Evidence | Impact | Recommendation | Confidence |
|---|---|---|---|---|---|---|---|
| H-001 | High | Concurrency / Fencing / Observability integrity | `process-jobs.use-case.ts:98-130,137-163`; `jobs.repository.ts:194-222,253-267` | `markCompleted`, `markFailed` và `requeueForRetry` trả `null` khi worker/attempt fence không còn hợp lệ, nhưng use case không kiểm tra return value. Nó vẫn finish attempt, ghi `completed`/`failed`/`retry_scheduled` event và có thể propagate dependency. | Job row có thể thuộc worker/attempt mới nhưng timeline của attempt cũ vẫn báo completed/failed; metrics, debugging và downstream propagation sai. Timeout handler tiếp tục chạy làm xác suất stale completion cao hơn. | Trong cùng transaction, chỉ finish attempt/record terminal event/propagate khi fenced transition trả row. Nếu trả `null`, ghi outcome riêng như `SUPERSEDED` hoặc bỏ terminal event; thêm barrier test old worker vs recovered/reclaimed worker. | High |
| H-002 | High | Idempotency / Notification duplication | `job-handlers.registry.ts:80-99`; `send-notification.use-case.ts:75-85`; `notifications.repository.ts:26-34,37-54`; `schema/platform/notifications.ts:27-66` | Handler chỉ nhét `sourceBackgroundJobId` vào JSON `data`. Single-send flow gọi `notificationsRepository.create()` plain insert và không populate `notifications.sourceJobId`. Unique index hiện tại chỉ bảo vệ `source_job_id + user_id`, trong khi `source_job_id` còn FK tới `notification_jobs`, không phải generic background `jobs`. | Retry/timeout/concurrent execution của `notification.send` tạo nhiều inbox items và nhiều delivery rows/push attempts. R2-05 chưa đạt. | Thêm identity riêng cho generic background job (`sourceBackgroundJobId` column/idempotency key) vào command, schema và repository; persist bằng `onConflictDoNothing`/upsert đúng target trước dispatch. Test hai worker cùng job và retry sau crash. | High |
| H-003 | High | Idempotency / External side effect / Mail | `send-mail-template.use-case.ts:62-93`; `mail-deliveries.repository.ts:26-36`; mail delivery unique index trong commit | SMTP được gọi trước insert delivery. Unique index và `onConflictDoNothing()` chỉ chạy sau external side effect. Hai worker có thể cùng gửi rồi mới conflict. Nếu lần đầu tạo `FAILED`, retry gửi thành công nhưng `SENT` insert conflict và bị bỏ qua. | Email gửi trùng; history có thể còn `FAILED` trong khi job `COMPLETED`; verify/reset/admin mail có side effect không đáng tin cậy. R2-04 chưa đạt. | Reserve/claim durable delivery row trước SMTP, dùng state machine `PENDING/PROCESSING/SENT/FAILED` trên cùng identity; lock/fence delivery claim và update row khi retry. Thêm SMTP-success/DB-failure và concurrent-send tests. | High |
| H-004 | High | Dependency lifecycle / Queue liveness | `process-jobs.use-case.ts:98-112,137-186`; `cancel-job.use-case.ts:33-56`; `jobs.processor.ts:68-83`; `jobs.repository.ts:151-191,270-321` | Propagation chỉ chạy ở terminal handler catch. No-handler path mark `FAILED` rồi return; cancel path không propagate; stale recovery exhausted chỉ đổi status/log. Propagation dùng nested transaction riêng, swallow mọi lỗi, chỉ block direct dependents. Claim query từ chối mọi prerequisite khác `COMPLETED`, nên child/grandchild còn lại không bao giờ chạy. | Job phụ thuộc có thể nằm `PENDING` vĩnh viễn; dependency chain nhiều tầng không hội tụ về `BLOCKED`; queue liveness và operator diagnostics sai. | Tạo một terminal-transition/propagation service dùng cho `FAILED`, `CANCELLED`, `BLOCKED`, no-handler và stale-exhausted. Chạy atomic với transition hoặc transactional outbox; propagate transitive bằng BFS/recursive CTE; không swallow lỗi âm thầm. | High |
| M-001 | Medium | Multi-tenant / Defense in depth | `jobs.repository.port.ts:142-150`; `jobs.repository.ts:239-250,335-348`; `process-jobs.use-case.ts:167-179` | `listDependents` và `markBlocked` không nhận `JobScope`; query chạy bằng worker dispatch context. Event của dependent dùng `organizationId` của parent thay vì tenant thực tế của dependent. Same-scope validation chỉ tồn tại lúc add qua use case, không có DB invariant bảo vệ dữ liệu legacy/manual/corrupt. | Một edge sai scope có thể dẫn tới worker đọc/update job tenant khác và ghi event sai tenant. | Bắt buộc scope trên port/repository; query join và filter organization; trả `organizationId` của dependent và dùng chính giá trị đó cho event; thêm DB constraint/trigger hoặc migration validation cho graph hiện hữu. | High |
| M-002 | Medium | Atomic observability | `jobs.repository.ts:151-191`; `process-jobs.use-case.ts:39-53,80-94` | `claimDueJobs()` đổi job sang `PROCESSING` và commit trước; `startAttempt + claimed event` diễn ra ở transaction khác sau khi loop bắt đầu. Crash giữa hai bước tạo job PROCESSING không có attempt/claimed event. | R2-12 “claim + event atomic” chưa đạt; stale recovery có thể xử lý job không có timeline gốc, metrics attempts thiếu. | Claim job và tạo attempt/claimed event trong một transaction/CTE, hoặc repository trả claim token và transaction service persist cả ba thay đổi trước khi giao handler. | High |
| M-003 | Medium | Verification / Test correctness | `background-jobs-tenant.e2e.spec.ts:73-77,194-216,245-257`; `jobs.repository.port.ts:87-150` | E2E vẫn gọi `findById(job.id)` không truyền scope và gọi `markCompleted/markFailed` thiếu workerId/attempts theo signature mới. Test “redacts payload in list view” chỉ enqueue rồi assert secret vẫn nguyên, không gọi list API và không assert `{}`. | R2-13 chưa được chứng minh; test có thể fail runtime hoặc pass mà không kiểm tra requirement; regression security/concurrency lọt qua. | Sửa E2E dùng HTTP + bearer token cho list/detail, assert list payload redacted; seed claimed job đúng worker/attempt khi test fence; thêm test compile (`tsc --noEmit` cho tests) và chạy PostgreSQL E2E trong CI. | High |
| L-001 | Low | Operability / Worker identity | `process-jobs.use-case.ts:27`; `jobs.processor.ts:20,76-82` | Hai file tạo hai `WORKER_ID` random độc lập; recovery log hiển thị identity không phải identity đã claim job. ID cũng đổi mỗi process restart. | Correlation log khó, điều tra stale lease/worker crash dễ nhầm instance. | Inject một `WorkerIdentity` dùng hostname/pod UID/process UUID và dùng thống nhất cho claim, event, metric, recovery log. | High |
| L-002 | Low | Code comments / Maintainability | `process-jobs.use-case.ts:74-79,115-186`; `.agents/CODE_COMMENTS.md` | Flow concurrency nhiều giai đoạn không có TSDoc/numbered `Step N`. Comment R2-6 nói propagation chạy cho job `BLOCKED/FAILED` từ cycle trước nhưng code thực tế propagation sau handler failure; comment đã lệch logic. `isBlockingStatus` được import nhưng không dùng. | Reviewer khó xác định transaction/fence ownership; comment rot che giấu incomplete implementation. | Viết flow comment theo convention, mô tả claim → attempt → handler → fenced transition → propagation; xoá/sửa comment stale và unused import. | High |
| I-001 | Info | Review evidence | Commit metadata / GitHub status | Commit message tự khai `unit tests pass 6/6`, nhưng không có CI status hoặc session execution log để đối chiếu; E2E source còn vấn đề M-003. | Không thể nâng verdict dựa trên self-reported verification. | Lưu command/output trong `EXECUTION.md`, chạy required checks trong CI và gắn status vào commit trước review lại. | High |

## Requirement coverage

| Requirement / Task | Covered by change? | Evidence | Notes |
|---|---|---|---|
| R2-01 Mandatory `JobScope` | Partial | Port/list/find/cancel/controller có scope | Propagation repository boundary vẫn unscoped (M-001). |
| R2-02 Worker fencing | Partial | SQL transition filter `workerId + attempts` | Application bỏ qua transition result (H-001). |
| R2-03 Per-row stale recovery | Partial | Repository phân `requeued` và `failed` theo attempts/maxAttempts | Failed stale jobs không close attempt/event/propagate (H-004, M-002). |
| R2-04 Mail idempotency | No | Unique index + `onConflictDoNothing` | Barrier đặt sau SMTP; không ngăn duplicate side effect (H-003). |
| R2-05 Notification idempotency | No | `sourceBackgroundJobId` chỉ nằm trong JSON data | Không populate column/index dùng cho dedupe (H-002). |
| R2-06 Correct dependent direction | Partial | Query đúng chiều `depends_on_job_id → job_id` | Không atomic, không transitive, bỏ sót terminal paths (H-004). |
| R2-07 `BLOCKED` terminal/blocking | Partial | Domain set có `BLOCKED`, claim chỉ cho dependency completed | Graph không hội tụ về BLOCKED ở cancel/no-handler/stale/transitive chain. |
| R2-08 Cycle check + advisory lock | Yes | Lock + reads + cycle check + insert trong cùng transaction | Cần concurrency E2E để xác nhận runtime. |
| R2-09 Only PENDING job accepts dependency | Yes | Status validation trước insert | Covered statically. |
| R2-10 Payload redaction | Implementation yes / verification no | `JobsMapper.toJobListView()` trả `payload: {}` | E2E hiện không gọi list endpoint (M-003). |
| R2-11 Global idempotency NULL semantics | Yes statically | Partial unique index/migration trong diff | Chưa có migration integration evidence. |
| R2-12 Atomic observability | Partial | Cancel + event và attempt + claimed event có transaction riêng | Claim row và claimed event không cùng transaction (M-002). |
| R2-13 Bearer-token E2E scope | No | Một số setup dùng bearer token | Test repository signature cũ và redaction assertion sai mục tiêu (M-003). |
| R2-14 Clean typecheck + unit tests | Needs more verification | Commit message ghi 6/6 | Không có CI/session logs; E2E source không tương thích. |

## Verification reviewed

| Check | Result | Evidence | Concern |
|---|---|---|---|
| Static architecture review | Pass with findings | Ports/use cases/infrastructure nhìn chung đúng layer | Concurrency ownership và propagation service chưa rõ. |
| Tenant isolation | Fail / partial | Admin queries scoped | Worker propagation unscoped (M-001). |
| Worker fencing | Fail | Repository fence có mặt | Result không được application enforce (H-001). |
| Handler idempotency | Fail | Mail/notification paths reviewed | H-002, H-003. |
| Dependency liveness | Fail | Claim predicate + all terminal paths reviewed | H-004. |
| Atomic observability | Fail / partial | Cancel atomic; claim separated | M-002. |
| Payload redaction implementation | Pass statically | Mapper list returns `{}` | Automated evidence invalid (M-003). |
| Unit tests | Needs more verification | Commit self-reports 6/6 | Không có raw output/artifact. |
| E2E tests | Fail review | Source inspected | Signature mismatch và false redaction test. |
| CI status | Missing | GitHub returned no status | Không có required check evidence. |
| Code comment convention | Fail / partial | Complex worker flow inspected | L-002. |

## Testing gaps

| Gap | Risk | Suggested follow-up |
|---|---|---|
| Old worker completes after lease recovery/new claim | False terminal events and duplicate side effects | Barrier test with attempts N/N+1; assert old worker cannot finish attempt/event/propagate. |
| Handler timeout does not cancel underlying promise | Old side effect continues while retry starts | Fake slow handler + AbortSignal contract or explicit at-least-once idempotency test. |
| Concurrent mail execution | Duplicate SMTP send | Two workers, same job ID, assert one durable claim and one mailer call. |
| Notification retry | Duplicate inbox/push rows | Run same background job twice, assert one notification identity/delivery set. |
| No-handler/cancel/stale failure | Dependents stuck PENDING | E2E each terminal path, plus A → B → C transitive chain. |
| Propagation failure mid-transaction | Parent failed but children not blocked | Failure injection/outbox retry test. |
| Cross-tenant corrupt dependency edge | Worker updates wrong tenant | Seed invalid edge under admin connection; assert scoped repository rejects it. |
| Claim crash window | PROCESSING job without attempt/event | Failure injection between claim and observability write. |
| Redaction through HTTP | Secret exposed in list | Bearer-token `GET /admin/jobs` assertion for nested secret keys. |
| Migration/index semantics | Production migration mismatch | Apply migrations from clean DB and upgrade DB; inspect indexes/FKs. |

## Residual risks

- `Promise.race` timeout không hủy handler; hệ thống vẫn là at-least-once và mọi handler external phải có durable idempotency.
- Lease không được heartbeat/renew; handler gần ngưỡng timeout dễ bị retry nếu process/DB delay.
- Batch-isolation event được fire-and-forget và swallow error; execute có thể return trước khi event hoàn tất.
- Các status/event types còn dùng `string`/`as any`, làm compiler không bảo vệ lifecycle đầy đủ.
- Các commit sau baseline có thể đã sửa một phần, nhưng phải được review lại trên diff riêng trước khi đóng Feature 07.

## Recommendation

**Needs fix**

## Handoff

- **Next action/skill:** `planning` → `execution` → `review` round 4
- **Owner:** Agent / Developer
- **Blocking status:** Có — H-001, H-002, H-003, H-004
- **Ready for done/PR:** No
